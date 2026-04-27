import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/projects',
          '/interviews',
          '/articles',
          '/settings',
          '/auth',
          '/api',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
