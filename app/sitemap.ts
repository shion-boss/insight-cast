import type { MetadataRoute } from 'next'
import { getBlogPostsFromDB } from '@/lib/blog-posts.server'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cast-talk`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/cast`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/philosophy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/tokushoho`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  let blogRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = await getBlogPostsFromDB()
    blogRoutes = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
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
      .select('slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    castTalkRoutes = (data ?? []).map((talk) => ({
      url: `${BASE_URL}/cast-talk/${talk.slug}`,
      lastModified: talk.published_at ? new Date(talk.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }))
  } catch {
    // DB unavailable at build time — skip
  }

  return [...staticRoutes, ...blogRoutes, ...castTalkRoutes]
}
