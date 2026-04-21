import 'server-only'

import type { ArticleBody } from '@/lib/blog-contents'
import { ARTICLE_BODIES } from '@/lib/blog-contents'
import { type InterviewerId, type Post, POSTS, type PostType, getPost, normalizePostCategory } from '@/lib/blog-posts'
import { createClient } from '@/lib/supabase/server'

export type PostWithBody = Post & { body?: ArticleBody | null }

const FALLBACK_COVER_COLOR = 'bg-stone-100'

function isPostType(value: unknown): value is PostType {
  return value === 'normal' || value === 'interview'
}

function isInterviewerId(value: unknown): value is InterviewerId {
  return value === 'mint' || value === 'claus' || value === 'rain'
}

function rowToPost(row: Record<string, unknown>): Post {
  return {
    slug: String(row.slug ?? ''),
    title: String(row.title ?? ''),
    excerpt: String(row.excerpt ?? ''),
    category: normalizePostCategory(row.category),
    type: isPostType(row.type) ? row.type : 'normal',
    date: String(row.date ?? ''),
    interviewer: isInterviewerId(row.interviewer) ? row.interviewer : undefined,
    coverColor: typeof row.cover_color === 'string' && row.cover_color.length > 0
      ? row.cover_color
      : FALLBACK_COVER_COLOR,
  }
}

function getStaticBlogPost(slug: string): PostWithBody | null {
  const post = getPost(slug)
  if (!post) return null

  return {
    ...post,
    body: ARTICLE_BODIES[slug] ?? null,
  }
}

export async function getBlogPostsFromDB(): Promise<Post[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, category, type, interviewer, cover_color, date')
      .eq('published', true)
      .order('date', { ascending: false })

    if (error || !data || data.length === 0) {
      return POSTS
    }

    return data.map((row) => rowToPost(row as Record<string, unknown>))
  } catch {
    return POSTS
  }
}

export async function getBlogPostFromDB(slug: string): Promise<PostWithBody | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, category, type, interviewer, cover_color, date, body')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()

    if (error || !data) {
      return getStaticBlogPost(slug)
    }

    return {
      ...rowToPost(data as Record<string, unknown>),
      body: (data.body as ArticleBody | null) ?? ARTICLE_BODIES[slug] ?? null,
    }
  } catch {
    return getStaticBlogPost(slug)
  }
}
