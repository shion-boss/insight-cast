export const dynamic = 'force-dynamic'

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

  const statCards = [
    { n: String(stats.total),     l: '総記事数' },
    { n: String(stats.published), l: '公開中' },
    { n: String(stats.draft),     l: '下書き' },
    { n: '—',                     l: '今月PV' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]">管理ダッシュボード</h1>
          <p className="mt-1 text-sm text-[var(--text2)]">ブログ記事の管理・公開を行います</p>
        </div>
        <ButtonLink href="/admin/posts/new">新しい記事を書く</ButtonLink>
      </div>

      {/* 4枚 stat カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.l} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">{s.l}</p>
            <p className="mt-2 font-[family-name:var(--font-noto-serif-jp)] text-3xl font-bold text-[var(--text)]">{s.n}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* 最近の記事 */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-lg font-bold text-[var(--text)]">最近の記事</h2>
            <Link href="/admin/posts" className="text-sm text-[var(--text3)] hover:text-[var(--text)] transition-colors">
              すべて見る →
            </Link>
          </div>

          {stats.recentPosts.length === 0 ? (
            <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border2)] bg-[var(--surface)] p-8 text-center">
              <p className="text-sm text-[var(--text3)]">まだ記事がありません</p>
              <ButtonLink href="/admin/posts/new" className="mt-4 inline-flex">
                最初の記事を書く
              </ButtonLink>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
              {stats.recentPosts.map((post, i) => (
                <div
                  key={post.id as string}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    i < stats.recentPosts.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{post.title as string}</p>
                    <p className="mt-0.5 text-xs text-[var(--text3)]">{formatDate(post.date as string)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      post.published
                        ? 'bg-[var(--ok-l)] text-[var(--ok)]'
                        : 'bg-[var(--bg2)] text-[var(--text3)] border border-[var(--border)]'
                    }`}
                  >
                    {post.published ? '公開中' : '下書き'}
                  </span>
                  <Link
                    href={`/admin/posts/${post.id as string}/edit`}
                    className="shrink-0 rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    編集
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-right">
            <Link href="/admin/posts" className="text-sm text-[var(--text3)] hover:text-[var(--text)] transition-colors">
              すべて見る →
            </Link>
          </div>
        </div>

        {/* サイド情報 */}
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 h-fit">
          <h3 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-sm mb-4">クイックアクション</h3>
          <div className="space-y-2">
            <ButtonLink href="/admin/posts/new" className="w-full justify-center">
              + 新しい記事を書く
            </ButtonLink>
            <Link
              href="/"
              className="flex w-full items-center justify-center border border-[var(--border)] text-[var(--text2)] text-sm font-semibold py-2 rounded-[var(--r-sm)] hover:bg-[var(--bg2)] transition-colors"
            >
              公開サイトを確認 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
