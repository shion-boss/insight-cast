import { isRecord } from '@/lib/utils'

import { normalizeBlogSummary, normalizeBlogTitle, normalizeBlogUrl } from './normalizers'
import type { StoredBlogMetrics, StoredSiteBlogPost } from './types'

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
    const published_at = typeof item.published_at === 'string' ? item.published_at : null
    posts.push({ url, title, summary, published_at })
  }

  return posts
}

export function getStoredBlogMetrics(rawData: Record<string, unknown> | null | undefined) {
  if (!isRecord(rawData) || !isRecord(rawData.blog_metrics)) return null

  const rawMetrics = rawData.blog_metrics
  const recentMonthlyCounts = Array.isArray(rawMetrics.recentMonthlyCounts)
    ? rawMetrics.recentMonthlyCounts.flatMap((entry) => {
        if (!isRecord(entry) || typeof entry.month !== 'string' || typeof entry.count !== 'number') return []
        return [{ month: entry.month, count: entry.count }]
      })
    : []

  const freshnessStatus = rawMetrics.freshnessStatus
  if (
    typeof rawMetrics.trackedPostCount !== 'number'
    || typeof rawMetrics.datedPostCount !== 'number'
    || typeof rawMetrics.postsLast30Days !== 'number'
    || typeof rawMetrics.postsLast90Days !== 'number'
    || (rawMetrics.averagePostsPerMonth !== null && typeof rawMetrics.averagePostsPerMonth !== 'number')
    || !['fresh', 'watch', 'stale', 'unknown'].includes(typeof freshnessStatus === 'string' ? freshnessStatus : '')
  ) {
    return null
  }

  const normalizedFreshnessStatus = freshnessStatus as StoredBlogMetrics['freshnessStatus']

  return {
    trackedPostCount: rawMetrics.trackedPostCount,
    datedPostCount: rawMetrics.datedPostCount,
    latestPublishedAt: typeof rawMetrics.latestPublishedAt === 'string' ? rawMetrics.latestPublishedAt : null,
    oldestPublishedAt: typeof rawMetrics.oldestPublishedAt === 'string' ? rawMetrics.oldestPublishedAt : null,
    daysSinceLatestPost: typeof rawMetrics.daysSinceLatestPost === 'number' ? rawMetrics.daysSinceLatestPost : null,
    postsLast30Days: rawMetrics.postsLast30Days,
    postsLast90Days: rawMetrics.postsLast90Days,
    averagePostsPerMonth: typeof rawMetrics.averagePostsPerMonth === 'number' ? rawMetrics.averagePostsPerMonth : null,
    freshnessStatus: normalizedFreshnessStatus,
    recentMonthlyCounts,
  } satisfies StoredBlogMetrics
}
