import { logApiUsage } from '@/lib/api-usage'

// Starter plan ($16/3,000 credits) ≒ $0.0053/scrape
const FIRECRAWL_COST_PER_SCRAPE = 0.0053

export async function fetchMarkdown(
  url: string,
  opts?: { userId?: string | null; projectId?: string | null; route?: string },
): Promise<string> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'], waitFor: 2000 }),
  })
  if (!res.ok) {
    console.error('[firecrawl] fetchMarkdown failed', url, res.status)
    return ''
  }
  const json = await res.json()

  await logApiUsage({
    userId: opts?.userId ?? null,
    projectId: opts?.projectId ?? null,
    route: opts?.route ?? 'firecrawl/scrape',
    model: 'firecrawl',
    inputTokens: 0,
    outputTokens: 0,
    costOverride: FIRECRAWL_COST_PER_SCRAPE,
  })

  return (json.data?.markdown as string) ?? ''
}
