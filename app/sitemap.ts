import type { MetadataRoute } from 'next'
import { POSTS } from '@/lib/blog-posts'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast-nu.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cast-talk`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/service`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/cast`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/philosophy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

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
    // DB unavailable at build time — skip dynamic routes
  }

  return [...staticRoutes, ...blogRoutes, ...castTalkRoutes]
}
