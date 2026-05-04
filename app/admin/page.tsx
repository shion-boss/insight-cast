export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ButtonLink } from '@/components/ui'
import { fetchGscDetail, fetchGscArticleQueries, getValidGscToken, type GscDetail, type GscArticleEntry } from '@/lib/gsc'
import { fetchGa4Comparison, type Ga4Comparison } from '@/lib/ga4'

const PERIOD_DAYS = 30

type RecentPost = {
  id: string
  slug: string
  title: string
  published: boolean
  date: string
  category: string
}

type OwnerSiteStats = {
  configured: boolean
  gsc: GscDetail | null
  blogArticleQueries: GscArticleEntry[] | null
  ga4: Ga4Comparison | null
  ga4Configured: boolean
}

async function getOwnerSiteStats(adminClient: ReturnType<typeof createAdminClient>): Promise<OwnerSiteStats> {
  const ownerProjectId = process.env.SELF_PROJECT_ID
  const ga4PropertyId = process.env.INSIGHT_CAST_GA4_PROPERTY_ID

  if (!ownerProjectId) {
    return { configured: false, gsc: null, blogArticleQueries: null, ga4: null, ga4Configured: !!ga4PropertyId }
  }

  const token = await getValidGscToken(adminClient, ownerProjectId)
  if (!token) {
    return { configured: true, gsc: null, blogArticleQueries: null, ga4: null, ga4Configured: !!ga4PropertyId }
  }

  const today = new Date()
  const oneDay = 24 * 60 * 60 * 1000
  const startDate = new Date(today.getTime() - PERIOD_DAYS * oneDay)

  const [gsc, blogArticleQueries, ga4] = await Promise.all([
    fetchGscDetail(token.accessToken, token.siteUrl, { startDate, endDate: today }).catch(() => null),
    fetchGscArticleQueries(token.accessToken, token.siteUrl, {
      startDate,
      endDate: today,
      pathPrefix: '/blog/',
      maxArticles: 10,
      queriesPerArticle: 5,
    }).catch(() => null),
    ga4PropertyId
      ? fetchGa4Comparison(token.accessToken, ga4PropertyId, PERIOD_DAYS).catch(() => null)
      : Promise.resolve(null),
  ])

  return { configured: true, gsc, blogArticleQueries, ga4, ga4Configured: !!ga4PropertyId }
}

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
    ownerSite,
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
    getOwnerSiteStats(adminClient),
  ])

  return {
    total: totalCount ?? 0,
    published: publishedCount ?? 0,
    draft: (totalCount ?? 0) - (publishedCount ?? 0),
    recentPosts: (recentPosts ?? []) as RecentPost[],
    userCount: usersData?.users?.length ?? 0,
    projects: {
      total: projectTotal ?? 0,
      pending: projectPending ?? 0,
      analyzing: projectAnalyzing ?? 0,
      report_ready: projectReportReady ?? 0,
      fetch_failed: projectFetchFailed ?? 0,
    },
    recentInterviews: recentInterviews ?? 0,
    ownerSite,
  }
}

function fmtNum(n: number): string {
  return n.toLocaleString('ja-JP')
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type DeltaInfo = {
  text: string
  tone: 'up' | 'down' | 'flat' | 'new' | 'none'
}

function calcDelta(current: number, previous: number): DeltaInfo {
  if (previous === 0 && current === 0) return { text: '前30日も0', tone: 'none' }
  if (previous === 0) return { text: `新規（前30日: 0）`, tone: 'new' }
  const diff = current - previous
  const pct = (diff / previous) * 100
  if (Math.abs(pct) < 0.5) return { text: `±0%（前30日: ${fmtNum(previous)}）`, tone: 'flat' }
  const sign = pct > 0 ? '↑' : '↓'
  return {
    text: `${sign} ${Math.abs(pct).toFixed(0)}%（前30日: ${fmtNum(previous)}）`,
    tone: pct > 0 ? 'up' : 'down',
  }
}

function deltaToneClass(tone: DeltaInfo['tone']): string {
  switch (tone) {
    case 'up': return 'text-[var(--ok)]'
    case 'down': return 'text-[var(--err)]'
    case 'new': return 'text-[var(--accent)]'
    default: return 'text-[var(--text3)]'
  }
}

function shortenPath(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  const owner = stats.ownerSite

  // PV カード（GA4）
  const pvCard: { n: string; l: string; sub?: string; subTone?: DeltaInfo['tone'] } = (() => {
    if (!owner.configured) return { n: '—', l: '直近30日PV（自社プロジェクト未設定）' }
    if (!owner.ga4Configured) return { n: '—', l: '直近30日PV（GA4未連携）' }
    if (!owner.ga4) return { n: '—', l: '直近30日PV（取得失敗）' }
    const delta = calcDelta(owner.ga4.current.pageViews, owner.ga4.previous.pageViews)
    return {
      n: fmtNum(owner.ga4.current.pageViews),
      l: '直近30日PV',
      sub: delta.text,
      subTone: delta.tone,
    }
  })()

  const blogCards: Array<{ n: string; l: string; sub?: string; subTone?: DeltaInfo['tone'] }> = [
    { n: String(stats.total),     l: '総記事数' },
    { n: String(stats.published), l: '公開中' },
    { n: String(stats.draft),     l: '下書き' },
    pvCard,
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

  // 検索流入（GSC）カード
  const ownerCards: Array<{ n: string; l: string; sub?: string }> | null = owner.configured && owner.gsc
    ? [
        { n: fmtNum(owner.gsc.summary.clicks),                  l: '検索クリック',     sub: '検索結果からのクリック合計' },
        { n: fmtNum(owner.gsc.summary.impressions),             l: '検索表示回数',     sub: '検索結果に表示された回数' },
        { n: `${(owner.gsc.summary.ctr * 100).toFixed(1)}%`,    l: '平均CTR',          sub: `表示→クリック率（参考値: 平均順位 ${owner.gsc.summary.position.toFixed(1)}位）` },
        { n: fmtNum(owner.gsc.totalQueryCount),                 l: '掲載クエリ数',     sub: '検索結果に1回以上表示されたクエリの種類数' },
      ]
    : null
  const ownerEmptyLabel = !owner.configured
    ? '自社プロジェクト未設定（SELF_PROJECT_ID env を設定してください）'
    : !owner.gsc
      ? 'GSC データを取得できませんでした。トークン期限切れか権限不足の可能性があります。'
      : null

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
              {s.sub && (
                <p className={`mt-2 text-xs ${deltaToneClass(s.subTone ?? 'none')}`}>{s.sub}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 自社サイト 検索流入（GSC 直近30日） */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--text3)]">検索流入（直近30日）</h2>
          <p className="mt-1 text-xs text-[var(--text3)]">
            Google 検索からの自社サイトへの流入。クエリ別の数字は次の取材テーマやタイトル改善のヒントに使えます。
          </p>
        </div>

        {ownerCards ? (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {ownerCards.map((s) => (
                <div key={s.l} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">{s.l}</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--text)]">{s.n}</p>
                  {s.sub && <p className="mt-2 text-xs text-[var(--text3)]">{s.sub}</p>}
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 上位検索クエリ TOP10 */}
              <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border)]">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">上位検索クエリ TOP10</p>
                  <p className="mt-0.5 text-xs text-[var(--text3)]">クリック数の多い順。CTR が低いクエリはタイトル改善の候補。</p>
                </div>
                {owner.gsc!.topQueries.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-[var(--text3)]">直近30日のクエリデータなし</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-semibold tracking-[0.1em] text-[var(--text3)] uppercase">
                        <th className="px-5 py-2 font-semibold">クエリ</th>
                        <th className="px-2 py-2 text-right font-semibold">クリック</th>
                        <th className="px-2 py-2 text-right font-semibold">表示</th>
                        <th className="px-2 py-2 text-right font-semibold">CTR</th>
                        <th className="px-5 py-2 text-right font-semibold">順位</th>
                      </tr>
                    </thead>
                    <tbody>
                      {owner.gsc!.topQueries.map((q, i) => (
                        <tr key={`${q.query}-${i}`} className="border-t border-[var(--border)]">
                          <td className="px-5 py-2 truncate max-w-[200px] text-[var(--text)]" title={q.query}>{q.query}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-[var(--text)]">{fmtNum(q.clicks)}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-[var(--text2)]">{fmtNum(q.impressions)}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-[var(--text2)]">{(q.ctr * 100).toFixed(1)}%</td>
                          <td className="px-5 py-2 text-right tabular-nums text-[var(--text2)]">{q.position.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 上位流入ページ TOP10 */}
              <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border)]">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">上位流入ページ TOP10</p>
                  <p className="mt-0.5 text-xs text-[var(--text3)]">検索流入を多く受けているページ。読まれているテーマが見える。</p>
                </div>
                {owner.gsc!.topPages.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-[var(--text3)]">直近30日のページデータなし</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-semibold tracking-[0.1em] text-[var(--text3)] uppercase">
                        <th className="px-5 py-2 font-semibold">ページ</th>
                        <th className="px-2 py-2 text-right font-semibold">クリック</th>
                        <th className="px-2 py-2 text-right font-semibold">表示</th>
                        <th className="px-5 py-2 text-right font-semibold">順位</th>
                      </tr>
                    </thead>
                    <tbody>
                      {owner.gsc!.topPages.map((p, i) => (
                        <tr key={`${p.page}-${i}`} className="border-t border-[var(--border)]">
                          <td className="px-5 py-2 truncate max-w-[260px] text-[var(--text)]" title={p.page}>
                            <a href={p.page} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {shortenPath(p.page)}
                            </a>
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums text-[var(--text)]">{fmtNum(p.clicks)}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-[var(--text2)]">{fmtNum(p.impressions)}</td>
                          <td className="px-5 py-2 text-right tabular-nums text-[var(--text2)]">{p.position.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* 記事ごとの検索キーワード */}
            <div className="mt-6 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border)]">
                <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">記事ごとの検索キーワード（直近30日）</p>
                <p className="mt-0.5 text-xs text-[var(--text3)]">各ブログ記事がどんな検索語で見つかっているか。次の取材テーマやリライトの判断材料に。</p>
              </div>
              {owner.blogArticleQueries === null ? (
                <div className="px-5 py-6 text-sm text-[var(--text3)]">記事キーワードの取得に失敗しました。</div>
              ) : owner.blogArticleQueries.length === 0 ? (
                <div className="px-5 py-6 text-sm text-[var(--text3)]">直近30日でブログ記事（/blog/ 配下）への検索流入は記録されていません。</div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {owner.blogArticleQueries.map((article, i) => (
                    <div key={`${article.page}-${i}`} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <a
                          href={article.page}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[var(--text)] hover:underline truncate flex-1 min-w-0"
                          title={article.page}
                        >
                          {shortenPath(article.page)}
                        </a>
                        <div className="text-xs text-[var(--text3)] tabular-nums whitespace-nowrap">
                          クリック {fmtNum(article.totalClicks)} / 表示 {fmtNum(article.totalImpressions)}
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {article.queries.map((q, qi) => (
                          <div key={`${q.query}-${qi}`} className="flex items-center gap-3 text-xs">
                            <span className="text-[var(--text3)] tabular-nums w-2">・</span>
                            <span className="text-[var(--text2)] truncate flex-1 min-w-0" title={q.query}>{q.query}</span>
                            <span className="text-[var(--text3)] tabular-nums whitespace-nowrap">
                              {fmtNum(q.clicks)} click / 表示 {fmtNum(q.impressions)} / 順位 {q.position.toFixed(1)} / CTR {(q.ctr * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GA4 上位ページ */}
            {owner.ga4 && owner.ga4.topPages.length > 0 && (
              <div className="mt-6 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border)]">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">よく読まれているページ TOP10（GA4 直近30日）</p>
                  <p className="mt-0.5 text-xs text-[var(--text3)]">検索以外も含む全流入ベース。SNSや直接流入も含む。</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold tracking-[0.1em] text-[var(--text3)] uppercase">
                      <th className="px-5 py-2 font-semibold">ページ</th>
                      <th className="px-2 py-2 text-right font-semibold">PV</th>
                      <th className="px-5 py-2 text-right font-semibold">セッション</th>
                    </tr>
                  </thead>
                  <tbody>
                    {owner.ga4.topPages.map((p, i) => (
                      <tr key={`${p.path}-${i}`} className="border-t border-[var(--border)]">
                        <td className="px-5 py-2 truncate max-w-[400px] text-[var(--text)]" title={p.path}>{p.path}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-[var(--text)]">{fmtNum(p.pageViews)}</td>
                        <td className="px-5 py-2 text-right tabular-nums text-[var(--text2)]">{fmtNum(p.sessions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border2)] bg-[var(--surface)] px-5 py-6 text-sm text-[var(--text3)]">
            {ownerEmptyLabel}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* 最近の記事 */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text)]">最近の記事</h2>
            <Link href="/admin/posts" className="text-sm text-[var(--text3)] hover:text-[var(--text)] transition-colors">
              すべて見る <span aria-hidden="true">→</span>
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
                  key={post.id}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    i < stats.recentPosts.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{post.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--text3)]">{formatDate(post.date)}</p>
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
                    href={`/admin/posts/${post.id}/edit`}
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
              公開サイトを確認 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
