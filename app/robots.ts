import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp'
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
          '/onboarding',
          '/auth',
          '/api',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
