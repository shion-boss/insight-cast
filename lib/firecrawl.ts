import { logApiUsage } from '@/lib/api-usage'

// Starter plan ($16/3,000 credits) ≒ $0.0053/scrape
const FIRECRAWL_COST_PER_SCRAPE = 0.0053

// SSRF 対策: ループバック・プライベートIPアドレスへのアクセスを拒否する
// URL オブジェクトは IPv6 アドレスを "[::1]" のようにブラケット付きで返すため、
// "::1" と "[::1]" の両パターンをカバーする。
// また "[" で始まる hostname（= IPv6 リテラル全般）を拒否することで
// fc00::/7 などプライベート IPv6 範囲も一括ブロックする。
const BLOCKED_HOSTNAME_PATTERN = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|::1|\[::1\]|0\.0\.0\.0|\[)/

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (BLOCKED_HOSTNAME_PATTERN.test(parsed.hostname)) return false
    return true
  } catch {
    return false
  }
}

export async function fetchMarkdown(
  url: string,
  opts?: { userId?: string | null; projectId?: string | null; route?: string },
): Promise<string> {
  if (!isSafeUrl(url)) {
    console.error('[firecrawl] unsafe URL rejected', url)
    return ''
  }
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'], waitFor: 2000 }),
    signal: AbortSignal.timeout(30000),
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
