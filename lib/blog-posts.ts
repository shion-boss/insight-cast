export type PostCategory = 'howto' | 'service' | 'interview' | 'case' | 'philosophy' | 'news'
export type PostType = 'normal' | 'interview'
export type InterviewerId = 'mint' | 'claus' | 'rain'

export type Post = {
  slug: string
  title: string
  excerpt: string
  category: PostCategory
  type: PostType
  date: string
  interviewer?: InterviewerId
  coverColor: string
  icon?: string
  featured?: boolean
  interviewDurationMin?: number | null
  interviewQuestionCount?: number | null
}

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  howto: 'ノウハウ',
  service: 'サービス',
  interview: 'インタビュー',
  case: '事例',
  philosophy: '思想',
  news: 'お知らせ',
}

export const CATEGORY_COLOR_MAP: Record<PostCategory, string> = {
  howto:      '#c2722a',
  service:    '#0f766e',
  interview:  '#7c3aed',
  case:       '#1d4ed8',
  philosophy: '#065f46',
  news:       '#be185d',
}

export const CATEGORY_CHARACTER_MAP: Record<PostCategory, string> = {
  howto:      'mint',
  service:    'claus',
  interview:  'rain',
  case:       'rain',
  philosophy: 'claus',
  news:       'mint',
}

const LEGACY_CATEGORY_MAP = {
  'insight-cast': 'service',
} as const

export function normalizePostCategory(value: unknown): PostCategory {
  if (
    value === 'howto'
    || value === 'service'
    || value === 'interview'
    || value === 'case'
    || value === 'philosophy'
    || value === 'news'
  ) {
    return value
  }

  if (typeof value === 'string' && value in LEGACY_CATEGORY_MAP) {
    return LEGACY_CATEGORY_MAP[value as keyof typeof LEGACY_CATEGORY_MAP]
  }

  return 'howto'
}

export function getRelatedPostsFromList(posts: Post[], post: Post, limit = 3): Post[] {
  return posts
    .filter((candidate) => candidate.slug !== post.slug && candidate.category === post.category)
    .slice(0, limit)
}
