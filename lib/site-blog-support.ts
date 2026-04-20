import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FIRECRAWL_API_BASE = 'https://api.firecrawl.dev/v1'
const DEFAULT_DISCOVERED_BLOG_POST_LIMIT = 5
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
  'works',
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function decodeSafe(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function parseJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    return null
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

  if (!res.ok) return null
  return await res.json() as T
}

async function fetchMarkdown(url: string) {
  const json = await firecrawlRequest<{ data?: { markdown?: string } }>('/scrape', {
    url,
    formats: ['markdown'],
  })

  return (json?.data?.markdown as string | undefined) ?? ''
}

async function mapSiteLinks(url: string) {
  const json = await firecrawlRequest<FirecrawlMapResponse>('/map', {
    url,
    search: 'blog news column article interview case note topics お知らせ ブログ コラム 事例',
    limit: 120,
    includeSubdomains: true,
  })

  return Array.isArray(json?.links) ? json.links : []
}

function isLikelyBlogUrl(candidateUrl: string) {
  try {
    const parsed = new URL(candidateUrl)
    const decodedPath = decodeSafe(parsed.pathname).toLowerCase()

    if (!decodedPath || decodedPath === '/') return false
    if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|xml|json)$/i.test(decodedPath)) return false
    if (BLOG_EXCLUDED_KEYWORDS.some((keyword) => decodedPath.includes(keyword))) return false

    const keywordScore = BLOG_PATH_KEYWORDS.some((keyword) => decodedPath.includes(keyword))
    const dateScore = /\/20\d{2}[/-]\d{1,2}/.test(decodedPath) || /\/\d{4}\/\d{2}\//.test(decodedPath)
    const depthScore = decodedPath.split('/').filter(Boolean).length >= 2

    return keywordScore || (dateScore && depthScore)
  } catch {
    return false
  }
}

function scoreBlogUrl(candidateUrl: string) {
  try {
    const parsed = new URL(candidateUrl)
    const decodedPath = decodeSafe(parsed.pathname).toLowerCase()
    let score = 0

    if (BLOG_PATH_KEYWORDS.some((keyword) => decodedPath.includes(keyword))) score += 4
    if (/\/20\d{2}[/-]\d{1,2}/.test(decodedPath) || /\/\d{4}\/\d{2}\//.test(decodedPath)) score += 3
    score += Math.min(decodedPath.split('/').filter(Boolean).length, 4)

    return score
  } catch {
    return 0
  }
}

function pickLikelyBlogUrls(siteUrl: string, links: string[], limit = DEFAULT_DISCOVERED_BLOG_POST_LIMIT) {
  const normalizedSiteUrl = normalizeBlogUrl(siteUrl)
  if (!normalizedSiteUrl) return []

  let siteHost = ''
  try {
    siteHost = new URL(normalizedSiteUrl).host
  } catch {
    return []
  }

  const uniqueLinks = [...new Set(links.map(normalizeBlogUrl).filter(Boolean))]

  return uniqueLinks
    .filter((link) => {
      try {
        const parsed = new URL(link)
        return parsed.host === siteHost || parsed.host.endsWith(`.${siteHost}`)
      } catch {
        return false
      }
    })
    .filter(isLikelyBlogUrl)
    .sort((left, right) => scoreBlogUrl(right) - scoreBlogUrl(left))
    .slice(0, limit)
}

async function summarizeBlogPostPages(pages: Array<{ url: string; markdown: string }>) {
  if (pages.length === 0) return [] as StoredSiteBlogPost[]

  const prompt = `以下は同一サイト内の過去ブログ記事候補です。各ページの内容を読んで、日本語で使いやすい一覧に整理してください。

## ルール
- URLごとに1件ずつ返す
- title はページ内容に沿った自然な記事タイトルを短く
- summary は「何が書かれているか」が一目で分かる1文
- 実体のないURLは返さない
- JSONのみ返す

## ページ一覧
${pages.map((page, index) => `### candidate_${index + 1}
url: ${page.url}
content:
${page.markdown.slice(0, 3500)}`).join('\n\n')}

## 出力形式
{
  "posts": [
    {
      "url": "https://example.com/blog/post",
      "title": "記事タイトル",
      "summary": "この記事で何を伝えているかの要約"
    }
  ]
}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
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
    normalizedPosts.push({ url, title, summary })
  }

  return normalizedPosts
}

export async function discoverSiteBlogPosts(siteUrl: string, limit = DEFAULT_DISCOVERED_BLOG_POST_LIMIT) {
  const candidateUrls = pickLikelyBlogUrls(siteUrl, await mapSiteLinks(siteUrl), limit)
  if (candidateUrls.length === 0) return [] as StoredSiteBlogPost[]

  const pages = await Promise.all(candidateUrls.map(async (url) => ({
    url,
    markdown: await fetchMarkdown(url),
  })))

  return await summarizeBlogPostPages(
    pages.filter((page) => page.markdown.trim().length > 0).slice(0, limit),
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
    posts.push({ url, title, summary })
  }

  return posts
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
