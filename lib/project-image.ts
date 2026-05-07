async function isImageReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    })
    if (!res.ok) return false
    const ct = res.headers.get('content-type') ?? ''
    return ct.startsWith('image/')
  } catch {
    return false
  }
}

/**
 * 自社HPから OGP image / Twitter image / apple-touch-icon / favicon を順に試して
 * プロジェクトを識別するための画像URLを返す。失敗時は null。
 * 取得した URL は HEAD リクエストで生存確認する。
 */
export async function fetchProjectImageUrl(hpUrl: string): Promise<string | null> {
  let baseUrl: URL
  try {
    baseUrl = new URL(hpUrl)
  } catch {
    return null
  }

  let html = ''
  try {
    const res = await fetch(baseUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InsightCastBot/1.0; +https://insight-cast.jp)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    })
    if (res.ok) html = await res.text()
  } catch {
    // HTML 取れなくても /favicon.ico は試す
  }

  const head = html.slice(0, 200_000) // head 領域だけで十分。長すぎる HTML を避ける

  // 優先順は favicon 系を先に。アバターサイズ（44–56px）でブランドが識別しやすい。
  // og:image は 1200x630 のバナーで縮小すると何の HP か分かりにくいので fallback に回す。
  const patterns: RegExp[] = [
    // apple-touch-icon
    /<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon[^"']*["']/i,
    // icon / shortcut icon
    /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i,
    // og:image (fallback)
    /<meta[^>]+property=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url|:url)?["']/i,
    // twitter:image (fallback)
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  ]

  const candidates: string[] = []
  for (const pattern of patterns) {
    const match = head.match(pattern)
    if (match?.[1]) {
      try {
        candidates.push(new URL(match[1].trim(), baseUrl).toString())
      } catch {
        continue
      }
    }
  }
  candidates.push(new URL('/favicon.ico', baseUrl).toString())

  // 重複排除しつつ HEAD で生存確認。最初に通ったものを採用。
  const seen = new Set<string>()
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue
    seen.add(candidate)
    if (await isImageReachable(candidate)) return candidate
  }

  return null
}
