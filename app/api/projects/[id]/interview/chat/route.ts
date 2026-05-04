import Anthropic from '@anthropic-ai/sdk'
import { buildInterviewQualityContext, buildInterviewStructureContext, detectQuestionRepetition } from '@/lib/ai-quality'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SYSTEM_PROMPTS } from '@/lib/characters'
import { buildInterviewFocusThemeContext, getCompetitorThemeSourcesForTheme } from '@/lib/interview-focus-theme'
import { fetchPriorMeetings, selectRelevantMemos } from '@/lib/interview-relationship'
import { fetchRespondentProfile, formatProfileForPrompt } from '@/lib/respondent-profile'
import { buildIndustryHintContext } from '@/lib/industry-hints'
import { fetchTopIndustryTerms, formatIndustryTermsForPrompt } from '@/lib/industry-terms'
import { logApiUsage, checkRateLimit } from '@/lib/api-usage'
import { isFreePlanLocked } from '@/lib/plans'
import { getMemberRole } from '@/lib/project-members'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30_000 })
const PASS_QUESTION_TOKEN = '__PASS_QUESTION__'
const CONTINUE_INTERVIEW_TOKEN = '__CONTINUE_INTERVIEW__'
const DEEP_DIVE_TOKEN = '__DEEP_DIVE__'

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
  const { interviewId, userMessage, attachments } = body as Record<string, unknown>
  if (typeof interviewId !== 'string' || typeof userMessage !== 'string') {
    return new Response('Bad Request', { status: 400 })
  }
  if (userMessage.length > 2000) {
    return new Response(JSON.stringify({ error: 'メッセージが長すぎます' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  // 画像添付（ハル限定）。各要素は { path: string, contentType: string }。
  // path は storage 内の interview-attachments バケットからのパス（例: '<project>/<interview>/<uuid>.jpg'）。
  type AttachmentInput = { path: string; contentType: string }
  const safeAttachments: AttachmentInput[] = Array.isArray(attachments)
    ? attachments
        .filter((a): a is AttachmentInput =>
          a !== null &&
          typeof a === 'object' &&
          typeof (a as { path?: unknown }).path === 'string' &&
          typeof (a as { contentType?: unknown }).contentType === 'string',
        )
        .slice(0, 4) // 1メッセージあたり最大4枚
    : []
  const isGreeting = userMessage === '__GREETING__'
  const isPassQuestion = userMessage === PASS_QUESTION_TOKEN
  const isContinueInterview = userMessage === CONTINUE_INTERVIEW_TOKEN
  const isDeepDive = userMessage === DEEP_DIVE_TOKEN

  // インタビュー確認（project所有確認も兼ねる）
  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, project_id, focus_theme_mode, focus_theme, structure, interviews_project:projects(user_id, name, hp_url, industry_memo, location)')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single()

  if (!interview) return new Response('Not found', { status: 404 })

  // ハル以外のキャストでは画像を受け付けない（差別化のため）
  const allowAttachments = interview.interviewer_type === 'hal'
  const acceptedAttachments = allowAttachments ? safeAttachments : []

  const projectData = !interview.interviews_project || Array.isArray(interview.interviews_project)
    ? null
    : interview.interviews_project as {
        user_id: string
        name: string | null
        hp_url: string
        industry_memo: string | null
        location: string | null
      }

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
  if (!isGreeting && !isPassQuestion && !isContinueInterview && !isDeepDive) {
    const userMeta = acceptedAttachments.length > 0
      ? { attachments: acceptedAttachments.map((a) => ({ path: a.path, content_type: a.contentType })) }
      : null
    const { error: msgInsertError } = await supabase.from('interview_messages').insert({
      interview_id: interviewId,
      role: 'user',
      content: userMessage,
      ...(userMeta ? { meta: userMeta } : {}),
    })
    if (msgInsertError) {
      console.error('[POST /api/projects/[id]/interview/chat] user message insert error', {
        interviewId,
        error: msgInsertError.message,
      })
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
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

  // 取材先情報と調査結果をコンテキストに注入（project 取得後に並列実行）
  const [
    { data: profile },
    { data: auditRow },
    { data: pastInterviews },
    { data: pastArticles },
    { data: competitorThemeRows },
    priorMeetings,
    respondentProfile,
    industryTerms,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('hp_audits')
      .select('raw_data')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
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
    supabase
      .from('competitor_analyses')
      .select('raw_data, competitors(url)')
      .eq('project_id', projectId),
    fetchPriorMeetings({
      supabase,
      projectId,
      interviewerType: interview.interviewer_type,
      currentInterviewId: interviewId,
    }),
    projectData
      ? fetchRespondentProfile({
          supabase,
          userId: projectData.user_id,
          projectId,
        })
      : Promise.resolve(null),
    fetchTopIndustryTerms({
      supabase,
      projectId,
      limit: 5,
    }),
  ])

  const isReturning = priorMeetings.relationship === 'returning'
  const relevantPastMemos = selectRelevantMemos(priorMeetings.pastMemos, interview.focus_theme, 2)

  const greetingSeed = isReturning
    ? '前回の続きから、今日のテーマで自然に始めてください。「はじめまして」とは言わないこと。'
    : 'はじめまして。よろしくお願いします。'

  type SupportedImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  type AnthropicContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: SupportedImageMediaType; data: string } }
  type AnthropicMessage = { role: 'user' | 'assistant'; content: string | AnthropicContentBlock[] }
  const isSupportedImageType = (v: string): v is SupportedImageMediaType =>
    v === 'image/jpeg' || v === 'image/png' || v === 'image/gif' || v === 'image/webp'

  const messages: AnthropicMessage[] = isGreeting
    ? [{ role: 'user', content: greetingSeed }]
    : [
        ...(history ?? []).map((m): AnthropicMessage => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        ...(isPassQuestion
          ? [{
              role: 'user' as const,
              content: '今の質問はパスしたいです。無理に同じ問いを続けず、これまでの話を踏まえて別の切り口から短く1つだけ質問してください。',
            }]
          : []),
        ...(isContinueInterview
          ? [{
              role: 'user' as const,
              content: '取材を続けたいです。先ほどのまとめ提案は一度取り下げて、これまで出てきた話の中からまだ深掘りできそうな1点を選び、別の角度から自然に1つだけ質問してください。前置きを1文添えて、ユーザーが答えやすい問い方にしてください。今回の返答末尾に [INTERVIEW_COMPLETE] は付けないでください。',
            }]
          : []),
        ...(isDeepDive
          ? [{
              role: 'user' as const,
              content: 'いまの話、もう少し聞かせてもらえますか。直前のやりとりの中で、まだ掘りきれていないと感じる1点を選んで、別の角度から自然に1つだけ問いを立ててください。具体的な場面・人・行動・反応のいずれかを引き出す方向で。',
            }]
          : []),
      ]

  // 添付画像（ハル限定）を Anthropic vision に渡す。
  // 直前のターンの画像のみ含める（過去ターンのは再送しないでコストとレイテンシを抑える）。
  if (acceptedAttachments.length > 0 && !isGreeting && !isPassQuestion && !isContinueInterview && !isDeepDive) {
    const adminClient = createAdminClient()
    const imageBlocks: AnthropicContentBlock[] = []
    for (const att of acceptedAttachments) {
      try {
        const { data: blob, error: dlErr } = await adminClient.storage
          .from('interview-attachments')
          .download(att.path)
        if (dlErr || !blob) {
          console.warn('[interview/chat] attachment download failed', { path: att.path, error: dlErr?.message })
          continue
        }
        const buf = Buffer.from(await blob.arrayBuffer())
        const mediaType: SupportedImageMediaType = isSupportedImageType(att.contentType) ? att.contentType : 'image/jpeg'
        imageBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') },
        })
      } catch (err) {
        console.warn('[interview/chat] attachment processing failed', err)
      }
    }
    if (imageBlocks.length > 0) {
      // 直近のユーザーメッセージを画像 + テキストの content 配列に書き換える
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          const original = messages[i].content
          const originalText = typeof original === 'string' ? original : ''
          messages[i] = {
            role: 'user',
            content: [
              ...imageBlocks,
              { type: 'text', text: originalText || '（写真を共有しました）' },
            ],
          }
          break
        }
      }
    }
  }

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

  const pastInterviewThemes = (pastInterviews ?? []).map((r: { focus_theme: string }) => r.focus_theme).filter(Boolean)
  const pastArticleTitles = (pastArticles ?? []).map((r: { title: string }) => r.title).filter(Boolean)
  const pastCoverage = [...pastInterviewThemes, ...pastArticleTitles]

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

    // 業界・地域情報（事前調査・事業者入力ベース）
    const industryParts: string[] = []
    if (projectData.industry_memo) industryParts.push(`業界メモ: ${projectData.industry_memo}`)
    if (projectData.location) industryParts.push(`地域: ${projectData.location}`)
    if (industryParts.length > 0) {
      contextParts.push(
        `【取材先の業界・地域】\n${industryParts.join('\n')}\n` +
        `これは事業者または事前調査で把握した前提情報です。「業界では一般的に〜」と断言せず、業種・地域柄ありそうな話を引き出すヒントとして使ってください。事業者の語りと違う場合は語りを優先します。`
      )
    }

    // 業種別の深掘りヒント
    const industryHint = buildIndustryHintContext(projectData.industry_memo)
    if (industryHint) {
      contextParts.push(industryHint)
    }

    // 過去取材で蓄積した業界用語辞書
    const termsBlock = formatIndustryTermsForPrompt(industryTerms ?? [])
    if (termsBlock) {
      contextParts.push(termsBlock)
    }
  }
  const focusThemeContext = buildInterviewFocusThemeContext(interview.focus_theme_mode, interview.focus_theme)
  if (focusThemeContext) {
    contextParts.push(focusThemeContext)
  }
  const structureContext = buildInterviewStructureContext((interview as { structure?: string | null }).structure)
  if (structureContext) {
    contextParts.push(structureContext)
  }
  if (profile?.name) {
    contextParts.push(`【話し相手】\nお名前: ${profile.name}`)
  }
  const profileBlock = formatProfileForPrompt(respondentProfile)
  if (profileBlock) {
    contextParts.push(profileBlock)
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

    // 全キャラ共通: 調査で見えている自社の輪郭
    const profileParts: string[] = []
    if (audit.strengths.length > 0) {
      profileParts.push(`HPで見えている強み:\n${audit.strengths.map((s) => `・${s}`).join('\n')}`)
    }
    if (audit.priority_actions.length > 0) {
      profileParts.push(`次の発信で優先したいこと:\n${audit.priority_actions.map((a) => `・${a}`).join('\n')}`)
    }
    if (audit.conversion_obstacles.length > 0) {
      profileParts.push(`問い合わせを妨げていそうな要因:\n${audit.conversion_obstacles.map((o) => `・${o}`).join('\n')}`)
    }
    const effectCoverage = buildEffectCoverage(audit.blog_classification_summary)
    const thinEffects = effectCoverage.filter((e) => e.count === 0)
    if (thinEffects.length > 0) {
      profileParts.push(
        `ブログで不足している効果軸（0件）:\n${thinEffects.map((e) => `・${e.label}（${e.desc}）`).join('\n')}`
      )
    }
    if (audit.blog_posts.length > 0) {
      profileParts.push(
        `既存ブログ記事タイトル（重複を避けるための参考）:\n${audit.blog_posts.slice(0, 15).map((t) => `・${t}`).join('\n')}`
      )
    }
    if (profileParts.length > 0) {
      contextParts.push(
        `【調査で見えている自社の輪郭】\n${profileParts.join('\n\n')}\n\n` +
        `インタビューでは、ここに挙がっている内容を「事業者本人の言葉」で具体化することと、ここに挙がっていない隠れた価値を引き出すことの両方を意識してください。これらは前提情報であり、断言の根拠にはしません。`
      )
    }

    // 全キャラ共通: 競合 gaps（クラウス・レイン以外にも届く）
    if (allCompetitorGaps.length > 0) {
      contextParts.push(
        `【競合が書いていて自社にないテーマ（競合調査結果）】\n${allCompetitorGaps.slice(0, 5).map((g) => `・${g}`).join('\n')}\n` +
        `これらのテーマで自社独自の視点・経験を引き出せると、差別化の核になります。`
      )
    }
  }

  // キャラ別コンテキスト注入（観点の重み付けのみ。データは上で共通化済み）
  const characterContext = buildCharacterSpecificContext(interview.interviewer_type, audit)
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
    relationship: priorMeetings.relationship,
    priorMeetingsCount: priorMeetings.priorMeetingsCount,
    pastInterviewMemos: relevantPastMemos,
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
      // システムプロンプトをキャッシュ対象にする（5分の ephemeral）。
      // 共通インストラクション + persona + 動的コンテキストを丸ごと1ブロックでキャッシュ。
      // 同一取材内の連続ターンや、別取材でも同じ persona+project の組み合わせなら 90% コスト減 + レイテンシ減。
      system: [
        { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
      ],
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
          route: '/api/projects/[id]/interview/chat',
          model: 'claude-sonnet-4-6',
          inputTokens: finalMsg.usage.input_tokens,
          outputTokens: finalMsg.usage.output_tokens,
        }).catch(() => {})
      }

      // マーカー抽出: [INTERVIEW_COMPLETE] / [DISCOVERY: ...] / [DRAFT_PROPOSAL: ...] / [HEADLINE_CANDIDATES: ...]
      const discoveryMatch = fullText.match(/\[DISCOVERY:\s*([^\]]+)\]/)
      const discoveryReason = discoveryMatch ? discoveryMatch[1].trim().slice(0, 80) : null
      const draftMatch = fullText.match(/\[DRAFT_PROPOSAL:\s*([^\]]+)\]/)
      const draftSnippet = draftMatch ? draftMatch[1].trim().slice(0, 200) : null
      const headlineMatch = fullText.match(/\[HEADLINE_CANDIDATES:\s*([^\]]+)\]/)
      const headlineSource = headlineMatch ? headlineMatch[1].trim().slice(0, 200) : null
      const cleanText = fullText
        .replace(/\[INTERVIEW_COMPLETE\]\s*$/m, '')
        .replace(/\[DISCOVERY:[^\]]+\]/g, '')
        .replace(/\[DRAFT_PROPOSAL:[^\]]+\]/g, '')
        .replace(/\[HEADLINE_CANDIDATES:[^\]]+\]/g, '')
        .trim()

      // 繰り返し検出（モニタリング用ログ。streamingを壊さないため再生成はせず、後の合成ループ材料にする）
      if (cleanText) {
        const recentInterviewerHistory = (history ?? [])
          .filter((m) => m.role !== 'user')
          .map((m) => ({ role: 'interviewer' as const, content: m.content }))
        const repetitionCheck = detectQuestionRepetition({
          history: recentInterviewerHistory,
          candidate: cleanText,
        })
        if (repetitionCheck.repeated) {
          console.warn('[interview/chat] question repetition detected', {
            interviewId,
            similarity: repetitionCheck.similarity.toFixed(2),
            matchedTextHead: repetitionCheck.matchedText?.slice(0, 80),
            candidateHead: cleanText.slice(0, 80),
          })
        }
      }

      if (cleanText) {
        const metaObj: Record<string, unknown> = {}
        if (discoveryReason) metaObj.discovery = { reason: discoveryReason }
        if (draftSnippet) metaObj.draft_proposal = { snippet: draftSnippet }
        if (headlineSource) metaObj.headline_candidates = { source: headlineSource }
        const meta = Object.keys(metaObj).length > 0 ? metaObj : null
        const { error } = await supabase.from('interview_messages').insert({
          interview_id: interviewId,
          role: 'interviewer',
          content: cleanText,
          ...(meta ? { meta } : {}),
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

/**
 * キャラ別の取材重み付け指示。
 * audit のデータ自体は呼び出し元（contextParts）で全キャラ共通として注入済み。
 * ここでは「このキャラはどの観点を重視するか」だけを残す。
 */
function buildCharacterSpecificContext(
  characterId: string,
  audit: AuditContext,
): string {
  if (!audit) return ''

  const FOCUS_BY_CHARACTER: Record<string, { focusAxes: string[]; emphasis: string }> = {
    mint: {
      focusAxes: ['trust', 'empathy'],
      emphasis: '上記「自社の輪郭」のうち、信頼・実績や共感・人柄に関する箇所を中心に。お客様から見て「信頼できそう」「この人に頼んでみたい」と思える具体エピソードを引き出すことを優先する。',
    },
    claus: {
      focusAxes: ['discovery', 'trust'],
      emphasis: '上記「自社の輪郭」のうち、業種知識・判断基準・技術的な選択に関する箇所を中心に。HPで語られていない、業種ならではの工夫や選択の理由を引き出すことを優先する。',
    },
    rain: {
      focusAxes: ['conversion'],
      emphasis: '上記「自社の輪郭」のうち、問い合わせを妨げていそうな要因と次の発信の優先事項を中心に。なぜ選ばれるのか・他と何が違うのかを、お客様目線の言葉で引き出すことを優先する。',
    },
    hal: {
      focusAxes: ['empathy'],
      emphasis: '上記「自社の輪郭」のうち、人柄・関係性・場の空気が見える話を中心に。数字や実績ではなく、写真と感情・人との関係を起点にエピソードを引き出すことを優先する。',
    },
    mogro: {
      focusAxes: ['trust', 'discovery'],
      emphasis: '上記「自社の輪郭」を仮説の出発点として使い、はい/いいえで価値の有無・頻度・独自性を順番に確かめてください。1問ごとに「分かったこと」を短く言語化する。',
    },
    cocco: {
      focusAxes: ['conversion', 'discovery'],
      emphasis: '上記「自社の輪郭」のうち、次の発信で優先したいことと不足している効果軸を中心に。今・直近で告知したい変化や新しい話題を引き出し、すぐ使える1行に落とす。',
    },
  }

  const focus = FOCUS_BY_CHARACTER[characterId]
  if (!focus) return ''

  return `【${characterId} としての取材の重み付け】\n${focus.emphasis}`
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
