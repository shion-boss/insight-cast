/**
 * ブログ記事URL発見ロジックのテストスクリプト
 * Firecrawl /scrape（クレジット消費）は実行しない。URL発見と絞り込みのみ検証する。
 *
 * 実行: npx tsx scripts/test-blog-discovery.ts
 */

import * as path from 'path'
import * as fs from 'fs'

// .env.local を手動で読み込む
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

const FIRECRAWL_API_BASE = 'https://api.firecrawl.dev/v1'

const BLOG_PATH_KEYWORDS = [
  'blog', 'blogs', 'news', 'column', 'columns', 'article', 'articles',
  'post', 'posts', 'media', 'journal', 'note', 'notes', 'case', 'cases',
  'interview', 'interviews', 'topics', 'voice', 'voices',
  'insight', 'insights', 'archive', 'archives',
  'お知らせ', 'ブログ', 'コラム', '記事', '事例', '実績', '導入事例',
]

const BLOG_EXCLUDED_KEYWORDS = [
  'contact', 'contacts', 'privacy', 'policy', 'terms', 'about', 'company',
  'service', 'services', 'lp', 'faq', 'recruit', 'careers', 'cart', 'shop',
  'login', 'signup', 'sign-up',
]

function decodeSafe(value: string) {
  try { return decodeURIComponent(value) } catch { return value }
}

function normalizeBlogUrl(value: string) {
  try { return new URL(value).toString() } catch { return '' }
}

function stripWww(host: string) {
  return host.startsWith('www.') ? host.slice(4) : host
}

function isNotMediaOrSystemUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|xml|json|css|js|woff|woff2|ttf|eot)$/i.test(path)) return false
    const segments = path.split('/').filter(Boolean)
    if (segments.some((seg) => BLOG_EXCLUDED_KEYWORDS.includes(seg))) return false
    return true
  } catch { return false }
}

function scoreBlogUrl(candidateUrl: string): number {
  try {
    const parsed = new URL(candidateUrl)
    const decodedPath = decodeSafe(parsed.pathname).toLowerCase()
    const segments = decodedPath.split('/').filter(Boolean)
    let score = 0
    if (BLOG_PATH_KEYWORDS.some((kw) => decodedPath.includes(kw))) score += 4
    if (/\/20\d{2}[/-]\d{1,2}/.test(decodedPath) || /\/\d{4}\/\d{2}\//.test(decodedPath)) score += 3
    score += Math.min(segments.length, 4)
    if (parsed.search) score += 2
    if (segments.length === 1 && BLOG_PATH_KEYWORDS.some((kw) => segments[0] === kw)) score -= 3
    return score
  } catch { return 0 }
}

function filterToSameHost(siteUrl: string, links: string[]) {
  let siteHost = ''
  try { siteHost = stripWww(new URL(siteUrl).host) } catch { return [] }
  return [...new Set(links.map(normalizeBlogUrl).filter(Boolean))].filter((link) => {
    try {
      const linkHost = stripWww(new URL(link).host)
      return linkHost === siteHost || linkHost.endsWith(`.${siteHost}`)
    } catch { return false }
  })
}

// sitemap.xml からエントリ取得（fetchSitemapEntries の簡易版）
async function fetchSitemapUrls(siteUrl: string): Promise<string[]> {
  let origin: string
  try { origin = new URL(siteUrl).origin } catch { return [] }

  const candidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
  ]

  for (const sitemapUrl of candidates) {
    try {
      const res = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'InsightCast/1.0' },
      })
      if (!res.ok) { console.info(`  sitemap ${sitemapUrl} → ${res.status}`); continue }
      const xml = await res.text()
      const locPattern = /<loc[^>]*>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi
      const urls: string[] = []
      let m
      while ((m = locPattern.exec(xml)) !== null) urls.push(m[1].trim())
      if (urls.length > 0) {
        console.info(`  sitemap ${sitemapUrl} → ${res.status}, ${urls.length} URLs`)
        return urls
      }
    } catch (e) {
      console.info(`  sitemap ${sitemapUrl} → error: ${e}`)
    }
  }
  return []
}

// Firecrawl /map でサイト全URLを取得
async function mapSiteLinks(url: string): Promise<string[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) { console.error('FIRECRAWL_API_KEY not set'); return [] }

  const res = await fetch(`${FIRECRAWL_API_BASE}/map`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, limit: 200, includeSubdomains: false }),
  })
  if (!res.ok) { console.error('[map] failed', res.status); return [] }
  const json = await res.json() as { links?: string[] }
  return Array.isArray(json.links) ? json.links : []
}

function printUrlList(label: string, urls: string[], max = 20) {
  console.info(`\n--- ${label} (${urls.length}件) ---`)
  urls.slice(0, max).forEach((url) => {
    const score = scoreBlogUrl(url)
    console.info(`  [${score}] ${url}`)
  })
  if (urls.length > max) console.info(`  ... and ${urls.length - max} more`)
}

async function testSite(siteUrl: string, limit = 30) {
  console.info(`\n${'='.repeat(60)}`)
  console.info(`テスト対象: ${siteUrl}`)
  console.info('='.repeat(60))

  // 1. sitemap
  console.info('\n[1] sitemap.xml')
  let candidates = await fetchSitemapUrls(siteUrl)

  // 2. Firecrawl /map
  if (candidates.length === 0) {
    console.info('\n[2] Firecrawl /map')
    candidates = await mapSiteLinks(siteUrl)
    console.info(`  /map → ${candidates.length} URLs`)
  } else {
    console.info(`  → ${candidates.length} URLs (Firecrawl /mapはスキップ)`)
  }

  if (candidates.length === 0) {
    console.info('  → 0件。発見できず。')
    return
  }

  const sameHost = filterToSameHost(siteUrl, candidates)
  const filtered = sameHost.filter(isNotMediaOrSystemUrl)
  const scored = filtered.sort((a, b) => scoreBlogUrl(b) - scoreBlogUrl(a))
  const blogLike = scored.filter((url) => scoreBlogUrl(url) >= 2)
  const toFetch = (blogLike.length > 0 ? blogLike : scored).slice(0, limit)

  console.info(`\n[フィルタ結果]`)
  console.info(`  同一ホスト: ${sameHost.length}件`)
  console.info(`  isNotMedia通過: ${filtered.length}件`)
  console.info(`  スコア2以上: ${blogLike.length}件`)
  console.info(`  スクレイプ対象(limit=${limit}): ${toFetch.length}件`)

  printUrlList('スクレイプ予定URL (score降順)', toFetch, 30)

  const lowScore = scored.filter((url) => scoreBlogUrl(url) < 2)
  if (lowScore.length > 0) {
    printUrlList('スコア2未満で除外されたURL', lowScore, 10)
  }
}

async function main() {
  // 自社HP
  await testSite('https://www.ohtsuki-tosou.co.jp/', 30)
  // 競合HP
  await testSite('https://e-housepaint.com/', 10)
}

main().catch(console.error)
