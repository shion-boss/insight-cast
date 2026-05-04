import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

import { extractJsonBlock, formatConversationForPrompt, type PromptConversationMessage } from '@/lib/ai-quality'

export type IndustryTerm = {
  term: string
  meaning: string | null
  seen_count: number
}

const EXTRACT_SYSTEM_PROMPT = `あなたはInsight Castの教育担当です。
取材会話の中で、事業者本人が使った「業界・業種特有の用語」を抽出してください。

抽出の原則:
- 事業者本人が会話で使った言葉のみ。一般用語（時間・場所・人物の普通名詞）は対象外
- AIキャストが提示した業界知識は無視
- 用語数は0〜5件まで。確証がなければ少なめに
- 意味が会話文脈から読み取れない場合は meaning を null にする

【出力形式（JSON のみ）】
{
  "terms": [
    { "term": "用語", "meaning": "会話文脈から推測される意味（30文字以内、null可）" }
  ]
}`

function isExtractedTerms(value: unknown): value is { terms: Array<{ term: unknown; meaning?: unknown }> } {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (!Array.isArray(o.terms)) return false
  return o.terms.every((t) => t && typeof t === 'object' && typeof (t as Record<string, unknown>).term === 'string')
}

/**
 * 取材会話から業界用語を抽出する。
 */
export async function extractIndustryTerms(input: {
  client: Anthropic
  messages: PromptConversationMessage[]
  castName: string
}): Promise<{ terms: IndustryTerm[]; usage: { inputTokens: number; outputTokens: number } } | null> {
  if (input.messages.filter((m) => m.role === 'user').length < 2) return null

  const conversation = formatConversationForPrompt(input.messages, {
    userLabel: '事業者',
    assistantLabel: input.castName,
    maxMessageLength: 500,
  })

  let response
  try {
    response = await input.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      temperature: 0.2,
      system: [
        { type: 'text', text: EXTRACT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: `以下の取材会話から業界用語を抽出してください。\n\n${conversation}` }],
    })
  } catch (err) {
    console.error('[industry-terms] Anthropic error:', err)
    return null
  }

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const jsonText = extractJsonBlock(rawText)
  if (!jsonText) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return null
  }
  if (!isExtractedTerms(parsed)) return null

  const terms: IndustryTerm[] = parsed.terms
    .map((t) => {
      const o = t as Record<string, unknown>
      const term = typeof o.term === 'string' ? o.term.trim().slice(0, 60) : ''
      const meaning = typeof o.meaning === 'string' ? o.meaning.trim().slice(0, 80) : null
      return term ? { term, meaning, seen_count: 1 } : null
    })
    .filter((t): t is IndustryTerm => Boolean(t))
    .slice(0, 5)

  return {
    terms,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  }
}

/**
 * 抽出した業界用語を industry_terms に upsert（既存があれば seen_count を +1）。
 */
export async function upsertIndustryTerms(input: {
  supabase: SupabaseClient
  projectId: string
  interviewId: string
  terms: IndustryTerm[]
}): Promise<void> {
  const { supabase, projectId, interviewId, terms } = input
  if (terms.length === 0) return

  for (const t of terms) {
    const { data: existing } = await supabase
      .from('industry_terms')
      .select('id, seen_count, meaning')
      .eq('project_id', projectId)
      .eq('term', t.term)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('industry_terms')
        .update({
          seen_count: (existing.seen_count ?? 0) + 1,
          last_seen_at: new Date().toISOString(),
          meaning: existing.meaning ?? t.meaning ?? null,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('industry_terms').insert({
        project_id: projectId,
        term: t.term,
        meaning: t.meaning,
        first_seen_in_interview_id: interviewId,
        seen_count: 1,
      })
    }
  }
}

/**
 * 取材開始時に該当プロジェクトの業界用語を上位 N 件取得する。
 */
export async function fetchTopIndustryTerms(input: {
  supabase: SupabaseClient
  projectId: string
  limit?: number
}): Promise<IndustryTerm[]> {
  const limit = input.limit ?? 5
  const { data } = await input.supabase
    .from('industry_terms')
    .select('term, meaning, seen_count')
    .eq('project_id', input.projectId)
    .order('seen_count', { ascending: false })
    .limit(limit)
  return (data as IndustryTerm[] | null) ?? []
}

/**
 * 業界用語をプロンプト注入用の文字列に整形する。
 */
export function formatIndustryTermsForPrompt(terms: IndustryTerm[]): string {
  if (terms.length === 0) return ''
  const lines = terms.map((t) =>
    t.meaning ? `- 「${t.term}」: ${t.meaning}` : `- 「${t.term}」`,
  )
  return `【この事業者の業界用語（過去取材から）】\n${lines.join('\n')}\nこれは事業者が実際に使った言葉です。同じ用語が出てきたら意味を取り違えないこと。AIキャストから先に持ち出さない（事業者が口にしたら自然に拾う）。`
}
