import Anthropic from '@anthropic-ai/sdk'
import { fetchMarkdown as firecrawlFetchMarkdown } from '@/lib/firecrawl'
import { isRecord, parseJsonObject } from '@/lib/utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FIRECRAWL_API_BASE = 'https://api.firecrawl.dev/v1'
const DEFAULT_DISCOVERED_BLOG_POST_LIMIT = 50
// 競合サイトはクレジット節約のため上限を絞る
export const COMPETITOR_BLOG_POST_LIMIT = 20
const SUPPORT_SELECTION_QUERY_LIMIT = 2400
const BLOG_SUMMARY_MAX_LENGTH = 180
const BLOG_TITLE_MAX_LENGTH = 120

const BLOG_PATH_KEYWORDS = [
  'blog',
  'blogs',
  'news',
  'column',
  'columns',
  'article',
  'articles',
  'post',
  'posts',
  'media',
  'journal',
  'note',
  'notes',
  'case',
  'cases',
  'interview',
  'interviews',
  'topics',
  'voice',
  'voices',
  'insight',
  'insights',
  'archive',
  'archives',
  'お知らせ',
  'ブログ',
  'コラム',
  '記事',
  '事例',
  '実績',
  '導入事例',
]

const BLOG_EXCLUDED_KEYWORDS = [
  'contact',
  'contacts',
  'privacy',
  'policy',
  'terms',
  'about',
  'company',
  'service',
  'services',
  'lp',
  'faq',
  'recruit',
  'careers',
  'cart',
  'shop',
  'login',
  'signup',
  'sign-up',
]

export type StoredSiteBlogPost = {
  url: string
  title: string
  summary: string
  published_at?: string | null
}

export type BlogMonthlyCount = {
  month: string
  count: number
}

export type StoredBlogMetrics = {
  trackedPostCount: number
  datedPostCount: number
  latestPublishedAt: string | null
  oldestPublishedAt: string | null
  daysSinceLatestPost: number | null
  postsLast30Days: number
  postsLast90Days: number
  averagePostsPerMonth: number | null
  freshnessStatus: 'fresh' | 'watch' | 'stale' | 'unknown'
  recentMonthlyCounts: BlogMonthlyCount[]
}

type CandidateBlogPost = {
  id: string
  url: string
  title: string
  summary: string
}

type FirecrawlMapResponse = {
  links?: string[]
}

function normalizeBlogTitle(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, BLOG_TITLE_MAX_LENGTH)
}

function normalizeBlogSummary(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, BLOG_SUMMARY_MAX_LENGTH)
}

function normalizeBlogUrl(value: unknown) {
  if (typeof value !== 'string') return ''
  try {
    return new URL(value).toString()
  } catch {
    return ''
  }
}

function decodeSafe(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseYearMonthDate(year: string, month: string, day = '01') {
  const normalized = new Date(`${year}-${month}-${day}T00:00:00+09:00`)
  return Number.isNaN(normalized.getTime()) ? null : normalized
}

function extractPublishedDateFromUrl(url: string) {
  const decoded = decodeSafe(url)
  const patterns = [
    decoded.match(/[/_-](20\d{2})[/_.-](0[1-9]|1[0-2])[/_.-](0[1-9]|[12]\d|3[01])(?:[/_.-]|$)/),
    decoded.match(/[/_-](20\d{2})[/_.-](0[1-9]|1[0-2])(?:[/_.-]|$)/),
    decoded.match(/(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/),
  ]

  for (const match of patterns) {
    if (!match) continue
    const date = parseYearMonthDate(match[1], match[2], match[3] ?? '01')
    if (date) return date
  }

  return null
}

function extractPublishedDateFromTitle(title: string) {
  const patterns = [
    title.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日/),
    title.match(/(20\d{2})[/.年-](\d{1,2})[/.月-](\d{1,2})/),
    title.match(/(20\d{2})年(\d{1,2})月/),
  ]

  for (const match of patterns) {
    if (!match) continue
    const date = parseYearMonthDate(
      match[1],
      match[2].padStart(2, '0'),
      match[3]?.padStart(2, '0') ?? '01',
    )
    if (date) return date
  }

  return null
}

function sortDatesAsc(dates: Date[]) {
  return [...dates].sort((left, right) => left.getTime() - right.getTime())
}

function toIsoStringOrNull(date: Date | null) {
  return date ? date.toISOString() : null
}

export function extractStoredBlogPublishedAt(post: StoredSiteBlogPost) {
  if (post.published_at) {
    const d = new Date(post.published_at)
    if (!Number.isNaN(d.getTime())) return d
  }
  return extractPublishedDateFromUrl(post.url) ?? extractPublishedDateFromTitle(post.title)
}

export function buildBlogFreshnessMetrics(
  posts: StoredSiteBlogPost[],
  now = new Date(),
): StoredBlogMetrics {
  const publishedDates = sortDatesAsc(
    posts
      .map((post) => extractStoredBlogPublishedAt(post))
      .filter((value): value is Date => value instanceof Date),
  )

  const latest = publishedDates[publishedDates.length - 1] ?? null
  const oldest = publishedDates[0] ?? null
  const dayMs = 24 * 60 * 60 * 1000
  const daysSinceLatestPost = latest
    ? Math.max(0, Math.floor((now.getTime() - latest.getTime()) / dayMs))
    : null
  const last30 = new Date(now)
  last30.setDate(last30.getDate() - 30)
  const last90 = new Date(now)
  last90.setDate(last90.getDate() - 90)
  const postsLast30Days = publishedDates.filter((date) => date >= last30).length
  const postsLast90Days = publishedDates.filter((date) => date >= last90).length

  let averagePostsPerMonth: number | null = null
  if (oldest && latest) {
    const monthSpan = Math.max(
      1,
      (latest.getFullYear() - oldest.getFullYear()) * 12 + latest.getMonth() - oldest.getMonth() + 1,
    )
    averagePostsPerMonth = Number((publishedDates.length / monthSpan).toFixed(1))
  }

  const monthlyMap = new Map<string, number>()
  for (const date of publishedDates) {
    const key = toMonthKey(date)
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1)
  }

  const recentMonthlyCounts = [...monthlyMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([month, count]) => ({ month, count }))

  const freshnessStatus = (() => {
    if (!latest) return 'unknown' as const
    if (daysSinceLatestPost !== null && daysSinceLatestPost <= 45) return 'fresh' as const
    if (daysSinceLatestPost !== null && daysSinceLatestPost <= 120) return 'watch' as const
    return 'stale' as const
  })()

  return {
    trackedPostCount: posts.length,
    datedPostCount: publishedDates.length,
    latestPublishedAt: toIsoStringOrNull(latest),
    oldestPublishedAt: toIsoStringOrNull(oldest),
    daysSinceLatestPost,
    postsLast30Days,
    postsLast90Days,
    averagePostsPerMonth,
    freshnessStatus,
    recentMonthlyCounts,
  }
}

async function firecrawlRequest<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(`${FIRECRAWL_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('[firecrawl] firecrawlRequest failed', path, res.status)
    return null
  }
  return await res.json() as T
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
    origin = new URL(siteUrl).origin
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
        headers: { 'User-Agent': 'InsightCast/1.0 (+https://insightcast.jp)' },
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
              headers: { 'User-Agent': 'InsightCast/1.0 (+https://insightcast.jp)' },
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
    origin = new URL(siteUrl).origin
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
        headers: { 'User-Agent': 'InsightCast/1.0 (+https://insightcast.jp)' },
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
  const base = new URL(siteUrl)
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


async function summarizeBlogPostPages(
  pages: Array<{ url: string; markdown: string }>,
  lastmodMap: Map<string, string> = new Map(),
) {
  if (pages.length === 0) return [] as StoredSiteBlogPost[]

  const prompt = `以下は同一サイト内の過去ブログ記事候補です。各ページの内容を読んで、日本語で使いやすい一覧に整理してください。

## ルール
- URLごとに1件ずつ返す
- title はページ内容に沿った自然な記事タイトルを短く
- summary は「何が書かれているか」が一目で分かる1文
- published_at はページ本文中に「2024年3月15日」「2024-03-15」「2024/03/15」等の日付があれば ISO 8601形式（YYYY-MM-DD）で返す。見当たらなければ null
- 実体のないURLは返さない
- JSONのみ返す

## ページ一覧
${pages.map((page, index) => `### candidate_${index + 1}
url: ${page.url}
content:
${page.markdown.slice(0, 3200)}`).join('\n\n')}

## 出力形式
{
  "posts": [
    {
      "url": "https://example.com/blog/post",
      "title": "記事タイトル",
      "summary": "この記事で何を伝えているかの要約",
      "published_at": "2024-03-15"
    }
  ]
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: Math.min(8192, pages.length * 200 + 512),
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const parsed = parseJsonObject(text)
    const posts = Array.isArray(parsed?.posts) ? parsed.posts : []

    const normalizedPosts: StoredSiteBlogPost[] = []
    const seen = new Set<string>()

    for (const post of posts) {
      if (!isRecord(post)) continue
      const url = normalizeBlogUrl(post.url)
      const title = normalizeBlogTitle(post.title)
      const summary = normalizeBlogSummary(post.summary)
      if (!url || !title || !summary || seen.has(url)) continue
      seen.add(url)

      // published_at の優先順位: AI抽出 > sitemap lastmod > null
      const aiDate = typeof post.published_at === 'string' && /^\d{4}-\d{2}-\d{2}/.test(post.published_at)
        ? post.published_at.slice(0, 10)
        : null
      const lastmod = lastmodMap.get(url) ?? null
      const published_at = aiDate ?? (lastmod ? lastmod.slice(0, 10) : null)

      normalizedPosts.push({ url, title, summary, published_at })
    }

    return normalizedPosts
  } catch (e) {
    console.error('[summarizeBlogPostPages] failed:', e)
    return [] as StoredSiteBlogPost[]
  }
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

export function getStoredSiteBlogPosts(rawData: Record<string, unknown> | null | undefined) {
  if (!isRecord(rawData) || !Array.isArray(rawData.blog_posts)) return [] as StoredSiteBlogPost[]

  const posts: StoredSiteBlogPost[] = []
  const seen = new Set<string>()

  for (const item of rawData.blog_posts) {
    if (!isRecord(item)) continue
    const url = normalizeBlogUrl(item.url)
    const title = normalizeBlogTitle(item.title)
    const summary = normalizeBlogSummary(item.summary)
    if (!url || !title || !summary || seen.has(url)) continue
    seen.add(url)
    const published_at = typeof item.published_at === 'string' ? item.published_at : null
    posts.push({ url, title, summary, published_at })
  }

  return posts
}

export function getStoredBlogMetrics(rawData: Record<string, unknown> | null | undefined) {
  if (!isRecord(rawData) || !isRecord(rawData.blog_metrics)) return null

  const rawMetrics = rawData.blog_metrics
  const recentMonthlyCounts = Array.isArray(rawMetrics.recentMonthlyCounts)
    ? rawMetrics.recentMonthlyCounts.flatMap((entry) => {
        if (!isRecord(entry) || typeof entry.month !== 'string' || typeof entry.count !== 'number') return []
        return [{ month: entry.month, count: entry.count }]
      })
    : []

  const freshnessStatus = rawMetrics.freshnessStatus
  if (
    typeof rawMetrics.trackedPostCount !== 'number'
    || typeof rawMetrics.datedPostCount !== 'number'
    || typeof rawMetrics.postsLast30Days !== 'number'
    || typeof rawMetrics.postsLast90Days !== 'number'
    || (rawMetrics.averagePostsPerMonth !== null && typeof rawMetrics.averagePostsPerMonth !== 'number')
    || !['fresh', 'watch', 'stale', 'unknown'].includes(typeof freshnessStatus === 'string' ? freshnessStatus : '')
  ) {
    return null
  }

  const normalizedFreshnessStatus = freshnessStatus as StoredBlogMetrics['freshnessStatus']

  return {
    trackedPostCount: rawMetrics.trackedPostCount,
    datedPostCount: rawMetrics.datedPostCount,
    latestPublishedAt: typeof rawMetrics.latestPublishedAt === 'string' ? rawMetrics.latestPublishedAt : null,
    oldestPublishedAt: typeof rawMetrics.oldestPublishedAt === 'string' ? rawMetrics.oldestPublishedAt : null,
    daysSinceLatestPost: typeof rawMetrics.daysSinceLatestPost === 'number' ? rawMetrics.daysSinceLatestPost : null,
    postsLast30Days: rawMetrics.postsLast30Days,
    postsLast90Days: rawMetrics.postsLast90Days,
    averagePostsPerMonth: typeof rawMetrics.averagePostsPerMonth === 'number' ? rawMetrics.averagePostsPerMonth : null,
    freshnessStatus: normalizedFreshnessStatus,
    recentMonthlyCounts,
  } satisfies StoredBlogMetrics
}

function dedupeBlogPosts(posts: StoredSiteBlogPost[], limit: number) {
  const deduped: StoredSiteBlogPost[] = []
  const seen = new Set<string>()

  for (const post of posts) {
    const url = normalizeBlogUrl(post.url)
    if (!url || seen.has(url)) continue
    seen.add(url)
    deduped.push({
      url,
      title: normalizeBlogTitle(post.title),
      summary: normalizeBlogSummary(post.summary),
    })
    if (deduped.length >= limit) break
  }

  return deduped
}

function stripCandidateId(candidate: CandidateBlogPost): StoredSiteBlogPost {
  return {
    url: candidate.url,
    title: candidate.title,
    summary: candidate.summary,
  }
}

async function pickRelevantCandidateIds(
  query: string,
  ownCandidates: CandidateBlogPost[],
  competitorCandidates: CandidateBlogPost[],
  maxOwnPosts: number,
  maxCompetitorPosts: number,
) {
  if (ownCandidates.length === 0 && competitorCandidates.length === 0) {
    return { ownIds: [] as string[], competitorIds: [] as string[] }
  }

  const prompt = `あなたは、インタビュー中に参考として見せる関連記事を選ぶ補助役です。

## 今の質問・文脈
${query.slice(0, SUPPORT_SELECTION_QUERY_LIMIT)}

## 自社HPの過去ブログ候補
${JSON.stringify(ownCandidates, null, 2)}

## 競合ブログ候補
${JSON.stringify(competitorCandidates, null, 2)}

## 選び方
- 今の質問や記事テーマと、扱っている論点や切り口が近い記事だけを選ぶ
- 単に同じ業種・同じサイトというだけでは選ばない
- 自社HPの記事は内部リンク候補として使えるものを優先
- 競合ブログは参考用なので、比較や視点の違いが見えそうなものを優先
- 近いテーマの記事がなければ空配列にする
- JSONのみ返す

## 出力形式
{
  "own_ids": ["o1", "o2"],
  "competitor_ids": ["c1", "c2"]
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const parsed = parseJsonObject(text)
    const ownIds = Array.isArray(parsed?.own_ids)
      ? parsed.own_ids.filter((value): value is string => typeof value === 'string')
      : []
    const competitorIds = Array.isArray(parsed?.competitor_ids)
      ? parsed.competitor_ids.filter((value): value is string => typeof value === 'string')
      : []

    return {
      ownIds: ownIds.slice(0, maxOwnPosts),
      competitorIds: competitorIds.slice(0, maxCompetitorPosts),
    }
  } catch {
    return {
      ownIds: [],
      competitorIds: [],
    }
  }
}

export async function selectRelevantBlogPosts(params: {
  query: string
  ownPosts: StoredSiteBlogPost[]
  competitorPosts?: StoredSiteBlogPost[]
  maxOwnPosts?: number
  maxCompetitorPosts?: number
}) {
  const {
    query,
    ownPosts,
    competitorPosts = [],
    maxOwnPosts = 3,
    maxCompetitorPosts = 3,
  } = params

  const normalizedOwnPosts = dedupeBlogPosts(ownPosts, 10)
  const normalizedCompetitorPosts = dedupeBlogPosts(competitorPosts, 12)

  const ownCandidates = normalizedOwnPosts.map((post, index) => ({
    id: `o${index + 1}`,
    ...post,
  }))
  const competitorCandidates = normalizedCompetitorPosts.map((post, index) => ({
    id: `c${index + 1}`,
    ...post,
  }))

  const { ownIds, competitorIds } = await pickRelevantCandidateIds(
    query,
    ownCandidates,
    competitorCandidates,
    maxOwnPosts,
    maxCompetitorPosts,
  )

  const ownIdSet = new Set(ownIds)
  const competitorIdSet = new Set(competitorIds)
  const selectedOwnPosts = ownCandidates.filter((candidate) => ownIdSet.has(candidate.id)).map(stripCandidateId)
  const selectedCompetitorPosts = competitorCandidates.filter((candidate) => competitorIdSet.has(candidate.id)).map(stripCandidateId)

  return {
    ownPosts: selectedOwnPosts,
    competitorPosts: selectedCompetitorPosts,
  }
}
