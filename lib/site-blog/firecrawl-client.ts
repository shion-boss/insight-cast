import { fetchMarkdown as firecrawlFetchMarkdown } from '@/lib/firecrawl'
import { summarizeBlogPostPages } from './ai-selector'
import {
  BLOG_EXCLUDED_KEYWORDS,
  BLOG_PATH_KEYWORDS,
  DEFAULT_DISCOVERED_BLOG_POST_LIMIT,
  FIRECRAWL_API_BASE,
} from './constants'
import { decodeSafe, normalizeBlogUrl } from './normalizers'
import type { FirecrawlMapResponse, StoredSiteBlogPost } from './types'

async function firecrawlRequest<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${FIRECRAWL_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      console.error('[firecrawl] firecrawlRequest failed', path, res.status)
      return null
    }
    return await res.json() as T
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[firecrawl] firecrawlRequest timed out', path)
    } else {
      console.error('[firecrawl] firecrawlRequest error', path, err)
    }
    return null
  }
}

// scrape は共通の fetchMarkdown を使う（waitFor: 2000 を含む）
const fetchMarkdown = firecrawlFetchMarkdown

async function mapSiteLinks(url: string) {
  const json = await firecrawlRequest<FirecrawlMapResponse>('/map', {
    url,
    limit: 200,
    includeSubdomains: false,
  })

  return Array.isArray(json?.links) ? json.links : []
}

// sitemapのXMLテキストから <loc> のURL一覧を取得する
function extractLocsFromSitemapXml(xml: string): string[] {
  const locs: string[] = []
  const locPattern = /<loc[^>]*>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi
  let match
  while ((match = locPattern.exec(xml)) !== null) {
    locs.push(match[1].trim())
  }
  return locs
}

// sitemap から lastmod つきで URL を抽出して新しい順に並べる
function extractUrlsWithLastmod(xml: string): Array<{ url: string; lastmod: string | null }> {
  const entries: Array<{ url: string; lastmod: string | null }> = []
  // <url>...</url> ブロックをひとつずつ処理
  const urlBlockPattern = /<url>([\s\S]*?)<\/url>/gi
  let block
  while ((block = urlBlockPattern.exec(xml)) !== null) {
    const content = block[1]
    const locMatch = content.match(/<loc[^>]*>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/i)
    const lastmodMatch = content.match(/<lastmod[^>]*>\s*([^<\s]+)\s*<\/lastmod>/i)
    if (locMatch) {
      entries.push({
        url: locMatch[1].trim(),
        lastmod: lastmodMatch ? lastmodMatch[1].trim() : null,
      })
    }
  }
  // lastmod 降順でソート（nullは末尾）
  entries.sort((a, b) => {
    if (!a.lastmod && !b.lastmod) return 0
    if (!a.lastmod) return 1
    if (!b.lastmod) return -1
    return b.lastmod.localeCompare(a.lastmod)
  })
  return entries
}

// sitemap index かどうか判定
function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex/i.test(xml)
}

// sitemap.xml からエントリを lastmod つきで取得（discoverNewBlogPosts 用）
async function fetchSitemapEntries(
  siteUrl: string,
): Promise<Array<{ url: string; lastmod: string | null }>> {
  let origin: string
  try {
    const parsed = new URL(siteUrl)
    if (parsed.protocol !== 'https:') return []
    origin = parsed.origin
  } catch {
    return []
  }

  const candidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
  ]

  for (const sitemapUrl of candidates) {
    try {
      const res = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'InsightCast/1.0 (+https://insight-cast.jp)' },
      })
      if (!res.ok) continue
      const xml = await res.text()

      if (isSitemapIndex(xml)) {
        const childUrls = extractLocsFromSitemapXml(xml).slice(0, 3)
        const allEntries: Array<{ url: string; lastmod: string | null }> = []
        for (const childUrl of childUrls) {
          try {
            const childRes = await fetch(childUrl, {
              signal: AbortSignal.timeout(5000),
              headers: { 'User-Agent': 'InsightCast/1.0 (+https://insight-cast.jp)' },
            })
            if (!childRes.ok) continue
            const childXml = await childRes.text()
            allEntries.push(...extractUrlsWithLastmod(childXml))
          } catch {
            // ignore
          }
        }
        allEntries.sort((a, b) => {
          if (!a.lastmod && !b.lastmod) return 0
          if (!a.lastmod) return 1
          if (!b.lastmod) return -1
          return b.lastmod.localeCompare(a.lastmod)
        })
        if (allEntries.length > 0) return allEntries
      } else {
        const entries = extractUrlsWithLastmod(xml)
        if (entries.length > 0) return entries
      }
    } catch {
      // ignore
    }
  }

  return []
}

// RSS / Atom フィードから URL 一覧を取得
async function fetchRssUrls(siteUrl: string): Promise<string[]> {
  let origin: string
  try {
    const parsed = new URL(siteUrl)
    if (parsed.protocol !== 'https:') return []
    origin = parsed.origin
  } catch {
    return []
  }

  const candidates = [
    `${origin}/feed`,
    `${origin}/feed/`,
    `${origin}/rss.xml`,
    `${origin}/atom.xml`,
    `${origin}/rss`,
    `${origin}/feed.xml`,
  ]

  for (const feedUrl of candidates) {
    try {
      const res = await fetch(feedUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'InsightCast/1.0 (+https://insight-cast.jp)' },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const urls: string[] = []

      // RSS: <link>https://...</link>（item 内のもの。channel の <link> は除外）
      const rssLinkPattern = /<item[\s\S]*?<link[^>]*>\s*(https?:\/\/[^<\s]+)\s*<\/link>/gi
      let match
      while ((match = rssLinkPattern.exec(xml)) !== null) {
        urls.push(match[1].trim())
      }

      // Atom: <entry><link href="https://..." />
      const atomLinkPattern = /<entry[\s\S]*?<link[^>]+href=["'](https?:\/\/[^"']+)["']/gi
      while ((match = atomLinkPattern.exec(xml)) !== null) {
        urls.push(match[1].trim())
      }

      if (urls.length > 0) return [...new Set(urls)]
    } catch {
      // ignore
    }
  }

  return []
}

// メディアファイルやシステムURLを除外する
function isNotMediaOrSystemUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|xml|json|css|js|woff|woff2|ttf|eot)$/i.test(path)) return false
    // パスセグメント単位で完全一致のみ除外（substring一致だと誤フィルタが発生する）
    const segments = path.split('/').filter(Boolean)
    if (segments.some((seg) => BLOG_EXCLUDED_KEYWORDS.includes(seg))) return false
    return true
  } catch {
    return false
  }
}

// Firecrawl /map を使ったフォールバック
// /map はサイト全体のURLを一括返却するので、一覧ページを再スクレイプせず直接フィルタする
async function discoverViaFirecrawlMap(siteUrl: string): Promise<string[]> {
  const allLinks = await mapSiteLinks(siteUrl)
  // ブログらしさスコア降順で並べ、呼び出し元の isNotMediaOrSystemUrl + slice に任せる
  return filterToSameHost(siteUrl, allLinks)
    .sort((a, b) => scoreBlogUrl(b) - scoreBlogUrl(a))
}

// ブログ一覧ページをスクレイプしてリンクを収集するフォールバック
// サイトマップ・RSS・Firecrawl map が使えないサイト向け
async function discoverViaBlogIndexScrape(siteUrl: string): Promise<string[]> {
  let base: URL
  try {
    base = new URL(siteUrl)
    if (base.protocol !== 'https:') return []
  } catch {
    return []
  }
  const candidates = BLOG_PATH_KEYWORDS.map((kw) => `${base.origin}/${kw}`)

  const results: string[] = []
  for (const indexUrl of candidates) {
    try {
      const markdown = await fetchMarkdown(indexUrl)
      if (!markdown || markdown.trim().length < 100) continue

      // markdown 内のリンク [text](url) と生URL を抽出
      const linkPattern = /https?:\/\/[^\s\)\"\']+/g
      const found = Array.from(markdown.matchAll(linkPattern), (m) => m[0])
      const sameHost = filterToSameHost(siteUrl, found).filter(isNotMediaOrSystemUrl)
      const blogLike = sameHost.filter((u) => scoreBlogUrl(u) >= 2)
      results.push(...blogLike)
      if (results.length >= 5) break
    } catch {
      // 存在しないパスは無視
    }
  }

  return [...new Set(results)].sort((a, b) => scoreBlogUrl(b) - scoreBlogUrl(a))
}

function scoreBlogUrl(candidateUrl: string) {
  try {
    const parsed = new URL(candidateUrl)
    const decodedPath = decodeSafe(parsed.pathname).toLowerCase()
    const segments = decodedPath.split('/').filter(Boolean)
    let score = 0

    if (BLOG_PATH_KEYWORDS.some((keyword) => decodedPath.includes(keyword))) score += 4
    if (/\/20\d{2}[/-]\d{1,2}/.test(decodedPath) || /\/\d{4}\/\d{2}\//.test(decodedPath)) score += 3
    score += Math.min(segments.length, 4)
    // クエリパラメータあり = 個別記事（works_detail?actual_object_id=XXX 等）
    if (parsed.search) score += 2
    // 一覧ページペナルティ: depth=1 かつ blogキーワード単独（/blog/ /column/ 等）
    if (segments.length === 1 && BLOG_PATH_KEYWORDS.some((kw) => segments[0] === kw)) score -= 3

    return score
  } catch {
    return 0
  }
}

function stripWww(host: string) {
  return host.startsWith('www.') ? host.slice(4) : host
}

function filterToSameHost(siteUrl: string, links: string[]) {
  let siteHost = ''
  try {
    siteHost = stripWww(new URL(siteUrl).host)
  } catch {
    return []
  }
  return [...new Set(links.map(normalizeBlogUrl).filter(Boolean))].filter((link) => {
    try {
      const linkHost = stripWww(new URL(link).host)
      return linkHost === siteHost || linkHost.endsWith(`.${siteHost}`)
    } catch {
      return false
    }
  })
}


export async function discoverSiteBlogPosts(siteUrl: string, limit = DEFAULT_DISCOVERED_BLOG_POST_LIMIT) {
  // 1. sitemap.xml から取得（lastmod 付き）
  const sitemapEntries = await fetchSitemapEntries(siteUrl)
  let candidateUrls: string[] = sitemapEntries.map((e) => e.url)
  const lastmodMap = new Map(sitemapEntries.map((e) => [normalizeBlogUrl(e.url), e.lastmod ?? '']))

  // 2. RSS フォールバック
  if (candidateUrls.length === 0) {
    candidateUrls = await fetchRssUrls(siteUrl)
  }

  // 3. Firecrawl /map フォールバック
  if (candidateUrls.length === 0) {
    candidateUrls = await discoverViaFirecrawlMap(siteUrl)
  }

  if (candidateUrls.length === 0) return [] as StoredSiteBlogPost[]

  const sameHostUrls = filterToSameHost(siteUrl, candidateUrls)
  const filtered = sameHostUrls.filter(isNotMediaOrSystemUrl)
  const scored = filtered.sort((a, b) => scoreBlogUrl(b) - scoreBlogUrl(a))
  const blogLikeUrls = scored.filter((url) => scoreBlogUrl(url) >= 2)

  // 4. blogLike が少ない場合、一覧ページスクレイプで補完
  let urlsToFetch = (blogLikeUrls.length > 0 ? blogLikeUrls : scored).slice(0, limit)
  if (urlsToFetch.length < 3) {
    const scraped = await discoverViaBlogIndexScrape(siteUrl)
    const existing = new Set(urlsToFetch.map(normalizeBlogUrl))
    const added = scraped.filter((u) => !existing.has(normalizeBlogUrl(u)))
    urlsToFetch = [...urlsToFetch, ...added].slice(0, limit)
  }

  if (urlsToFetch.length === 0) return [] as StoredSiteBlogPost[]

  const pages = await Promise.all(urlsToFetch.map(async (url) => ({
    url,
    markdown: await fetchMarkdown(url),
  })))

  return await summarizeBlogPostPages(
    pages.filter((page) => page.markdown.trim().length > 0),
    lastmodMap,
  )
}

// 再調査: 既存記事にない新着のみ取得して追記（月次再調査用）
export async function discoverNewBlogPosts(
  siteUrl: string,
  existingPosts: StoredSiteBlogPost[],
  limit = DEFAULT_DISCOVERED_BLOG_POST_LIMIT,
): Promise<StoredSiteBlogPost[]> {
  const existingUrls = new Set(existingPosts.map((p) => normalizeBlogUrl(p.url)).filter(Boolean))

  // 1. sitemap のエントリ（lastmod 付き）を取得して差分を先頭から拾う
  const sitemapEntries = await fetchSitemapEntries(siteUrl)
  const lastmodMap = new Map(sitemapEntries.map((e) => [normalizeBlogUrl(e.url), e.lastmod ?? '']))

  if (sitemapEntries.length > 0) {
    const newUrls: string[] = []
    let consecutiveExisting = 0

    for (const entry of sitemapEntries) {
      if (newUrls.length >= limit) break
      const normalized = normalizeBlogUrl(entry.url)
      if (!normalized) continue
      if (!isNotMediaOrSystemUrl(normalized)) continue
      if (!filterToSameHost(siteUrl, [normalized]).length) continue

      if (existingUrls.has(normalized)) {
        consecutiveExisting++
        if (consecutiveExisting >= 3) break
      } else {
        consecutiveExisting = 0
        newUrls.push(normalized)
      }
    }

    if (newUrls.length > 0) {
      const pages = await Promise.all(newUrls.slice(0, limit).map(async (url) => ({
        url,
        markdown: await fetchMarkdown(url),
      })))
      return await summarizeBlogPostPages(
        pages.filter((page) => page.markdown.trim().length > 0),
        lastmodMap,
      )
    }
  }

  // 2. RSS フォールバック
  const rssUrls = await fetchRssUrls(siteUrl)
  if (rssUrls.length > 0) {
    const newUrls = filterToSameHost(siteUrl, rssUrls)
      .filter(isNotMediaOrSystemUrl)
      .filter((url) => !existingUrls.has(normalizeBlogUrl(url)))
      .slice(0, limit)

    if (newUrls.length > 0) {
      const pages = await Promise.all(newUrls.map(async (url) => ({
        url,
        markdown: await fetchMarkdown(url),
      })))
      return await summarizeBlogPostPages(
        pages.filter((page) => page.markdown.trim().length > 0),
        lastmodMap,
      )
    }
  }

  // 3. Firecrawl /map フォールバック
  const allLinks = await mapSiteLinks(siteUrl)
  let newUrls = filterToSameHost(siteUrl, allLinks)
    .filter(isNotMediaOrSystemUrl)
    .filter((url) => !existingUrls.has(normalizeBlogUrl(url)))
    .sort((a, b) => scoreBlogUrl(b) - scoreBlogUrl(a))
    .slice(0, limit)

  // 4. 一覧ページスクレイプで補完
  if (newUrls.length < 3) {
    const scraped = await discoverViaBlogIndexScrape(siteUrl)
    const added = scraped.filter((u) => !existingUrls.has(normalizeBlogUrl(u)) && !newUrls.some((n) => normalizeBlogUrl(n) === normalizeBlogUrl(u)))
    newUrls = [...newUrls, ...added].slice(0, limit)
  }

  if (newUrls.length === 0) return []

  const pages = await Promise.all(newUrls.map(async (url) => ({
    url,
    markdown: await fetchMarkdown(url),
  })))

  return await summarizeBlogPostPages(
    pages.filter((page) => page.markdown.trim().length > 0),
    lastmodMap,
  )
}
