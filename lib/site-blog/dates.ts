import { decodeSafe } from './normalizers'
import type { StoredBlogMetrics, StoredSiteBlogPost } from './types'

export function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function parseYearMonthDate(year: string, month: string, day = '01') {
  const normalized = new Date(`${year}-${month}-${day}T00:00:00+09:00`)
  return Number.isNaN(normalized.getTime()) ? null : normalized
}

export function extractPublishedDateFromUrl(url: string) {
  const decoded = decodeSafe(url)
  const patterns = [
    decoded.match(/[/_-](20\d{2})[/_.-](0[1-9]|1[0-2])[/_.-](0[1-9]|[12]\d|3[01])(?:[/_.-]|$)/),
    decoded.match(/[/_-](20\d{2})[/_.-](0[1-9]|1[0-2])(?:[/_.-]|$)/),
    decoded.match(/(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/),
  ]

  for (const match of patterns) {
    if (!match) continue
    const date = parseYearMonthDate(match[1], match[2], match[3] ?? '01')
    if (date) return date
  }

  return null
}

export function extractPublishedDateFromTitle(title: string) {
  const patterns = [
    title.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日/),
    title.match(/(20\d{2})[/.年-](\d{1,2})[/.月-](\d{1,2})/),
    title.match(/(20\d{2})年(\d{1,2})月/),
  ]

  for (const match of patterns) {
    if (!match) continue
    const date = parseYearMonthDate(
      match[1],
      match[2].padStart(2, '0'),
      match[3]?.padStart(2, '0') ?? '01',
    )
    if (date) return date
  }

  return null
}

function sortDatesAsc(dates: Date[]) {
  return [...dates].sort((left, right) => left.getTime() - right.getTime())
}

function toIsoStringOrNull(date: Date | null) {
  return date ? date.toISOString() : null
}

export function extractStoredBlogPublishedAt(post: StoredSiteBlogPost) {
  if (post.published_at) {
    const d = new Date(post.published_at)
    if (!Number.isNaN(d.getTime())) return d
  }
  return extractPublishedDateFromUrl(post.url) ?? extractPublishedDateFromTitle(post.title)
}

export function buildBlogFreshnessMetrics(
  posts: StoredSiteBlogPost[],
  now = new Date(),
): StoredBlogMetrics {
  const publishedDates = sortDatesAsc(
    posts
      .map((post) => extractStoredBlogPublishedAt(post))
      .filter((value): value is Date => value instanceof Date),
  )

  const latest = publishedDates[publishedDates.length - 1] ?? null
  const oldest = publishedDates[0] ?? null
  const dayMs = 24 * 60 * 60 * 1000
  const daysSinceLatestPost = latest
    ? Math.max(0, Math.floor((now.getTime() - latest.getTime()) / dayMs))
    : null
  const last30 = new Date(now)
  last30.setDate(last30.getDate() - 30)
  const last90 = new Date(now)
  last90.setDate(last90.getDate() - 90)
  const postsLast30Days = publishedDates.filter((date) => date >= last30).length
  const postsLast90Days = publishedDates.filter((date) => date >= last90).length

  let averagePostsPerMonth: number | null = null
  if (oldest && latest) {
    const monthSpan = Math.max(
      1,
      (latest.getFullYear() - oldest.getFullYear()) * 12 + latest.getMonth() - oldest.getMonth() + 1,
    )
    averagePostsPerMonth = Number((publishedDates.length / monthSpan).toFixed(1))
  }

  const monthlyMap = new Map<string, number>()
  for (const date of publishedDates) {
    const key = toMonthKey(date)
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1)
  }

  const recentMonthlyCounts = [...monthlyMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([month, count]) => ({ month, count }))

  const freshnessStatus = (() => {
    if (!latest) return 'unknown' as const
    if (daysSinceLatestPost !== null && daysSinceLatestPost <= 45) return 'fresh' as const
    if (daysSinceLatestPost !== null && daysSinceLatestPost <= 120) return 'watch' as const
    return 'stale' as const
  })()

  return {
    trackedPostCount: posts.length,
    datedPostCount: publishedDates.length,
    latestPublishedAt: toIsoStringOrNull(latest),
    oldestPublishedAt: toIsoStringOrNull(oldest),
    daysSinceLatestPost,
    postsLast30Days,
    postsLast90Days,
    averagePostsPerMonth,
    freshnessStatus,
    recentMonthlyCounts,
  }
}
