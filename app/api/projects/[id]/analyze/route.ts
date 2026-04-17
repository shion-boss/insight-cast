import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  "suggested_themes": ["インタビューで深めたいテーマ（3〜5項目）"]
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
): Promise<{ gaps: string[]; advantages: string[] }> {
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
  "advantages": ["自社が競合より詳しく伝えているもの（1〜3項目）"]
}`,
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { gaps: [], advantages: [] }
  return JSON.parse(jsonMatch[0])
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
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ status: project?.status ?? 'analyzing' })
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
  if (project.status !== 'analyzing') return NextResponse.json({ status: project.status })

  const { data: existing } = await supabase
    .from('hp_audits')
    .select('id')
    .eq('project_id', id)
    .single()

  if (existing) return NextResponse.json({ status: 'already_started' })

  try {
    const mainMarkdown = await fetchMarkdown(project.hp_url)

    const audit = await analyzeHp(mainMarkdown)
    await supabase.from('hp_audits').insert({
      project_id: id,
      current_content:  audit.current_content,
      strengths:        audit.strengths,
      gaps:             audit.gaps,
      suggested_themes: audit.suggested_themes,
      raw_data: { markdown_length: mainMarkdown.length },
    })

    const { data: competitors } = await supabase
      .from('competitors')
      .select('id, url')
      .eq('project_id', id)

    if (competitors && competitors.length > 0) {
      for (const comp of competitors) {
        const compMarkdown = await fetchMarkdown(comp.url)
        if (!compMarkdown) continue
        const result = await compareCompetitor(mainMarkdown, compMarkdown)
        await supabase.from('competitor_analyses').insert({
          project_id:    id,
          competitor_id: comp.id,
          gaps:          result.gaps,
          advantages:    result.advantages,
          raw_data: { markdown_length: compMarkdown.length },
        })
      }
    }

    await supabase
      .from('projects')
      .update({ status: 'report_ready' })
      .eq('id', id)

    return NextResponse.json({ status: 'done' })
  } catch (err) {
    console.error('[analyze]', err)
    return NextResponse.json({ error: 'analysis failed' }, { status: 500 })
  }
}
