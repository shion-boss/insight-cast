export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Breadcrumb, ButtonLink } from '@/components/ui'
import { PostsTableClient } from './PostsTableClient'

async function getAllPosts() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, category, published, date, created_at')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}

export default async function AdminPostsPage() {
  const posts = await getAllPosts()

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '管理', href: '/admin' }, { label: '記事管理' }]} />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text)]">記事管理</h1>
          <p className="mt-1 text-sm text-[var(--text2)]">全 {posts.length} 件</p>
        </div>
        <ButtonLink href="/admin/posts/new">新しい記事を作成</ButtonLink>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border2)] bg-[var(--surface)] p-12 text-center">
          <p className="text-sm text-[var(--text3)]">記事がありません</p>
          <ButtonLink href="/admin/posts/new" className="mt-4 inline-flex">
            最初の記事を書く
          </ButtonLink>
        </div>
      ) : (
        <PostsTableClient posts={posts as Parameters<typeof PostsTableClient>[0]['posts']} />
      )}
    </div>
  )
}
