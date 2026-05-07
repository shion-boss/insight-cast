export type PostCategory = 'ai-search' | 'primary-info' | 'casts' | 'hp-update' | 'meta'
export type PostType = 'normal' | 'interview'
export type InterviewerId = 'mint' | 'claus' | 'rain' | 'hal' | 'mogro' | 'cocco'

export type Post = {
  slug: string
  title: string
  excerpt: string
  category: PostCategory
  type: PostType
  date: string
  updatedAt: string | null
  interviewer?: InterviewerId
  coverColor: string
  icon?: string
  featured?: boolean
  interviewDurationMin?: number | null
  interviewQuestionCount?: number | null
}

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  'ai-search':    'AI検索時代',
  'primary-info': '一次情報',
  'casts':        'AIキャスト',
  'hp-update':    'ホームページ更新',
  'meta':         '運営の舞台裏',
}

// 10px のカテゴリチップで AA を満たす濃さに揃えている。
// ブランドオレンジ `#c2722a` は装飾用途で使い、文字色には濃いバリアント `#8a4a18` を使う。
export const CATEGORY_COLOR_MAP: Record<PostCategory, string> = {
  'ai-search':    '#1d4ed8',
  'primary-info': '#065f46',
  'casts':        '#7c3aed',
  'hp-update':    '#8a4a18',
  'meta':         '#475569',
}

export const CATEGORY_CHARACTER_MAP: Record<PostCategory, string> = {
  'ai-search':    'claus',
  'primary-info': 'rain',
  'casts':        'mint',
  'hp-update':    'mint',
  'meta':         'claus',
}

// 旧カテゴリ → 新カテゴリ（移行期間の安全弁）。
// 2026-05-07 のカテゴリ再設計より前のデータが混入した時のフォールバック。
const LEGACY_CATEGORY_MAP = {
  'insight-cast': 'casts',
  'service':      'casts',
  'howto':        'hp-update',
  'interview':    'meta',
  'case':         'hp-update',
  'philosophy':   'primary-info',
  'news':         'meta',
} as const

const VALID_CATEGORIES: readonly PostCategory[] = ['ai-search', 'primary-info', 'casts', 'hp-update', 'meta']

export function normalizePostCategory(value: unknown): PostCategory {
  if (typeof value === 'string' && (VALID_CATEGORIES as readonly string[]).includes(value)) {
    return value as PostCategory
  }
  if (typeof value === 'string' && value in LEGACY_CATEGORY_MAP) {
    return LEGACY_CATEGORY_MAP[value as keyof typeof LEGACY_CATEGORY_MAP]
  }
  return 'meta'
}

// 関連記事の選定: 同カテゴリ・同インタビュアー・同タイプ・公開日近接で重み付けスコアリング。
// 旧実装は category 完全一致のみで先頭3本を返していたが、カテゴリ再設計後は1カテゴリ
// あたりの本数が偏るため、複合シグナルで類似度を測る。
export function getRelatedPostsFromList(posts: Post[], post: Post, limit = 3): Post[] {
  const others = posts.filter((p) => p.slug !== post.slug)

  const postTime = new Date(post.date).getTime()

  const scored = others.map((p) => {
    let score = 0
    if (p.category === post.category) score += 3
    if (p.interviewer && post.interviewer && p.interviewer === post.interviewer) score += 2
    if (p.type === post.type) score += 1

    const days = Math.abs(new Date(p.date).getTime() - postTime) / (1000 * 60 * 60 * 24)
    if (days <= 30) score += 1
    else if (days <= 180) score += 0.5

    return { post: p, score }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime()
  })

  return scored.slice(0, limit).map((x) => x.post)
}
