import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PostFormClient } from '../../PostFormClient'
import type { PostFormData } from '@/lib/actions/admin-posts'

async function getPost(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data
}

export default async function AdminPostEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()

  // body JSONからMarkdown文字列を取り出す
  const bodyContent =
    post.body && typeof post.body === 'object' && 'content' in post.body
      ? String(post.body.content)
      : ''

  const defaultValues: Partial<PostFormData> = {
    slug: post.slug as string,
    title: post.title as string,
    excerpt: post.excerpt as string,
    category: post.category as PostFormData['category'],
    type: post.type as PostFormData['type'],
    interviewer: post.interviewer as string | null,
    cover_color: post.cover_color as string,
    date: post.date as string,
    published: post.published as boolean,
    body: bodyContent,
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/posts"
          className="text-sm text-[var(--text3)] transition-colors hover:text-[var(--text)]"
        >
          ← 記事一覧
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[var(--text)]">記事を編集する</h1>
        <p className="mt-1 text-sm text-[var(--text3)]">/{post.slug as string}</p>
      </div>

      <PostFormClient mode="edit" id={id} defaultValues={defaultValues} />
    </div>
  )
}
