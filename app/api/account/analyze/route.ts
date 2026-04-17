import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

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

async function analyzeHp(markdown: string) {
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
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('JSON parse failed')
  return JSON.parse(m[0])
}

async function compareCompetitor(mainMarkdown: string, competitorMarkdown: string) {
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
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return { gaps: [], advantages: [] }
  return JSON.parse(m[0])
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('url, competitor_urls, industry_memo')
    .eq('id', user.id)
    .single()

  if (!profile?.url) return NextResponse.json({ error: 'no hp_url' }, { status: 400 })

  try {
    const mainMarkdown = await fetchMarkdown(profile.url)
    if (!mainMarkdown) return NextResponse.json({ error: 'fetch failed' }, { status: 400 })

    const audit = await analyzeHp(mainMarkdown)

    const competitorResults: { url: string; gaps: string[]; advantages: string[] }[] = []
    const competitorUrls: string[] = profile.competitor_urls ?? []

    for (const compUrl of competitorUrls.filter(Boolean).slice(0, 3)) {
      const compMarkdown = await fetchMarkdown(compUrl)
      if (!compMarkdown) continue
      const result = await compareCompetitor(mainMarkdown, compMarkdown)
      competitorResults.push({ url: compUrl, ...result })
    }

    await supabase
      .from('profiles')
      .update({
        hp_audit_result:       audit,
        competitor_audit_result: competitorResults.length > 0 ? competitorResults : null,
        audit_updated_at:      new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({ ok: true, audit, competitorResults })
  } catch (err) {
    console.error('[account/analyze]', err)
    return NextResponse.json({ error: 'analysis failed' }, { status: 500 })
  }
}
