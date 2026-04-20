import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ButtonLink } from '@/components/ui'

async function getStats() {
  const supabase = await createClient()

  const [{ count: totalCount }, { count: publishedCount }, { data: recentPosts }] =
    await Promise.all([
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
      supabase
        .from('blog_posts')
        .select('id, slug, title, published, date, category')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  return {
    total: totalCount ?? 0,
    published: publishedCount ?? 0,
    draft: (totalCount ?? 0) - (publishedCount ?? 0),
    recentPosts: recentPosts ?? [],
  }
}

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">ダッシュボード</h1>
          <p className="mt-1 text-sm text-stone-500">ブログ記事の管理・公開を行います</p>
        </div>
        <ButtonLink href="/admin/posts/new">新しい記事を書く</ButtonLink>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold tracking-wider text-stone-400 uppercase">総記事数</p>
          <p className="mt-2 text-3xl font-bold text-stone-950">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">公開中</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.published}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase">下書き</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{stats.draft}</p>
        </div>
      </div>

      {/* 最近の記事 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-800">最近の記事</h2>
          <Link href="/admin/posts" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
            すべて見る →
          </Link>
        </div>

        {stats.recentPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-sm text-stone-400">まだ記事がありません</p>
            <ButtonLink href="/admin/posts/new" className="mt-4 inline-flex">
              最初の記事を書く
            </ButtonLink>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {stats.recentPosts.map((post, i) => (
              <div
                key={post.id as string}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i < stats.recentPosts.length - 1 ? 'border-b border-stone-100' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-800">{post.title as string}</p>
                  <p className="mt-0.5 text-xs text-stone-400">{formatDate(post.date as string)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    post.published
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {post.published ? '公開中' : '下書き'}
                </span>
                <Link
                  href={`/admin/posts/${post.id as string}/edit`}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                >
                  編集
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
