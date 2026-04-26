import { createAdminClient } from '@/lib/supabase/admin'

// Per-user rate limits for AI routes
export const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  '/api/projects/[id]/interview/chat': { maxRequests: 30, windowMs: 60_000 },
  '/api/projects/[id]/analyze':        { maxRequests: 3,  windowMs: 3_600_000 },
  '/api/projects/[id]/article':        { maxRequests: 5,  windowMs: 3_600_000 },
  '/api/cast-talk/generate':           { maxRequests: 5,  windowMs: 3_600_000 },
}

export async function checkRateLimit(userId: string, route: string): Promise<{ allowed: boolean }> {
  const limit = RATE_LIMITS[route]
  if (!limit) return { allowed: true }

  const supabase = createAdminClient()
  const since = new Date(Date.now() - limit.windowMs).toISOString()
  const { count, error } = await supabase
    .from('api_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('route', route)
    .gte('created_at', since)

  if (error) return { allowed: true } // ログ障害時はブロックしない
  return { allowed: (count ?? 0) < limit.maxRequests }
}

// API pricing per token (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Claude API (Anthropic)
  'claude-sonnet-4-6': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-haiku-4-5': { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
  'claude-haiku-4-5-20251001': { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
  'claude-opus-4-7': { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  // Claude Max (月額サブスク $100/200 — API費用は0として記録、別途固定費で管理)
  'claude-max-sonnet': { input: 0, output: 0 },
  'claude-max-opus': { input: 0, output: 0 },
}

export async function logApiUsage({
  userId,
  projectId,
  route,
  model,
  inputTokens,
  outputTokens,
  costOverride,
}: {
  userId?: string | null
  projectId?: string | null
  route: string
  model: string
  inputTokens: number
  outputTokens: number
  costOverride?: number
}) {
  const pricing = MODEL_PRICING[model] ?? { input: 0, output: 0 }
  const costUsd = costOverride ?? (inputTokens * pricing.input + outputTokens * pricing.output)

  const supabase = createAdminClient()
  const { error } = await supabase.from('api_usage_logs').insert({
    user_id: userId ?? null,
    project_id: projectId ?? null,
    route,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: costUsd,
  })

  if (error) {
    console.warn('[api-usage] ログ保存失敗:', error.message)
  }
}
