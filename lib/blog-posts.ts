export type PostCategory = 'insight-cast' | 'interview' | 'case' | 'news'
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
}

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  'insight-cast': 'Insight Castブログ',
  interview: 'インタビュー記事',
  case: '事例',
  news: 'お知らせ',
}

export const POSTS: Post[] = [
  {
    slug: 'why-interview-before-ai-writing',
    title: 'AIブログツールで書けるのに、なぜその前に「取材」が必要なのか',
    excerpt:
      'AIブログツールがあっても、手が止まる事業者さんは少なくありません。理由は「書く力」が足りないからではなく、「何を伝えるべきか」がまだ固まっていないからです。Insight Cast が書く前の取材を重視する理由と、他のAIツールと競合しない役割の違いを整理します。',
    category: 'insight-cast',
    type: 'normal',
    date: '2026-04-18',
    coverColor: 'bg-emerald-100',
  },
  {
    slug: 'why-ordinary-is-value',
    title: '「当たり前」の中にある価値について',
    excerpt:
      '事業者さんが「こんなのどこでもやってますよ」と言う瞬間に、取材班は耳をそばだてます。その言葉の裏に、まだ誰にも伝わっていない本物の強みが眠っていることが多いからです。Insight Castが大切にしている「一次情報」の考え方を、事例を交えながら解説します。',
    category: 'insight-cast',
    type: 'normal',
    date: '2026-04-10',
    coverColor: 'bg-amber-100',
  },
  {
    slug: 'interview-tofu-shop',
    title: '50年続く豆腐屋が、はじめてHPで語った「水へのこだわり」',
    excerpt:
      '創業から半世紀。毎朝4時から仕込みを続ける豆腐屋さんは、自分たちのこだわりをHPに書いたことがありませんでした。ミントが取材に伺い、水の選び方から火加減の判断まで、長年の仕事の積み重ねを丁寧に引き出した記録です。',
    category: 'interview',
    type: 'interview',
    date: '2026-04-08',
    interviewer: 'mint',
    coverColor: 'bg-sky-100',
  },
  {
    slug: 'case-painting-company',
    title: '塗装会社のHPに「職人の判断基準」を加えたら問い合わせが変わった話',
    excerpt:
      '「塗装 〇〇市」で上位に出ていても、問い合わせが来るかどうかは別の話です。クラウスの取材で引き出した「下地処理の判断基準」をHPの説明文に加えたところ、同じアクセス数でも相談内容が具体的になり、商談が進みやすくなったケースを紹介します。',
    category: 'case',
    type: 'normal',
    date: '2026-04-05',
    coverColor: 'bg-stone-200',
  },
  {
    slug: 'how-cast-works',
    title: 'AIキャストはどうやってインタビューするのか',
    excerpt:
      'ミント、クラウス、レインの3人がどのようにインタビューを進めるか、それぞれの個性と引き出し方の違いをご紹介します。「強みを教えてください」とは決して聞かない取材スタイルの裏側を、実際の会話例とともに解説します。',
    category: 'insight-cast',
    type: 'normal',
    date: '2026-04-01',
    coverColor: 'bg-orange-100',
  },
  {
    slug: 'interview-flower-shop',
    title: '花屋さんが話してくれた「選ばれる理由」は、HPのどこにも書いていなかった',
    excerpt:
      '「他の花屋さんと何が違うんですか？」——レインのやわらかい問いに、花屋さんが答えたのは「来てくれる方の顔を思い浮かべて束ねること」でした。競合と比較して整理したら、HPに載せるべき言葉が5つ以上見つかった取材の記録です。',
    category: 'interview',
    type: 'interview',
    date: '2026-03-28',
    interviewer: 'rain',
    coverColor: 'bg-pink-100',
  },
  {
    slug: 'news-hal-coming',
    title: 'ハル（コーギー）が間もなく登場します',
    excerpt:
      '取材班の新メンバー・ハルの準備が進んでいます。ハルが得意とするのは、写真を起点にした「人柄・雰囲気・ストーリー」の引き出し。スタッフ紹介や店舗紹介など、感情と温度感を伝えたい場面で活躍します。登場時期やご利用方法などのお知らせをお届けします。',
    category: 'news',
    type: 'normal',
    date: '2026-03-25',
    coverColor: 'bg-yellow-100',
  },
  {
    slug: 'case-hair-salon',
    title: '美容室の「施術の丁寧さ」をHPで伝えるまでの3ステップ',
    excerpt:
      '「丁寧です」という言葉は、どの美容室も使っています。大切なのは「どんな場面で、どう丁寧なのか」を具体的に伝えること。インタビューから記事化まで3つのステップで整理した方法を、実際の美容室さんの事例をもとに紹介します。',
    category: 'case',
    type: 'normal',
    date: '2026-03-20',
    coverColor: 'bg-purple-100',
  },
  {
    slug: 'interview-carpentry',
    title: '大工さんが「木の乾燥」について話しはじめたら止まらなくなった',
    excerpt:
      'クラウスが取材に伺った大工さんは、最初「特別なことは何もしていない」と言いました。しかし「木を選ぶとき、何を見ますか？」と聞いたところ、乾燥年数・産地・触ったときの感触まで、30分以上話が続きました。HPで伝えるべき価値が、会話の中にどう現れるかを記録した取材記事です。',
    category: 'interview',
    type: 'interview',
    date: '2026-03-15',
    interviewer: 'claus',
    coverColor: 'bg-lime-100',
  },
]

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug)
}

// --- Supabase からの取得関数 ---

import { createClient } from '@/lib/supabase/server'
import type { ArticleBody } from '@/lib/blog-contents'

export type PostWithBody = Post & { body?: ArticleBody | null }

// DB行をPost型にマップ
function rowToPost(row: Record<string, unknown>): Post {
  return {
    slug: row.slug as string,
    title: row.title as string,
    excerpt: row.excerpt as string,
    category: row.category as PostCategory,
    type: row.type as PostType,
    date: row.date as string,
    interviewer: row.interviewer as InterviewerId | undefined,
    coverColor: row.cover_color as string,
  }
}

export async function getBlogPostsFromDB(): Promise<Post[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, category, type, interviewer, cover_color, date')
    .eq('published', true)
    .order('date', { ascending: false })

  if (error || !data) return []
  return data.map(rowToPost)
}

export async function getBlogPostFromDB(slug: string): Promise<PostWithBody | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, category, type, interviewer, cover_color, date, body')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (error || !data) return null
  return {
    ...rowToPost(data as Record<string, unknown>),
    body: data.body as ArticleBody | null,
  }
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  return POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, limit)
}
