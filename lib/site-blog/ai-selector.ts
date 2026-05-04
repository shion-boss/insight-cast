import Anthropic from '@anthropic-ai/sdk'

import { isRecord, parseJsonObject } from '@/lib/utils'
import { SUPPORT_SELECTION_QUERY_LIMIT } from './constants'
import { normalizeBlogSummary, normalizeBlogTitle, normalizeBlogUrl } from './normalizers'
import type { CandidateBlogPost, StoredSiteBlogPost } from './types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function summarizeBlogPostPages(
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
