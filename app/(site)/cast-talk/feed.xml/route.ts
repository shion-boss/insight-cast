// Cast Talk Atom 1.0 feed
//
// 動作と意図は app/(site)/blog/feed.xml/route.ts と同じ。
// cast_talks テーブルから published のものを新しい順で配信する。

import { createAdminClient } from '@/lib/supabase/admin'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')
const FEED_URL = `${APP_URL}/cast-talk/feed.xml`
const INDEX_URL = `${APP_URL}/cast-talk`

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

export const revalidate = 600

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('cast_talks')
    .select('slug, title, summary, published_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const talks = (data ?? []) as Array<{
    slug: string
    title: string | null
    summary: string | null
    published_at: string | null
    updated_at: string | null
  }>

  const latest = talks[0]
  const feedUpdated = toIsoUtc(latest?.updated_at ?? latest?.published_at)

  const entries = talks.map((talk) => {
    const url = `${APP_URL}/cast-talk/${talk.slug}`
    const title = talk.title ?? 'Cast Talk'
    const summary = talk.summary ?? ''
    return `  <entry>
    <id>${xmlEscape(url)}</id>
    <title>${xmlEscape(title)}</title>
    <link rel="alternate" type="text/html" href="${xmlEscape(url)}"/>
    <updated>${toIsoUtc(talk.updated_at ?? talk.published_at)}</updated>
    <published>${toIsoUtc(talk.published_at)}</published>
    <summary type="text">${xmlEscape(summary)}</summary>
    <author><name>Insight Cast</name></author>
  </entry>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ja">
  <id>${xmlEscape(FEED_URL)}</id>
  <title>Insight Cast — Cast Talk</title>
  <subtitle>Insight Cast の AI キャストたちが語り合う対話形式の読み物。</subtitle>
  <link rel="self" type="application/atom+xml" href="${xmlEscape(FEED_URL)}"/>
  <link rel="alternate" type="text/html" href="${xmlEscape(INDEX_URL)}"/>
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
