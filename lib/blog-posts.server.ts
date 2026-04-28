import 'server-only'

import { unstable_cache } from 'next/cache'
import type { ArticleBody } from '@/lib/blog-contents'
import { type InterviewerId, type Post, type PostType, normalizePostCategory } from '@/lib/blog-posts'
import { createAdminClient } from '@/lib/supabase/admin'

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
    interviewDurationMin: typeof row.interview_duration_min === 'number' ? row.interview_duration_min : null,
    interviewQuestionCount: typeof row.interview_question_count === 'number' ? row.interview_question_count : null,
  }
}

export const getBlogPostsFromDB = unstable_cache(
  async (): Promise<Post[]> => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, category, type, interviewer, cover_color, date, interview_duration_min, interview_question_count')
        .eq('published', true)
        .order('date', { ascending: false })

      if (error || !data) return []
      return data.map((row) => rowToPost(row as Record<string, unknown>))
    } catch {
      return []
    }
  },
  ['blog-posts-list-v2'],
  { revalidate: 300 },
)

export const getBlogPostFromDB = unstable_cache(
  async (slug: string): Promise<PostWithBody | null> => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, category, type, interviewer, cover_color, date, body, interview_duration_min, interview_question_count')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle()

      if (error || !data) return null
      return {
        ...rowToPost(data as Record<string, unknown>),
        body: (data.body as ArticleBody | null) ?? null,
      }
    } catch {
      return null
    }
  },
  ['blog-post-v2'],
  { revalidate: 300 },
)
