import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { buildProjectAnalysisSignature, normalizeAnalysisUrl } from '@/lib/analysis/cache'
import { isProjectAnalysisReady, resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'
import { normalizeCompetitorThemeSummary, normalizeInterviewFocusTheme } from '@/lib/interview-focus-theme'
import type { PostgrestError } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function throwIfError(error: PostgrestError | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
}

async function fetchMarkdown(url: string): Promise<string> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  })
  if (!res.ok) return ''
  const json = await res.json()
  return (json.data?.markdown as string) ?? ''
}

async function analyzeHp(markdown: string): Promise<{
  current_content: string[]
  strengths: string[]
  gaps: string[]
  suggested_themes: string[]
}> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `以下はあるビジネスのホームページの内容です。日本語で分析してください。

## ホームページ内容
${markdown.slice(0, 8000)}

## 出力形式（JSONのみ返してください）
{
  "current_content": ["現在伝えていること（3〜4項目）"],
  "strengths": ["強みとして見えるもの（2〜3項目）"],
  "gaps": ["伝えきれていないこと・足りないもの（2〜3項目）"],
  "suggested_themes": ["インタビューで深めたいテーマ（5項目）"]
}`,
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('JSON parse failed')
  return JSON.parse(jsonMatch[0])
}

async function compareCompetitor(
  mainMarkdown: string,
  competitorMarkdown: string,
): Promise<{
  gaps: string[]
  advantages: string[]
  influential_topics: Array<{ theme: string; summary: string }>
}> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `2つのビジネスのホームページを比較してください。日本語で回答してください。

## 自社HP
${mainMarkdown.slice(0, 4000)}

## 競合HP
${competitorMarkdown.slice(0, 4000)}

## 出力形式（JSONのみ返してください）
{
  "gaps": ["競合が伝えていて自社にないもの（2〜4項目）"],
  "advantages": ["自社が競合より詳しく伝えているもの（1〜3項目）"],
  "influential_topics": [
    {
      "theme": "競合が前面に出しているテーマ（短く）",
      "summary": "その競合がこのテーマをどんな内容で伝えているかの要約（1文）"
    }
  ]
}`,
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { gaps: [], advantages: [], influential_topics: [] }

  const parsed = JSON.parse(jsonMatch[0]) as {
    gaps?: unknown
    advantages?: unknown
    influential_topics?: unknown
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

  const { error: markAnalyzingError } = await supabase
    .from('projects')
    .update({ status: 'analyzing' })
    .eq('id', id)
  throwIfError(markAnalyzingError, 'failed to mark project analyzing')

  try {
    const mainMarkdown = await fetchMarkdown(project.hp_url)
    const normalizedHpUrl = normalizeAnalysisUrl(project.hp_url)

    const audit = await analyzeHp(mainMarkdown)
    const auditPayload = {
      project_id: id,
      current_content: audit.current_content,
      strengths: audit.strengths,
      gaps: audit.gaps,
      suggested_themes: audit.suggested_themes,
      raw_data: {
        input_signature: inputSignature,
        source_url: normalizedHpUrl,
        markdown_length: mainMarkdown.length,
        analyzed_at: new Date().toISOString(),
      },
    }

    if (existingAudit?.id) {
      const { error: auditUpdateError } = await supabase
        .from('hp_audits')
        .update(auditPayload)
        .eq('id', existingAudit.id)
      throwIfError(auditUpdateError, 'failed to update hp_audit')
    } else {
      const { error: auditInsertError } = await supabase.from('hp_audits').insert(auditPayload)
      throwIfError(auditInsertError, 'failed to insert hp_audit')
    }

    const { error: deleteCompetitorsError } = await supabase
      .from('competitor_analyses')
      .delete()
      .eq('project_id', id)
    throwIfError(deleteCompetitorsError, 'failed to clear competitor analyses')

    if (competitors && competitors.length > 0) {
      const competitorRows: Array<{
        project_id: string
        competitor_id: string
        gaps: string[]
        advantages: string[]
        raw_data: {
          input_signature: string
          source_url: string
          markdown_length: number
          analyzed_at: string
          influential_topics: Array<{ theme: string; summary: string }>
        }
      }> = []

      for (const comp of competitors) {
        const compMarkdown = await fetchMarkdown(comp.url)
        if (!compMarkdown) continue
        const result = await compareCompetitor(mainMarkdown, compMarkdown)
        competitorRows.push({
          project_id: id,
          competitor_id: comp.id,
          gaps: result.gaps,
          advantages: result.advantages,
          raw_data: {
            input_signature: inputSignature,
            source_url: normalizeAnalysisUrl(comp.url),
            markdown_length: compMarkdown.length,
            analyzed_at: new Date().toISOString(),
            influential_topics: result.influential_topics,
          },
        })
      }

      if (competitorRows.length > 0) {
        const { error: competitorInsertError } = await supabase.from('competitor_analyses').insert(competitorRows)
        throwIfError(competitorInsertError, 'failed to insert competitor analyses')
      }
    }

    const { error: reportReadyError } = await supabase
      .from('projects')
      .update({ status: 'report_ready' })
      .eq('id', id)
    throwIfError(reportReadyError, 'failed to mark project report_ready')

    return NextResponse.json({ status: 'done' })
  } catch (err) {
    console.error('[analyze]', err)
    await supabase
      .from('projects')
      .update({ status: 'analysis_pending' })
      .eq('id', id)
    return NextResponse.json({ error: 'analysis failed' }, { status: 500 })
  }
}
