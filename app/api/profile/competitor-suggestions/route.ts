import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { buildCompetitorSuggestionSignature, normalizeAnalysisUrl } from '@/lib/analysis/cache'
import { logApiUsage, checkRateLimit } from '@/lib/api-usage'

const anthropic = new Anthropic()

type Suggestion = {
  name: string
  url: string
  summary: string
}

async function canFetchWithoutJs(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InsightCastBot/1.0)' },
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    })
    if (!res.ok) return false
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html')) return false
    const text = await res.text()
    return text.length >= 500
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return Response.json({ error: 'invalid json' }, { status: 400 })
  const { industry, location, url, projectId } = body as Record<string, unknown>
  const normalizedUrl = normalizeAnalysisUrl(typeof url === 'string' ? url : '')
  const normalizedIndustry = typeof industry === 'string' ? industry.trim() : ''
  const normalizedLocation = typeof location === 'string' ? location.trim() : ''
  const normalizedProjectId = typeof projectId === 'string' ? projectId : null

  if (!normalizedUrl || !normalizedIndustry) {
    return Response.json({ suggestions: [] }, { status: 400 })
  }
  if (normalizedIndustry.length > 200 || normalizedLocation.length > 200) {
    return Response.json({ error: 'input too long' }, { status: 400 })
  }

  const inputSignature = buildCompetitorSuggestionSignature({
    url: normalizedUrl,
    industry: normalizedIndustry,
    location: normalizedLocation,
  })

  const { data: cached } = await supabase
    .from('competitor_suggestion_caches')
    .select('suggestions, updated_at')
    .eq('user_id', user.id)
    .eq('input_signature', inputSignature)
    .maybeSingle()

  if (cached?.suggestions && Array.isArray(cached.suggestions)) {
    return Response.json({
      suggestions: cached.suggestions,
      cached: true,
      savedAt: cached.updated_at,
    })
  }

  if (!(await checkRateLimit(user.id, '/api/profile/competitor-suggestions')).allowed) {
    return Response.json({ error: 'rate_limit_exceeded' }, { status: 429 })
  }

  let hpAuditContext = ''
  if (normalizedProjectId) {
    const { data: ownedProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', normalizedProjectId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (ownedProject) {
      const { data: audit } = await supabase
        .from('hp_audits')
        .select('raw_data')
        .eq('project_id', normalizedProjectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const raw = audit?.raw_data as Record<string, unknown> | null
      const toStringList = (v: unknown) =>
        Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []

      const currentContent = toStringList(raw?.current_content)
      const strengths = toStringList(raw?.strengths)
      const gaps = toStringList(raw?.gaps)

      if (currentContent.length > 0 || strengths.length > 0 || gaps.length > 0) {
        hpAuditContext = `\n\n## 自社HPの現状分析\n現在伝えていること: ${currentContent.join('、') || '不明'}\n強み: ${strengths.join('、') || '不明'}\n伝えきれていないこと: ${gaps.join('、') || '不明'}`
      }
    }
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `以下の事業者の競合となりそうなウェブサイトを8件提案してください。

業種: ${normalizedIndustry || '不明'}
地域: ${normalizedLocation || '不明'}
自社HP: ${normalizedUrl || '不明'}${hpAuditContext}

条件:
- 実在する可能性が高い具体的なURLを提案する
- 同じ地域・同業種の競合を優先する
- 全国チェーンより地域密着の競合を優先する
- 競合ごとに「何が特徴か」を1〜2文で簡潔に添える
- 必ずJSON配列形式のみで返す（説明文不要）

返答形式（このJSONのみ返す）:
[
  {
    "name": "競合名",
    "url": "https://example1.com",
    "summary": "地域密着で何を打ち出しているかの簡単な説明"
  }
]`,
    }],
  })

  logApiUsage({ userId: user.id, route: 'competitor-suggestions', model: 'claude-sonnet-4-6', inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }).catch(() => {})

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'

  try {
    const jsonText = text.match(/\[[\s\S]*\]/)?.[0] ?? '[]'
    const raw = JSON.parse(jsonText)
    const suggestions = (Array.isArray(raw) ? raw : [])
      .map((item): Suggestion | null => {
        if (!item || typeof item !== 'object') return null
        const urlValue = normalizeAnalysisUrl(typeof item.url === 'string' ? item.url : '')
        if (!urlValue) return null
        return {
          name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : urlValue.replace(/^https?:\/\//, ''),
          url: urlValue,
          summary: typeof item.summary === 'string' && item.summary.trim() ? item.summary.trim() : '自社HPとの違いを見比べやすそうな候補です。',
        }
      })
      .filter((item): item is Suggestion => item !== null)

    const settled = await Promise.allSettled(
      suggestions.map(async (s) => ({ s, ok: await canFetchWithoutJs(s.url) }))
    )
    const filtered = settled
      .flatMap((r) => (r.status === 'fulfilled' && r.value.ok ? [r.value.s] : []))
      .slice(0, 5)

    const { error: cacheError } = await supabase
      .from('competitor_suggestion_caches')
      .upsert({
        user_id: user.id,
        source_url: normalizedUrl,
        industry: normalizedIndustry,
        location: normalizedLocation || null,
        input_signature: inputSignature,
        suggestions: filtered,
      }, {
        onConflict: 'user_id,input_signature',
      })
    if (cacheError) {
      // キャッシュ保存の失敗はレスポンスをブロックしない
      console.warn('[competitor-suggestions] cache upsert failed:', cacheError.message)
    }

    return Response.json({ suggestions: filtered, cached: false })
  } catch {
    return Response.json({ suggestions: [] })
  }
}
