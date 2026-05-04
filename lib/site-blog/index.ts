// Public API for @/lib/site-blog.
// 旧 @/lib/site-blog-support の互換レイヤとしても機能する（site-blog-support.ts が re-export）。
//
// 構成:
// - constants.ts        : 数値定数・キーワード配列
// - types.ts            : 型定義
// - normalizers.ts      : 文字列正規化・URI デコード
// - dates.ts            : 日付抽出・新鮮度メトリクス
// - firecrawl-client.ts : Firecrawl・sitemap・RSS・URL スコアリング・ブログ発見の orchestration
// - ai-selector.ts      : Anthropic 経由のページ要約と関連記事選択
// - store.ts            : DB に保存された生データのパース

export { COMPETITOR_BLOG_POST_LIMIT } from './constants'
export type {
  BlogMonthlyCount,
  CandidateBlogPost,
  StoredBlogMetrics,
  StoredSiteBlogPost,
} from './types'
export {
  buildBlogFreshnessMetrics,
  extractStoredBlogPublishedAt,
} from './dates'
export {
  discoverNewBlogPosts,
  discoverSiteBlogPosts,
} from './firecrawl-client'
export { selectRelevantBlogPosts, summarizeBlogPostPages } from './ai-selector'
export { getStoredBlogMetrics, getStoredSiteBlogPosts } from './store'
