import { createAdminClient } from '@/lib/supabase/admin'

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
