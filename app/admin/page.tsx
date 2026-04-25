export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ButtonLink } from '@/components/ui'

async function getStats() {
  const adminClient = createAdminClient()

  const [
    { count: totalCount },
    { count: publishedCount },
    { data: recentPosts },
    { count: projectTotal },
    { count: projectPending },
    { count: projectAnalyzing },
    { count: projectReportReady },
    { count: projectFetchFailed },
    { count: recentInterviews },
    { data: usersData },
  ] = await Promise.all([
    adminClient.from('blog_posts').select('*', { count: 'exact', head: true }),
    adminClient.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
    adminClient
      .from('blog_posts')
      .select('id, slug, title, published, date, category')
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient.from('projects').select('*', { count: 'exact', head: true }),
    adminClient.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'analysis_pending'),
    adminClient.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'analyzing'),
    adminClient.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'report_ready'),
    adminClient.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'fetch_failed'),
    adminClient
      .from('interviews')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  return {
    total: totalCount ?? 0,
    published: publishedCount ?? 0,
    draft: (totalCount ?? 0) - (publishedCount ?? 0),
    recentPosts: recentPosts ?? [],
    userCount: usersData?.users?.length ?? 0,
    projects: {
      total: projectTotal ?? 0,
      pending: projectPending ?? 0,
      analyzing: projectAnalyzing ?? 0,
      report_ready: projectReportReady ?? 0,
      fetch_failed: projectFetchFailed ?? 0,
    },
    recentInterviews: recentInterviews ?? 0,
  }
}

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  const blogCards = [
    { n: String(stats.total),     l: '総記事数' },
    { n: String(stats.published), l: '公開中' },
    { n: String(stats.draft),     l: '下書き' },
    { n: '—',                     l: '今月PV（未連携）' },
  ]

  const serviceCards = [
    { n: String(stats.userCount),             l: '登録ユーザー数' },
    { n: String(stats.projects.total),        l: 'プロジェクト数' },
    { n: String(stats.recentInterviews),      l: '直近7日のインタビュー' },
  ]

  const analysisStatuses = [
    { key: 'analysis_pending', label: '分析待ち', n: stats.projects.pending },
    { key: 'analyzing',    label: '分析中',     n: stats.projects.analyzing },
    { key: 'report_ready', label: 'レポート完了', n: stats.projects.report_ready },
    { key: 'fetch_failed', label: '取得失敗',   n: stats.projects.fetch_failed },
  ]

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">管理ダッシュボード</h1>
          <p className="mt-1 text-sm text-[var(--text2)]">ブログ記事の管理・公開を行います</p>
        </div>
        <ButtonLink href="/admin/posts/new">新しい記事を書く</ButtonLink>
      </div>

      {/* サービス統計 */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text3)]">サービス統計</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {serviceCards.map((s) => (
            <div key={s.l} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">{s.l}</p>
              <p className="mt-2 text-3xl font-bold text-[var(--text)]">{s.n}</p>
            </div>
          ))}
        </div>

        {/* 分析ステータス内訳 */}
        <div className="mt-4 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">プロジェクト 分析ステータス</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
            {analysisStatuses.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--text2)]">{s.label}</span>
                <span className="font-semibold text-[var(--text)]">{s.n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ブログ統計 */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text3)]">ブログ記事</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {blogCards.map((s) => (
            <div key={s.l} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">{s.l}</p>
              <p className="mt-2 text-3xl font-bold text-[var(--text)]">{s.n}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* 最近の記事 */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text)]">最近の記事</h2>
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
            </div>

        {/* サイド情報 */}
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 h-fit">
          <h3 className="font-bold text-[var(--text)] text-sm mb-4">クイックアクション</h3>
          <div className="space-y-2">
            <ButtonLink href="/admin/posts/new" className="w-full justify-center">
              + 新しい記事を書く
            </ButtonLink>
            <Link
              href="/admin/users"
              className="flex w-full items-center justify-center border border-[var(--border)] text-[var(--text2)] text-sm font-semibold py-2 rounded-[var(--r-sm)] hover:bg-[var(--bg2)] transition-colors"
            >
              ユーザー一覧を見る
            </Link>
            <Link
              href="/admin/cast-talk"
              className="flex w-full items-center justify-center border border-[var(--border)] text-[var(--text2)] text-sm font-semibold py-2 rounded-[var(--r-sm)] hover:bg-[var(--bg2)] transition-colors"
            >
              Cast Talk 管理
            </Link>
            <Link
              href="/admin/costs"
              className="flex w-full items-center justify-center border border-[var(--border)] text-[var(--text2)] text-sm font-semibold py-2 rounded-[var(--r-sm)] hover:bg-[var(--bg2)] transition-colors"
            >
              コスト管理
            </Link>
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
