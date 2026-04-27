'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getIsAdmin } from '@/lib/actions/auth'

export type PostFormData = {
  slug: string
  title: string
  excerpt: string
  category: 'insight-cast' | 'interview' | 'case' | 'news'
  type: 'normal' | 'interview'
  interviewer?: string | null
  cover_color: string
  date: string
  published: boolean
  body?: string
}

type CreateResult = { id: string } | { error: string }
type MutateResult = { ok: true } | { error: string }

const VALID_CATEGORIES = ['insight-cast', 'interview', 'case', 'news'] as const
const VALID_TYPES = ['normal', 'interview'] as const

function validatePost(data: PostFormData): string | null {
  if (!data.title?.trim()) return 'タイトルは必須です'
  if (!data.slug?.trim()) return 'スラッグは必須です'
  if (!/^[a-z0-9-]+$/.test(data.slug)) return 'スラッグは半角英数字とハイフンのみ使用できます'
  if (!VALID_CATEGORIES.includes(data.category as (typeof VALID_CATEGORIES)[number])) {
    return 'カテゴリが不正です'
  }
  if (!VALID_TYPES.includes(data.type as (typeof VALID_TYPES)[number])) {
    return '記事タイプが不正です'
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return '日付はYYYY-MM-DD形式で入力してください'
  }
  return null
}

export async function createPost(data: PostFormData): Promise<CreateResult> {
  if (!(await getIsAdmin())) return { error: '権限がありません' }

  const validationError = validatePost(data)
  if (validationError) return { error: validationError }

  const supabase = createAdminClient()

  const bodyJson = data.body ? { kind: 'markdown', content: data.body } : null

  const { data: row, error } = await supabase
    .from('blog_posts')
    .insert({
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      category: data.category,
      type: data.type,
      interviewer: data.interviewer ?? null,
      cover_color: data.cover_color,
      date: data.date,
      published: data.published,
      body: bodyJson,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'このスラッグはすでに使用されています' }
    }
    return { error: '保存できませんでした。もう一度お試しください' }
  }

  return { id: row.id as string }
}

export async function updatePost(id: string, data: Partial<PostFormData>): Promise<MutateResult> {
  if (!(await getIsAdmin())) return { error: '権限がありません' }
  if (!id) return { error: 'IDが不正です' }

  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
  if (data.category !== undefined) updateData.category = data.category
  if (data.type !== undefined) updateData.type = data.type
  if (data.interviewer !== undefined) updateData.interviewer = data.interviewer ?? null
  if (data.cover_color !== undefined) updateData.cover_color = data.cover_color
  if (data.date !== undefined) updateData.date = data.date
  if (data.published !== undefined) updateData.published = data.published
  if (data.body !== undefined) {
    updateData.body = data.body ? { kind: 'markdown', content: data.body } : null
  }

  const { error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)

  if (error) return { error: '保存できませんでした。もう一度お試しください' }
  return { ok: true }
}

export async function togglePublished(id: string, published: boolean): Promise<MutateResult> {
  if (!(await getIsAdmin())) return { error: '権限がありません' }
  if (!id) return { error: 'IDが不正です' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('blog_posts')
    .update({ published })
    .eq('id', id)

  if (error) return { error: '更新できませんでした。もう一度お試しください' }
  return { ok: true }
}

export async function deletePost(id: string): Promise<MutateResult> {
  if (!(await getIsAdmin())) return { error: '権限がありません' }
  if (!id) return { error: 'IDが不正です' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id)

  if (error) return { error: '削除できませんでした。もう一度お試しください' }
  return { ok: true }
}
