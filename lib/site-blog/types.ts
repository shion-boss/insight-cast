export type StoredSiteBlogPost = {
  url: string
  title: string
  summary: string
  published_at?: string | null
}

export type BlogMonthlyCount = {
  month: string
  count: number
}

export type StoredBlogMetrics = {
  trackedPostCount: number
  datedPostCount: number
  latestPublishedAt: string | null
  oldestPublishedAt: string | null
  daysSinceLatestPost: number | null
  postsLast30Days: number
  postsLast90Days: number
  averagePostsPerMonth: number | null
  freshnessStatus: 'fresh' | 'watch' | 'stale' | 'unknown'
  recentMonthlyCounts: BlogMonthlyCount[]
}

export type CandidateBlogPost = {
  id: string
  url: string
  title: string
  summary: string
}

export type FirecrawlMapResponse = {
  links?: string[]
}
