// Blog Atom 1.0 feed
//
// Feedly / Inoreader / Google News / 各種 LLM 検索ボットに記事更新を通知する
// ための feed エンドポイント。Atom 1.0 を採用（RSS 2.0 より仕様が厳密で
// modern aggregator が好む）。
//
// /blog/feed.xml で配信。<link rel="alternate" type="application/atom+xml">
// は app/layout.tsx の <head> で発見可能化する。

import { getBlogPostsFromDB } from '@/lib/blog-posts.server'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')
const FEED_URL = `${APP_URL}/blog/feed.xml`
const BLOG_URL = `${APP_URL}/blog`

// Atom XML 内に流す文字列の安全エスケープ
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toIsoUtc(value: string | null | undefined): string {
  if (!value) return new Date().toISOString()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export const revalidate = 600 // 10 分ごとに再生成

export async function GET() {
  const posts = await getBlogPostsFromDB().catch(() => [])
  // 新しい記事が前提
  const sorted = [...posts].sort((a, b) => (b.date.localeCompare(a.date)))
  const latest = sorted[0]
  const feedUpdated = toIsoUtc(latest?.updatedAt ?? latest?.date)

  const entries = sorted.map((post) => {
    const url = `${APP_URL}/blog/${post.slug}`
    return `  <entry>
    <id>${xmlEscape(url)}</id>
    <title>${xmlEscape(post.title)}</title>
    <link rel="alternate" type="text/html" href="${xmlEscape(url)}"/>
    <updated>${toIsoUtc(post.updatedAt ?? post.date)}</updated>
    <published>${toIsoUtc(post.date)}</published>
    <summary type="text">${xmlEscape(post.excerpt)}</summary>
    <author><name>Insight Cast</name></author>
    <category term="${xmlEscape(post.category)}"/>
  </entry>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ja">
  <id>${xmlEscape(FEED_URL)}</id>
  <title>Insight Cast ブログ</title>
  <subtitle>Insight Cast の考え方や、発信にまつわる話を長文の記事で読む。</subtitle>
  <link rel="self" type="application/atom+xml" href="${xmlEscape(FEED_URL)}"/>
  <link rel="alternate" type="text/html" href="${xmlEscape(BLOG_URL)}"/>
  <updated>${feedUpdated}</updated>
  <author><name>Insight Cast</name><uri>${xmlEscape(APP_URL)}</uri></author>
  <generator uri="${xmlEscape(APP_URL)}">Insight Cast</generator>
${entries}
</feed>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  })
}
