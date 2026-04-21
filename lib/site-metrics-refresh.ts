import { buildClassificationSummary, type ClassifiedPost } from '@/lib/content-map'
import {
  buildBlogFreshnessMetrics,
  discoverSiteBlogPosts,
  getStoredBlogMetrics,
  getStoredSiteBlogPosts,
} from '@/lib/site-blog-support'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

type RefreshSiteMetricsInput = {
  siteUrl: string
  rawData: Record<string, unknown> | null | undefined
  blogPostLimit?: number
}

export async function buildRefreshedSiteMetrics(input: RefreshSiteMetricsInput) {
  const { siteUrl, rawData, blogPostLimit = 8 } = input
  const existingRawData = isRecord(rawData) ? rawData : {}
  const existingPosts = getStoredSiteBlogPosts(existingRawData)
  const discoveredPosts = await discoverSiteBlogPosts(siteUrl, blogPostLimit)
  const nextPosts = discoveredPosts.length > 0 ? discoveredPosts : existingPosts
  const nextBlogMetrics = buildBlogFreshnessMetrics(nextPosts)
  const existingClassifications = Array.isArray(existingRawData.blog_classifications)
    ? existingRawData.blog_classifications as ClassifiedPost[]
    : []
  const matchedUrls = new Set(nextPosts.map((post) => post.url))
  const retainedClassifications = existingClassifications.filter((entry) => (
    entry && typeof entry.url === 'string' && matchedUrls.has(entry.url)
  ))
  const classificationSummary = retainedClassifications.length > 0
    ? buildClassificationSummary(retainedClassifications)
    : null

  return {
    rawData: {
      ...existingRawData,
      blog_posts: nextPosts,
      blog_metrics: nextBlogMetrics,
      lightweight_metrics_updated_at: new Date().toISOString(),
      blog_classification_summary: classificationSummary,
    },
    blogMetrics: nextBlogMetrics,
    blogPosts: nextPosts,
    previousBlogMetrics: getStoredBlogMetrics(existingRawData),
  }
}
