import { buildCompetitorSuggestionSignature, normalizeAnalysisUrl } from '@/lib/analysis/cache'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

type QueryRow = Record<string, unknown> | null

interface QueryBuilder extends PromiseLike<{ error: unknown }> {
  select(columns: string): QueryBuilder
  update(values: Record<string, unknown>): QueryBuilder
  upsert(values: Record<string, unknown>, options: { onConflict: string }): Promise<{ error: unknown }>
  eq(column: string, value: string): QueryBuilder
  order(column: string, options: { ascending: boolean }): QueryBuilder
  limit(count: number): QueryBuilder
  maybeSingle(): Promise<{ data: QueryRow; error: unknown }>
}

type SupabaseLike = {
  from(table: string): unknown
}

export async function loadProjectCompetitorContext(input: {
  supabase: SupabaseLike
  userId: string
  projectId: string
  hpUrl: string
}) {
  const { supabase, userId, projectId, hpUrl } = input
  const client = supabase as { from: (table: string) => QueryBuilder }

  const { data: projectContext, error: projectContextError } = await client
    .from('projects')
    .select('industry_memo, location')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!projectContextError) {
    return {
      industryMemo: normalizeText(projectContext?.industry_memo),
      location: normalizeText(projectContext?.location),
    }
  }

  const normalizedHpUrl = normalizeAnalysisUrl(hpUrl)
  if (!normalizedHpUrl) {
    return {
      industryMemo: '',
      location: '',
    }
  }

  const { data: cachedContext } = await client
    .from('competitor_suggestion_caches')
    .select('industry, location')
    .eq('user_id', userId)
    .eq('source_url', normalizedHpUrl)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    industryMemo: normalizeText(cachedContext?.industry),
    location: normalizeText(cachedContext?.location),
  }
}

export async function rememberProjectCompetitorContext(input: {
  supabase: SupabaseLike
  userId: string
  projectId: string
  hpUrl: string
  industryMemo: string
  location: string
}) {
  const { supabase, userId, projectId, hpUrl } = input
  const client = supabase as { from: (table: string) => QueryBuilder }
  const industryMemo = normalizeText(input.industryMemo)
  const location = normalizeText(input.location)

  await client
    .from('projects')
    .update({
      industry_memo: industryMemo || null,
      location: location || null,
    })
    .eq('id', projectId)
    .eq('user_id', userId)

  const normalizedHpUrl = normalizeAnalysisUrl(hpUrl)
  if (!normalizedHpUrl) return

  const inputSignature = buildCompetitorSuggestionSignature({
    url: normalizedHpUrl,
    industry: industryMemo,
    location,
  })

  const { data: existingCache } = await client
    .from('competitor_suggestion_caches')
    .select('suggestions')
    .eq('user_id', userId)
    .eq('input_signature', inputSignature)
    .maybeSingle()

  const suggestions = Array.isArray(existingCache?.suggestions) ? existingCache.suggestions : []

  await client
    .from('competitor_suggestion_caches')
    .upsert({
      user_id: userId,
      source_url: normalizedHpUrl,
      industry: industryMemo,
      location: location || null,
      input_signature: inputSignature,
      suggestions,
    }, {
      onConflict: 'user_id,input_signature',
    })
}
