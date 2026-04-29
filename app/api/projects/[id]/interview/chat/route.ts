import Anthropic from '@anthropic-ai/sdk'
import { buildInterviewQualityContext } from '@/lib/ai-quality'
import { createClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPTS } from '@/lib/characters'
import { buildInterviewFocusThemeContext, getCompetitorThemeSourcesForTheme } from '@/lib/interview-focus-theme'
import { logApiUsage, checkRateLimit } from '@/lib/api-usage'
import { isFreePlanLocked } from '@/lib/plans'
import { getMemberRole } from '@/lib/project-members'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30_000 })
const PASS_QUESTION_TOKEN = '__PASS_QUESTION__'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  if (!(await checkRateLimit(user.id, '/api/projects/[id]/interview/chat')).allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return new Response('Bad Request', { status: 400 })
  const { interviewId, userMessage } = body as Record<string, unknown>
  if (typeof interviewId !== 'string' || typeof userMessage !== 'string') {
    return new Response('Bad Request', { status: 400 })
  }
  if (userMessage.length > 2000) {
    return new Response(JSON.stringify({ error: 'メッセージが長すぎます' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  const isGreeting = userMessage === '__GREETING__'
  const isPassQuestion = userMessage === PASS_QUESTION_TOKEN

  // インタビュー確認（project所有確認も兼ねる）
  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, project_id, focus_theme_mode, focus_theme, interviews_project:projects(user_id, name, hp_url)')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single()

  if (!interview) return new Response('Not found', { status: 404 })

  const projectData = !interview.interviews_project || Array.isArray(interview.interviews_project)
    ? null
    : interview.interviews_project as { user_id: string; name: string | null; hp_url: string }

  // role-based アクセスチェック: オーナーまたはeditorのみ
  const isOwner = projectData?.user_id === user.id
  if (!isOwner) {
    const memberRole = await getMemberRole(supabase, projectId, user.id)
    if (memberRole !== 'editor') {
      return new Response('Forbidden', { status: 403 })
    }
  }

  // 月次上限チェックはオーナーのuser_idで判定（メンバーが使ってもオーナーの枠から消費）
  const ownerUserId = projectData?.user_id ?? user.id
  if (await isFreePlanLocked(supabase, ownerUserId)) {
    return NextResponse.json({ error: 'free_plan_locked' }, { status: 403 })
  }

  // ユーザーメッセージ保存
  if (!isGreeting && !isPassQuestion) {
    await supabase.from('interview_messages').insert({
      interview_id: interviewId,
      role: 'user',
      content: userMessage,
    })
  }

  // 会話履歴取得（最新100件に制限して過大なコンテキスト送信を防ぐ）
  const { data: history } = await supabase
    .from('interview_messages')
    .select('role, content')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (isGreeting && history && history.length > 0) {
    return new Response('', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const userTurnCount = (history ?? []).filter(m => m.role === 'user').length

  const messages = isGreeting
    ? [{ role: 'user' as const, content: 'はじめまして。よろしくお願いします。' }]
    : [
        ...(history ?? []).map((m) => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        })),
        ...(isPassQuestion
          ? [{
              role: 'user' as const,
              content: '今の質問はパスしたいです。無理に同じ問いを続けず、これまでの話を踏まえて別の切り口から短く1つだけ質問してください。',
            }]
          : []),
      ]

  // 取材先情報と調査結果をコンテキストに注入
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: auditRow } = await supabase
    .from('hp_audits')
    .select('raw_data')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const auditRawData = (auditRow?.raw_data ?? null) as Record<string, unknown> | null

  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

  const audit = auditRawData
    ? {
        gaps: toStringArray(auditRawData.gaps),
        suggested_themes: toStringArray(auditRawData.suggested_themes),
        strengths: toStringArray(auditRawData.strengths),
        priority_actions: toStringArray(auditRawData.priority_actions),
        conversion_obstacles: toStringArray(auditRawData.conversion_obstacles),
        blog_posts: toStringArray(
          Array.isArray(auditRawData.blog_posts)
            ? auditRawData.blog_posts.map((p: unknown) => (p && typeof p === 'object' && 'title' in p ? (p as { title: string }).title : null)).filter(Boolean)
            : [],
        ),
        blog_classification_summary: (auditRawData.blog_classification_summary ?? null) as {
          byGenre?: Array<{ key: string; label: string; count: number }>
          byEffect?: Array<{ key: string; label: string; count: number }>
          total?: number
        } | null,
      }
    : null

  // 過去インタビューのテーマ・生成済み記事タイトルを取得（現在のインタビューは除く）
  const [{ data: pastInterviews }, { data: pastArticles }] = await Promise.all([
    supabase
      .from('interviews')
      .select('focus_theme')
      .eq('project_id', projectId)
      .neq('id', interviewId ?? '')
      .not('focus_theme', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('articles')
      .select('title')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const pastInterviewThemes = (pastInterviews ?? []).map((r: { focus_theme: string }) => r.focus_theme).filter(Boolean)
  const pastArticleTitles = (pastArticles ?? []).map((r: { title: string }) => r.title).filter(Boolean)
  const pastCoverage = [...pastInterviewThemes, ...pastArticleTitles]

  const { data: competitorThemeRows } = await supabase
    .from('competitor_analyses')
    .select('raw_data, competitors(url)')
    .eq('project_id', projectId)

  const competitorRows = (competitorThemeRows ?? []) as Array<{
    raw_data: Record<string, unknown> | null
    competitors: { url: string } | { url: string }[] | null
  }>

  const matchingCompetitorSources = getCompetitorThemeSourcesForTheme(
    competitorRows,
    interview.focus_theme,
  )

  // 競合が書いていて自社にないテーマ（全競合分を統合）
  const allCompetitorGaps: string[] = []
  for (const row of competitorRows) {
    const gaps = toStringArray(row.raw_data?.gaps)
    for (const gap of gaps) {
      if (!allCompetitorGaps.includes(gap)) allCompetitorGaps.push(gap)
    }
  }

  const contextParts: string[] = []
  if (projectData) {
    contextParts.push(`【取材先】\n取材先名: ${projectData.name ?? '未設定'}\nHP URL: ${projectData.hp_url ?? '未設定'}`)
    contextParts.push(
      `【このインタビューのスコープ】\n以下の情報はすべて今日の取材先「${projectData.name ?? '未設定'}」のものです。他社・他の取材先の情報は含まれていません。このセッションの外の情報には言及しないでください。`
    )
  }
  const focusThemeContext = buildInterviewFocusThemeContext(interview.focus_theme_mode, interview.focus_theme)
  if (focusThemeContext) {
    contextParts.push(focusThemeContext)
  }
  if (profile?.name) {
    contextParts.push(`【話し相手】\nお名前: ${profile.name}`)
  }
  if (matchingCompetitorSources.length > 0) {
    contextParts.push(`【競合がこのテーマで伝えていること】\n${matchingCompetitorSources.map((source) => `・${source.url ?? '競合サイト'}: ${source.summary}`).join('\n')}`)
  }
  if (audit) {
    if (audit.gaps.length) contextParts.push(`【HPで伝えきれていないこと（調査結果）】\n${audit.gaps.map((g) => `・${g}`).join('\n')}`)
    if (audit.suggested_themes.length) {
      const themeFrequency = audit.suggested_themes.map((theme) => {
        const keywords = theme.replace(/[、。・]/g, ' ').split(/\s+/).filter((w) => w.length >= 2)
        const count = pastCoverage.filter((t) => keywords.some((kw) => t.includes(kw))).length
        return { theme, count }
      })
      const fresh = themeFrequency.filter((t) => t.count === 0).map((t) => t.theme)
      const revisit = themeFrequency.filter((t) => t.count >= 1 && t.count <= 2).map((t) => `${t.theme}（${t.count}回取り上げ済み）`)
      const saturated = themeFrequency.filter((t) => t.count >= 3).map((t) => `${t.theme}（${t.count}回取り上げ済み）`)

      contextParts.push(
        `【インタビューで深めたいテーマ（調査結果）】\n` +
        `未取り上げ（優先して掘り下げる）:\n${fresh.length > 0 ? fresh.map((t) => `・${t}`).join('\n') : '（なし）'}\n\n` +
        `取り上げ済み・別角度から可（1〜2回）:\n${revisit.length > 0 ? revisit.map((t) => `・${t}`).join('\n') : '（なし）'}\n\n` +
        `当面は避ける（3回以上）:\n${saturated.length > 0 ? saturated.map((t) => `・${t}`).join('\n') : '（なし）'}\n\n` +
        `未取り上げのテーマを優先し、取り上げ済みのものは同じ切り口を繰り返さず別の角度から掘り下げる場合のみ選んでください。3回以上のテーマは他に選択肢がない場合を除き避けてください。`
      )
    }
  }

  // キャラ別コンテキスト注入
  const characterContext = buildCharacterSpecificContext(
    interview.interviewer_type,
    audit,
    allCompetitorGaps,
  )
  if (characterContext) {
    contextParts.push(characterContext)
  }

  const interviewQualityContext = buildInterviewQualityContext({
    messages: (history ?? []).map((message) => ({
      role: message.role === 'user' ? 'user' : 'interviewer',
      content: message.content,
    })),
    userTurnCount,
    isGreeting,
    isPassQuestion,
    focusTheme: interview.focus_theme,
  })
  if (interviewQualityContext) {
    contextParts.push(interviewQualityContext)
  }

  if (userTurnCount >= 7) {
    contextParts.push(`【現在の状況】ユーザーは${userTurnCount}回返答しました。`)
  }

  const systemPrompt = (SYSTEM_PROMPTS[interview.interviewer_type] ?? SYSTEM_PROMPTS['mint'])
    + (contextParts.length ? '\n\n' + contextParts.join('\n\n') : '')

  let stream: Awaited<ReturnType<typeof anthropic.messages.stream>>
  try {
    stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })
  } catch (err) {
    const isTimeout = err instanceof Error && (err.message.includes('timeout') || err.constructor.name === 'APIConnectionTimeoutError')
    console.error('[interview/chat] Anthropic API error:', err)
    return Response.json(
      { code: isTimeout ? 'TIMEOUT' : 'AI_ERROR', message: 'もう一度お試しください。' },
      { status: 503 },
    )
  }

  let fullText = ''
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullText += chunk.delta.text
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
      } catch (err) {
        console.error('[interview/chat] stream error:', err)
        controller.error(err)
        return
      }

      // トークン使用量をログ
      const finalMsg = await stream.finalMessage().catch(() => null)
      if (finalMsg) {
        logApiUsage({
          userId: (await supabase.auth.getUser()).data.user?.id,
          projectId,
          route: 'interview/chat',
          model: 'claude-sonnet-4-6',
          inputTokens: finalMsg.usage.input_tokens,
          outputTokens: finalMsg.usage.output_tokens,
        }).catch(() => {})
      }

      // AIメッセージ保存（[INTERVIEW_COMPLETE]マーカーは除いて保存）
      const cleanText = fullText.replace(/\[INTERVIEW_COMPLETE\]\s*$/m, '').trim()
      if (cleanText) {
        const { error } = await supabase.from('interview_messages').insert({
          interview_id: interviewId,
          role: 'interviewer',
          content: cleanText,
        })
        if (error) console.error('[interview/chat] failed to save message:', error.message)
      }

      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

// ---- キャラ別コンテキストビルダー ----

type AuditContext = {
  gaps: string[]
  suggested_themes: string[]
  strengths: string[]
  priority_actions: string[]
  conversion_obstacles: string[]
  blog_posts: string[]
  blog_classification_summary: {
    byGenre?: Array<{ key: string; label: string; count: number }>
    byEffect?: Array<{ key: string; label: string; count: number }>
    total?: number
  } | null
} | null

function buildCharacterSpecificContext(
  characterId: string,
  audit: AuditContext,
  competitorGaps: string[],
): string {
  if (!audit) return ''

  const parts: string[] = []

  // ブログの効果別カバレッジ（全キャラ共通の下地）
  const effectCoverage = buildEffectCoverage(audit.blog_classification_summary)

  if (characterId === 'mint') {
    // ミント: お客様目線で伝わっていないことを掘る
    // 信頼・共感系のブログが薄い場合に注目させる
    const thinEffects = effectCoverage.filter((e) => e.key === 'trust' || e.key === 'empathy').filter((e) => e.count === 0)
    if (thinEffects.length > 0) {
      parts.push(`【お客様目線で不足しているコンテンツ（調査結果）】\n以下のタイプの記事がブログにほとんどありません。お客様から見て「信頼できそう」「この人に頼んでみたい」と思える話が届いていない可能性があります。\n${thinEffects.map((e) => `・${e.label}`).join('\n')}`)
    }

    if (audit.blog_posts.length > 0) {
      parts.push(`【既存ブログ記事タイトル一覧（重複を避けるための参考）】\n${audit.blog_posts.slice(0, 15).map((t) => `・${t}`).join('\n')}`)
    }
  }

  if (characterId === 'claus') {
    // クラウス: 競合との差分と、業界・発見系の不足を深掘り
    if (competitorGaps.length > 0) {
      parts.push(`【競合が書いていて自社にないテーマ（競合調査結果）】\n以下のテーマは競合のHPやブログにあって、自社では扱えていません。ここに業種の専門性を絡めた深掘りの余地があります。\n${competitorGaps.slice(0, 4).map((g) => `・${g}`).join('\n')}`)
    }

    const thinEffects = effectCoverage.filter((e) => e.key === 'discovery' || e.key === 'trust').filter((e) => e.count === 0)
    if (thinEffects.length > 0) {
      parts.push(`【専門性で補強できるコンテンツの不足（調査結果）】\n${thinEffects.map((e) => `・${e.label}（${e.desc}）が0件`).join('\n')}\n業種ならではの知識や判断基準を語ることで補強できる余地です。`)
    }

    if (audit.strengths.length > 0) {
      parts.push(`【HPで見えている強み（参照用）】\n${audit.strengths.map((s) => `・${s}`).join('\n')}\nインタビューでは、ここに挙がっていない・HPで語られていない強みを引き出してください。`)
    }
  }

  if (characterId === 'rain') {
    // レイン: 問い合わせ転換につながっていない理由と競合差分を訴求として引き出す
    if (audit.conversion_obstacles.length > 0) {
      parts.push(`【問い合わせを妨げていそうな要因（調査結果）】\n${audit.conversion_obstacles.map((o) => `・${o}`).join('\n')}\nこれらを解消するエピソードや言葉を引き出すことが、このインタビューの勝負所です。`)
    }

    const thinConversion = effectCoverage.filter((e) => e.key === 'conversion').filter((e) => e.count === 0)
    if (thinConversion.length > 0) {
      parts.push(`【問い合わせにつながるコンテンツが不足（調査結果）】\n「読んで行動したくなる」記事がブログにほとんどありません。なぜ選ばれるのか・他と何が違うのかを、お客様目線の言葉で引き出してください。`)
    }

    if (competitorGaps.length > 0) {
      parts.push(`【競合が積極的に発信していて自社にないテーマ（競合調査結果）】\n${competitorGaps.slice(0, 3).map((g) => `・${g}`).join('\n')}\nこれらのテーマで自社独自の訴求を引き出せると、差別化の核になります。`)
    }

    if (audit.priority_actions.length > 0) {
      parts.push(`【次の発信で優先したいこと（調査結果）】\n${audit.priority_actions.map((a) => `・${a}`).join('\n')}`)
    }
  }

  return parts.join('\n\n')
}

function buildEffectCoverage(
  summary: { byEffect?: Array<{ key: string; label: string; count: number }> } | null | undefined,
): Array<{ key: string; label: string; desc: string; count: number }> {
  const EFFECT_META: Array<{ key: string; label: string; desc: string }> = [
    { key: 'discovery',  label: '集客・発見',    desc: 'SEOや紹介で新しい人に届く' },
    { key: 'trust',      label: '信頼・実績',    desc: '専門性や実績を証明する' },
    { key: 'empathy',    label: '共感・ファン化', desc: '人柄や思想を伝える' },
    { key: 'conversion', label: '問い合わせ促進', desc: '読んで行動につながる' },
  ]

  const byEffect = summary?.byEffect ?? []

  return EFFECT_META.map((meta) => {
    const found = byEffect.find((e) => e.key === meta.key)
    return { ...meta, count: found?.count ?? 0 }
  })
}
