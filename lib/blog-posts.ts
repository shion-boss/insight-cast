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

export const POSTS: Post[] = [
  {
    slug: 'why-interview-before-ai-writing',
    title: 'ホームページを更新し続けるために必要な「取材思考」とは',
    excerpt:
      '更新が止まる本当の理由は、コンテンツのアイデアがないのではなく、日常の中にある価値を見落としているからです。',
    category: 'howto',
    type: 'normal',
    date: '2026-04-18',
    coverColor: 'bg-[#fdf0e4]',
    icon: '📝',
    featured: true,
  },
  {
    slug: 'how-cast-works',
    title: 'AIキャスト「クラウス」が専門業種の強みを引き出す仕組み',
    excerpt:
      '業種知識を背景に持つクラウスは、なぜその材料・工法・判断を選んでいるかを深掘りすることで、競合との違いを言語化します。',
    category: 'service',
    type: 'interview',
    date: '2026-03-28',
    coverColor: 'bg-[#e0f5f3]',
    icon: '🦉',
  },
  {
    slug: 'case-painting-company',
    title: '工務店が3ヶ月でコンテンツを5本作った話',
    excerpt:
      '「何を書けばいいか分からなかった」という田中建設の代表が、Insight Castを使い始めて変わったこと。',
    category: 'case',
    type: 'interview',
    date: '2026-03-15',
    coverColor: 'bg-[#f5ede0]',
    icon: '🏠',
  },
  {
    slug: 'why-ordinary-is-value',
    title: '一次情報こそが、小規模事業者の唯一の差別化である',
    excerpt:
      '大手に真似しにくいものがあります。それは「あなたが体験した、あの出来事」です。価値の中心は、AIが整えた文章そのものではなく、取材で引き出した事実にあります。',
    category: 'philosophy',
    type: 'normal',
    date: '2026-03-05',
    coverColor: 'bg-[#f0ede8]',
    icon: '💡',
  },
  {
    slug: 'cast-guide',
    title: 'キャストの選び方ガイド：ミント・クラウス・レインの違いと使い分け',
    excerpt:
      '3名のキャストはそれぞれ異なる角度で取材します。目的に合わせた選び方を解説します。',
    category: 'howto',
    type: 'normal',
    date: '2026-02-20',
    coverColor: 'bg-[#e8f0e8]',
    icon: '🎭',
  },
  {
    slug: 'report-guide',
    title: 'HP分析レポートの読み方と、次の取材テーマの決め方',
    excerpt:
      'Insight Castが出力する調査レポートをどう活かすか。取材テーマの選び方と優先順位のつけ方を解説します。',
    category: 'service',
    type: 'normal',
    date: '2026-02-08',
    coverColor: 'bg-[#fdf0e4]',
    icon: '📊',
  },
  {
    slug: 'dogfooding-6-interviews-discovery',
    title: '自社で取材を6回やってみたら、予想外の話が次々と出てきた',
    excerpt:
      '「何を書けばいいか分からない」は材料不足ではなく、引き出す設計の不足でした。Insight Castを自分たちで使って気づいたことを正直に書きます。',
    category: 'case',
    type: 'normal',
    date: '2026-04-28',
    coverColor: 'bg-[#f0ede8]',
    icon: '🎙️',
    featured: false,
  },
  {
    slug: 'why-hp-update-stops-not-time-but-ideas',
    title: 'HPが更新できないのは、時間がないからじゃなかった',
    excerpt:
      '「忙しいから更新できない」と思っていませんか。実は多くの事業者さんが、時間を作っても手が止まる状態になっています。その根本原因は、意欲でも時間でもありませんでした。',
    category: 'philosophy',
    type: 'normal',
    date: '2026-04-28',
    coverColor: 'bg-[#eef2ed]',
    icon: '🖊️',
    featured: false,
  },
  {
    slug: 'ai-writing-vs-interview-article',
    title: 'AIに記事を書いてもらった場合と、取材で引き出した記事の、具体的な違い',
    excerpt:
      '「ChatGPTに書いてもらえばいいのでは？」という疑問に正直に答えます。同じテーマでAI生成した文章と取材起点の文章を並べてみると、見た目よりも大きな差がありました。',
    category: 'philosophy',
    type: 'normal',
    date: '2026-04-29',
    coverColor: 'bg-[#ede8f0]',
    icon: '🗒️',
    featured: false,
  },
]

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug)
}

export function getRelatedPostsFromList(posts: Post[], post: Post, limit = 3): Post[] {
  return posts
    .filter((candidate) => candidate.slug !== post.slug && candidate.category === post.category)
    .slice(0, limit)
}
