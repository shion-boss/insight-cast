import { createAdminClient } from '@/lib/supabase/admin'

// claude-sonnet-4-6: $3/M input, $15/M output
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-haiku-4-5': { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
  'claude-opus-4-7': { input: 15 / 1_000_000, output: 75 / 1_000_000 },
}

export async function logApiUsage({
  userId,
  projectId,
  route,
  model,
  inputTokens,
  outputTokens,
}: {
  userId?: string | null
  projectId?: string | null
  route: string
  model: string
  inputTokens: number
  outputTokens: number
}) {
  const pricing = MODEL_PRICING[model] ?? { input: 0, output: 0 }
  const costUsd = inputTokens * pricing.input + outputTokens * pricing.output

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
