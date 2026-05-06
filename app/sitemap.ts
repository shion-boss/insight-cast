import type { MetadataRoute } from 'next'
import { getBlogPostsFromDB } from '@/lib/blog-posts.server'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

// 静的ページの最終改訂日（手動メンテ）。
// `new Date()` を使うと Googlebot に「全ページが更新された」と毎回シグナルが
// 飛び、クロール予算が分散して新規/更新記事の発見が遅れる。
// 静的ページは実際の改訂時に明示更新する運用に倒す（半年〜1年単位）。
const STATIC_LASTMOD: Record<string, string> = {
  '/':            '2026-05-06',
  '/blog':        '2026-05-06',
  '/cast-talk':   '2026-05-06',
  '/cast':        '2026-05-04',
  '/pricing':     '2026-04-28',
  '/faq':         '2026-05-05',
  '/about':       '2026-04-22',
  '/philosophy':  '2026-04-22',
  '/contact':     '2026-04-17',
  '/privacy':     '2026-04-17',
  '/terms':       '2026-04-17',
  '/tokushoho':   '2026-05-05',
}

function lastmod(path: string): Date {
  const iso = STATIC_LASTMOD[path]
  return iso ? new Date(iso) : new Date()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                   lastModified: lastmod('/'),           changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE_URL}/blog`,         lastModified: lastmod('/blog'),       changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/cast-talk`,    lastModified: lastmod('/cast-talk'),  changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/cast`,         lastModified: lastmod('/cast'),       changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE_URL}/pricing`,      lastModified: lastmod('/pricing'),    changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE_URL}/faq`,          lastModified: lastmod('/faq'),        changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`,        lastModified: lastmod('/about'),      changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/philosophy`,   lastModified: lastmod('/philosophy'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`,      lastModified: lastmod('/contact'),    changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy`,      lastModified: lastmod('/privacy'),    changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,        lastModified: lastmod('/terms'),      changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/tokushoho`,    lastModified: lastmod('/tokushoho'),  changeFrequency: 'yearly',  priority: 0.3 },
  ]

  let blogRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = await getBlogPostsFromDB()
    blogRoutes = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt ?? post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB unavailable at build time — skip
  }

  let castTalkRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('cast_talks')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    castTalkRoutes = (data ?? []).map((talk) => ({
      url: `${BASE_URL}/cast-talk/${talk.slug}`,
      lastModified: new Date(talk.updated_at ?? talk.published_at ?? Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }))
  } catch {
    // DB unavailable at build time — skip
  }

  return [...staticRoutes, ...blogRoutes, ...castTalkRoutes]
}
