import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { buildProjectAnalysisSignature, normalizeAnalysisUrl } from '@/lib/analysis/cache'
import { isProjectAnalysisReady, resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'
import { normalizeCompetitorThemeSummary, normalizeInterviewFocusTheme } from '@/lib/interview-focus-theme'
import { buildClassificationSummary } from '@/lib/content-map'
import { classifyBlogPosts } from '@/lib/content-map.server'
import { buildBlogFreshnessMetrics, discoverNewBlogPosts, discoverSiteBlogPosts, getStoredSiteBlogPosts, COMPETITOR_BLOG_POST_LIMIT } from '@/lib/site-blog-support'
import { fetchMarkdown } from '@/lib/firecrawl'
import type { PostgrestError } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function throwIfError(error: PostgrestError | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
}

async function analyzeHp(
  markdown: string,
  blogPosts: Array<{ title: string; summary: string }>,
): Promise<{
  current_content: string[]
  strengths: string[]
  gaps: string[]
  suggested_themes: string[]
  site_evaluation: Array<{ key: string; label: string; score: number; summary: string }>
  trust_signals: string[]
  conversion_obstacles: string[]
  priority_actions: string[]
}> {
  const blogSection = blogPosts.length > 0
    ? `\n## 既存ブログ記事（タイトルと要約）\n${blogPosts.slice(0, 30).map((p, i) => `${i + 1}. ${p.title}${p.summary ? `\n   ${p.summary}` : ''}`).join('\n')}`
    : '\n## 既存ブログ記事\nブログ記事は確認できませんでした。'

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `以下はあるビジネスのホームページの内容と、既存ブログ記事の一覧です。「ブログで一次情報を発信してHPを継続的に育てる」支援をする前提で、日本語で分析してください。
ブログ記事の分析に重点を置き、何が書かれていて何が抜けているかを特定してください。

## ホームページ内容
${markdown.slice(0, 6000)}
${blogSection}

## 出力形式（JSONのみ返してください）
{
  "current_content": ["現在ホームページ・ブログで伝えていること（3〜4項目）"],
  "strengths": ["強みとして見えるもの（3〜4項目）"],
  "gaps": ["ブログ・HPで伝えきれていないこと・書けていないテーマ（3〜4項目）"],
  "suggested_themes": ["次に書くべきブログ記事テーマ（5項目、具体的なタイトルイメージで）"],
  "site_evaluation": [
    {
      "key": "positioning",
      "label": "ポジショニングの明確さ",
      "score": 1,
      "summary": "1文で根拠を説明"
    },
    {
      "key": "offer",
      "label": "提供価値の伝わりやすさ",
      "score": 1,
      "summary": "1文で根拠を説明"
    },
    {
      "key": "trust",
      "label": "信頼材料の厚み",
      "score": 1,
      "summary": "1文で根拠を説明"
    },
    {
      "key": "cta",
      "label": "問い合わせ導線",
      "score": 1,
      "summary": "1文で根拠を説明"
    },
    {
      "key": "blog_coverage",
      "label": "ブログの網羅性",
      "score": 1,
      "summary": "テーマの偏り・抜けを1文で説明"
    },
    {
      "key": "blog_depth",
      "label": "ブログの一次情報度",
      "score": 1,
      "summary": "自社ならではの情報が出ているかを1文で"
    }
  ],
  "trust_signals": ["信頼材料として使えている要素（2〜4項目）"],
  "conversion_obstacles": ["問い合わせや商談化を阻害していそうな要因（2〜4項目）"],
  "priority_actions": ["次の発信で優先したいこと（3項目、ブログ記事視点で）"]
}`,
    }],
  })

  const empty = { current_content: [], strengths: [], gaps: [], suggested_themes: [], site_evaluation: [], trust_signals: [], conversion_obstacles: [], priority_actions: [] }
  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[analyzeHp] no JSON found, raw text:', text.slice(0, 300))
    return empty
  }
  let parsed: {
    current_content?: unknown
    strengths?: unknown
    gaps?: unknown
    suggested_themes?: unknown
    site_evaluation?: unknown
    trust_signals?: unknown
    conversion_obstacles?: unknown
    priority_actions?: unknown
  }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error('[analyzeHp] JSON.parse failed:', e)
    return empty
  }
  const _parsed = parsed as {
    current_content?: unknown
    strengths?: unknown
    gaps?: unknown
    suggested_themes?: unknown
    site_evaluation?: unknown
    trust_signals?: unknown
    conversion_obstacles?: unknown
    priority_actions?: unknown
  }

  const normalizeStringList = (input: unknown, limit = 6) =>
    Array.isArray(input)
      ? input
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, limit)
      : []

  const normalizeSiteEvaluation = (input: unknown) => {
    if (!Array.isArray(input)) return []
    return input.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const key = typeof (entry as { key?: unknown }).key === 'string'
        ? (entry as { key: string }).key.trim()
        : ''
      const label = typeof (entry as { label?: unknown }).label === 'string'
        ? (entry as { label: string }).label.trim()
        : ''
      const summary = typeof (entry as { summary?: unknown }).summary === 'string'
        ? (entry as { summary: string }).summary.trim()
        : ''
      const rawScore = typeof (entry as { score?: unknown }).score === 'number'
        ? (entry as { score: number }).score
        : NaN
      const score = Number.isFinite(rawScore) ? Math.min(10, Math.max(1, Math.round(rawScore))) : null
      if (!key || !label || !summary || score === null) return []
      return [{ key, label, score, summary }]
    })
  }

  return {
    current_content: normalizeStringList(_parsed.current_content, 4),
    strengths: normalizeStringList(_parsed.strengths, 4),
    gaps: normalizeStringList(_parsed.gaps, 4),
    suggested_themes: normalizeStringList(_parsed.suggested_themes, 5),
    site_evaluation: normalizeSiteEvaluation(_parsed.site_evaluation),
    trust_signals: normalizeStringList(_parsed.trust_signals, 4),
    conversion_obstacles: normalizeStringList(_parsed.conversion_obstacles, 4),
    priority_actions: normalizeStringList(_parsed.priority_actions, 3),
  }
}

async function compareCompetitor(
  mainMarkdown: string,
  competitorMarkdown: string,
  ownBlogPosts: Array<{ title: string }>,
  compBlogPosts: Array<{ title: string }>,
): Promise<{
  gaps: string[]
  advantages: string[]
  influential_topics: Array<{ theme: string; summary: string }>
}> {
  const ownBlogSection = ownBlogPosts.length > 0
    ? ownBlogPosts.slice(0, 20).map((p) => `- ${p.title}`).join('\n')
    : '（ブログ記事なし）'
  const compBlogSection = compBlogPosts.length > 0
    ? compBlogPosts.slice(0, 20).map((p) => `- ${p.title}`).join('\n')
    : '（ブログ記事なし）'

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `2つのビジネスのホームページとブログ記事一覧を比較してください。特にブログで扱っているテーマの差に注目し、日本語で回答してください。

## 自社HP
${mainMarkdown.slice(0, 3000)}

## 自社ブログ記事タイトル一覧
${ownBlogSection}

## 競合HP
${competitorMarkdown.slice(0, 3000)}

## 競合ブログ記事タイトル一覧
${compBlogSection}

## 出力形式（JSONのみ返してください）
{
  "gaps": ["競合が書いていて自社ブログ・HPにないテーマや切り口（2〜4項目）"],
  "advantages": ["自社が競合より詳しく伝えているテーマや強み（1〜3項目）"],
  "influential_topics": [
    {
      "theme": "競合が積極的に発信しているテーマ（短く）",
      "summary": "そのテーマをどんな角度・内容で発信しているかの要約（1文）"
    }
  ]
}`,
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { gaps: [], advantages: [], influential_topics: [] }

  let parsed: { gaps?: unknown; advantages?: unknown; influential_topics?: unknown }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    console.error('[compareCompetitor] JSON.parse failed')
    return { gaps: [], advantages: [], influential_topics: [] }
  }

  const normalizeStringList = (input: unknown) =>
    Array.isArray(input)
      ? input
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
      : []

  const influentialTopics = Array.isArray(parsed.influential_topics)
    ? parsed.influential_topics.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const theme = normalizeInterviewFocusTheme((item as { theme?: unknown }).theme)
        const summary = normalizeCompetitorThemeSummary((item as { summary?: unknown }).summary)
        if (!theme || !summary) return []
        return [{ theme, summary }]
      })
    : []

  return {
    gaps: normalizeStringList(parsed.gaps),
    advantages: normalizeStringList(parsed.advantages),
    influential_topics: influentialTopics,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('status, hp_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { data: audit } = await supabase
    .from('hp_audits')
    .select('id, raw_data')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, url')
    .eq('project_id', id)

  const { data: competitorAnalyses } = await supabase
    .from('competitor_analyses')
    .select('competitor_id, raw_data')
    .eq('project_id', id)

  let resolvedStatus = project?.status ?? 'analysis_pending'
  const readiness = project
    ? isProjectAnalysisReady({
      project,
      competitors: competitors ?? [],
      audit,
      competitorAnalyses: competitorAnalyses ?? [],
    })
    : { isReady: false }

  resolvedStatus = resolveProjectAnalysisStatus(resolvedStatus, readiness.isReady)

  if (project?.status !== resolvedStatus) {
    await supabase
      .from('projects')
      .update({ status: resolvedStatus })
      .eq('id', id)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ status: resolvedStatus })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, hp_url, status, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data: existingAudit } = await supabase
    .from('hp_audits')
    .select('id, raw_data, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, url')
    .eq('project_id', id)

  const competitorUrls = (competitors ?? []).map((competitor) => competitor.url)
  const inputSignature = buildProjectAnalysisSignature({
    hpUrl: project.hp_url,
    competitorUrls,
  })

  const { data: existingCompetitorAnalyses } = await supabase
    .from('competitor_analyses')
    .select('id, competitor_id, raw_data')
    .eq('project_id', id)

  const { hasFreshAudit, hasFreshCompetitorAnalyses } = isProjectAnalysisReady({
    project,
    competitors: competitors ?? [],
    audit: existingAudit,
    competitorAnalyses: existingCompetitorAnalyses ?? [],
  })

  if (hasFreshAudit && hasFreshCompetitorAnalyses) {
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ status: 'report_ready' })
      .eq('id', id)
    throwIfError(projectUpdateError, 'failed to mark cached report ready')

    return NextResponse.json({ status: 'cached' })
  }

  if (!['analysis_pending', 'analyzing'].includes(project.status) && existingAudit?.id) {
    return NextResponse.json({ status: project.status })
  }

  // 再調査の月1回制限（二重ガード: analysis-start 側が主ゲートで、こちらはフォールバック）
  const existingRawData = existingAudit?.raw_data as Record<string, unknown> | null
  const lastAnalyzedAt = typeof existingRawData?.analyzed_at === 'string' ? new Date(existingRawData.analyzed_at) : null
  const isReanalysis = lastAnalyzedAt !== null
  if (isReanalysis && process.env.NODE_ENV !== 'development') {
    const daysSinceLast = (Date.now() - lastAnalyzedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLast < 30) {
      return NextResponse.json({ error: 'reanalysis_too_soon', next_available_at: new Date(lastAnalyzedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() }, { status: 429 })
    }
  }

  const { error: statusAnalyzingError } = await supabase.from('projects').update({ status: 'analyzing' }).eq('id', id)
  if (statusAnalyzingError) console.error('[analyze] failed to set status analyzing:', statusAnalyzingError.message)

  const analysisArgs = {
    supabase,
    projectId: id,
    userId: project.user_id as string,
    hpUrl: project.hp_url,
    existingAuditId: existingAudit?.id ?? null,
    existingRawData,
    isReanalysis,
    competitors: competitors ?? [],
    inputSignature,
  }

  if (process.env.NODE_ENV === 'development') {
    // ローカルでは waitUntil が動かないため同期実行
    void runAnalysis(analysisArgs)
    return NextResponse.json({ status: 'started' })
  }

  waitUntil(runAnalysis(analysisArgs))
  return NextResponse.json({ status: 'started' })
}

async function runAnalysis({
  supabase,
  projectId,
  userId,
  hpUrl,
  existingAuditId,
  existingRawData,
  isReanalysis,
  competitors,
  inputSignature,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  projectId: string
  userId: string
  hpUrl: string
  existingAuditId: string | null
  existingRawData: Record<string, unknown> | null
  isReanalysis: boolean
  competitors: Array<{ id: string; url: string }>
  inputSignature: string
}) {
  try {
    const mainMarkdown = await fetchMarkdown(hpUrl, { userId, projectId, route: 'analyze/scrape' })
    const normalizedHpUrl = normalizeAnalysisUrl(hpUrl)

    if (!mainMarkdown) {
      console.error('[analyze] fetchMarkdown returned empty for', hpUrl)
      const { error: fetchFailedError } = await supabase.from('projects').update({ status: 'fetch_failed' }).eq('id', projectId)
      if (fetchFailedError) console.error('[analyze] failed to set status fetch_failed:', fetchFailedError.message)
      return
    }

    // 自社ブログ取得を先に行い、分析プロンプトに含める
    const ownBlogPosts = await (isReanalysis
      ? (async () => {
          const existing = getStoredSiteBlogPosts(existingRawData)
          const newPosts = await discoverNewBlogPosts(hpUrl, existing, 30)
          return [...existing, ...newPosts]
        })()
      : discoverSiteBlogPosts(hpUrl, 30)
    )

    const [audit, ownBlogMetrics, blogClassifications] = await Promise.all([
      analyzeHp(mainMarkdown, ownBlogPosts),
      Promise.resolve(buildBlogFreshnessMetrics(ownBlogPosts)),
      classifyBlogPosts(ownBlogPosts).catch(() => []),
    ])
    const blogClassificationSummary = buildClassificationSummary(blogClassifications)
    const analyzedAt = new Date().toISOString()

    const auditPayload = {
      project_id: projectId,
      current_content: audit.current_content,
      strengths: audit.strengths,
      gaps: audit.gaps,
      suggested_themes: audit.suggested_themes,
      raw_data: {
        input_signature: inputSignature,
        source_url: normalizedHpUrl,
        markdown_length: mainMarkdown.length,
        analyzed_at: analyzedAt,
        lightweight_metrics_updated_at: analyzedAt,
        current_content: audit.current_content,
        strengths: audit.strengths,
        gaps: audit.gaps,
        suggested_themes: audit.suggested_themes,
        site_evaluation: audit.site_evaluation,
        trust_signals: audit.trust_signals,
        conversion_obstacles: audit.conversion_obstacles,
        priority_actions: audit.priority_actions,
        blog_posts: ownBlogPosts,
        blog_metrics: ownBlogMetrics,
        blog_classifications: blogClassifications,
        blog_classifications_at: analyzedAt,
        blog_classification_summary: blogClassificationSummary,
      },
    }

    if (existingAuditId) {
      const { error } = await supabase.from('hp_audits').update(auditPayload).eq('id', existingAuditId)
      throwIfError(error, 'failed to update hp_audit')
    } else {
      const { error } = await supabase.from('hp_audits').insert(auditPayload)
      throwIfError(error, 'failed to insert hp_audit')
    }

    // 競合分析を並列化
    const { error: deleteError } = await supabase.from('competitor_analyses').delete().eq('project_id', projectId)
    if (deleteError) console.error('[analyze] failed to delete old competitor_analyses:', deleteError.message)

    if (competitors.length > 0) {
      const competitorResults = await Promise.allSettled(competitors.map(async (comp) => {
        let compMarkdown = ''
        let result: {
          gaps: string[]
          advantages: string[]
          influential_topics: Array<{ theme: string; summary: string }>
        } = { gaps: [], advantages: [], influential_topics: [] }
        let competitorBlogPosts: Array<{ url: string; title: string; summary: string }> = []

        try {
          const [markdown, blogPosts] = await Promise.all([
            fetchMarkdown(comp.url, { userId, projectId, route: 'analyze/scrape' }),
            discoverSiteBlogPosts(comp.url, COMPETITOR_BLOG_POST_LIMIT),
          ])
          compMarkdown = markdown
          competitorBlogPosts = blogPosts
          // 200文字未満は JS レンダリング失敗や空ページとみなしてスキップ
          if (compMarkdown && compMarkdown.length >= 200) {
            result = await compareCompetitor(mainMarkdown, compMarkdown, ownBlogPosts, blogPosts)
          } else if (compMarkdown) {
            console.warn('[analyze:competitor] too short, skipping analysis', comp.url, compMarkdown.length)
          }
        } catch (error) {
          console.error('[analyze:competitor]', comp.url, error)
        }

        return {
          project_id: projectId,
          competitor_id: comp.id,
          gaps: result.gaps,
          advantages: result.advantages,
          raw_data: {
            input_signature: inputSignature,
            source_url: normalizeAnalysisUrl(comp.url),
            markdown_length: compMarkdown.length,
            analyzed_at: new Date().toISOString(),
            influential_topics: result.influential_topics,
            blog_posts: competitorBlogPosts,
          },
        }
      }))

      const competitorRows = competitorResults.flatMap((r) => {
        if (r.status === 'fulfilled') return [r.value]
        console.error('[analyze] competitor analysis failed (skipped):', r.reason)
        return []
      })

      if (competitorRows.length > 0) {
        const { error } = await supabase.from('competitor_analyses').insert(competitorRows)
        throwIfError(error, 'failed to insert competitor analyses')
      }
    }

    const { error: reportReadyError } = await supabase.from('projects').update({ status: 'report_ready' }).eq('id', projectId)
    if (reportReadyError) console.error('[analyze] failed to set status report_ready:', reportReadyError.message)

    // 分析完了メール通知
    await sendAnalysisCompleteEmail(supabase, projectId, hpUrl)
  } catch (err) {
    console.error('[analyze]', err)
    const { error: resetError } = await supabase.from('projects').update({ status: 'analysis_pending' }).eq('id', projectId)
    if (resetError) console.error('[analyze] failed to reset status to analysis_pending:', resetError.message)
  }
}

async function sendAnalysisCompleteEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  hpUrl: string,
) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.warn('[analyze:email] RESEND_API_KEY が未設定のためメール送信をスキップします')
    return
  }

  try {
    // プロジェクト名とユーザーのメールアドレスを取得
    const { data: project } = await supabase
      .from('projects')
      .select('name, user_id')
      .eq('id', projectId)
      .single()

    if (!project) return

    const { data: { user } } = await supabase.auth.admin.getUserById(project.user_id)
    const toEmail = user?.email
    if (!toEmail) return

    const projectName = project.name || hpUrl
    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.insightcast.jp'}/projects/${projectId}/report`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Insight Cast <noreply@insightcast.jp>',
        to: [toEmail],
        subject: `[Insight Cast] ${projectName} の調査が完了しました`,
        text: [
          `${projectName} の調査が完了しました。`,
          '',
          '調査レポートを確認して、インタビューを始めましょう。',
          '',
          `レポートを見る: ${reportUrl}`,
          '',
          '---',
          'Insight Cast',
        ].join('\n'),
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error('[analyze:email] Resend API error', response.status, body)
    }
  } catch (err) {
    // メール送信失敗は分析結果に影響させない
    console.error('[analyze:email]', err)
  }
}
