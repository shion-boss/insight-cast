import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCharacter } from '@/lib/characters'
import { isProjectAnalysisReady, resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'
import { buildArticleCountByInterview, getInterviewFlags, getInterviewManagementHref, type InterviewArticleRef } from '@/lib/interview-state'
import { getProjectAnalysisBadge, getProjectContentBadge } from '@/lib/project-badges'
import { Breadcrumb, ButtonLink, CharacterAvatar, InterviewerSpeech, ProjectAvatar, StatusPill } from '@/components/ui'
import { ProjectImageRefreshButton } from '@/components/project-image-refresh-button'
import { getStoredClassifications } from '@/lib/content-map'
import { getStoredSiteBlogPosts } from '@/lib/site-blog-support'
import { getCompetitorInfluentialTopics } from '@/lib/interview-focus-theme'
import { getMemberRole } from '@/lib/project-members'
import { getUserPlan, getPlanLimits } from '@/lib/plans'
import { ContentMapPanel } from '@/app/(tool)/dashboard/_components/content-map-panel'
import type { HeatmapEntry, MonthlyPoint } from '@/app/(tool)/dashboard/_components/analytics-section'
import { AnalyticsSectionDynamic } from './_components/AnalyticsSectionDynamic'
import AnalysisStatusPanel from './AnalysisStatusPanel'
import { ProjectMemberSection } from './_components/ProjectMemberSection'
import { ExternalInterviewLinkSection } from './_components/ExternalInterviewLinkSection'
import {
  PaginatedUncreatedThemes,
  PaginatedInterviewHistory,
  PaginatedArticles,
  type UncreatedThemeItem,
  type InterviewHistoryItem,
  type ArticleSectionItem,
} from './ProjectSections'
import {
  PAGE_SIZE,
  parsePageParam,
  fetchUncreatedThemesPage,
  fetchInterviewsPage,
  fetchArticlesPage,
} from '@/lib/projects/pagination'


type ArticleStub = {
  id: string
  interview_id: string | null
  created_at: string
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const themesPage = parsePageParam(sp.themes_page)
  const interviewsPage = parsePageParam(sp.interviews_page)
  const articlesPage = parsePageParam(sp.articles_page)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // project を取得（RLSでオーナー・メンバー両方がアクセス可）
  const [{ data: project }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, hp_url, status, updated_at, user_id, image_url')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
  ])

  if (!project) redirect('/dashboard')

  // オーナーかメンバーかを判定
  const isOwner = project.user_id === user.id
  const memberRole = isOwner ? null : await getMemberRole(supabase, id, user.id)

  // プラン確認（オーナーのみ外部取材リンク機能の表示判定に使用）
  const ownerPlan = isOwner ? await getUserPlan(supabase, user.id) : null
  const ownerPlanLimits = ownerPlan ? getPlanLimits(ownerPlan) : null
  const externalInterviewLinksAllowed = ownerPlanLimits?.externalInterviewLinksAllowed ?? false

  // オーナーでもメンバーでもない場合はリダイレクト
  if (!isOwner && memberRole === null) redirect('/dashboard')

  const canEdit = isOwner || memberRole === 'editor'

  // project が取れてから auditRow / competitors / competitorAnalyses（プロジェクト単位の調査データ）と、
  // 各リストのページスライス、分析用の軽量 articles を並列取得する。
  // 調査データはオーナー / editor / viewer 全員が同じ値を見るため admin client に統一。
  const adminSupabase = createAdminClient()
  const [
    { data: auditRow },
    { data: competitors },
    { data: competitorAnalyses },
    { data: articleStubsRaw },
    interviewsPageResult,
    articlesPageResult,
    themesPageResult,
  ] = await Promise.all([
    adminSupabase
      .from('hp_audits')
      .select('id, raw_data')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase.from('competitors').select('id, url').eq('project_id', id),
    adminSupabase.from('competitor_analyses').select('competitor_id, raw_data').eq('project_id', id),
    // 分析グラフ・取材ごとの記事数集計のための軽量フェッチ（タイトル等は載せない）
    supabase
      .from('articles')
      .select('id, interview_id, created_at')
      .eq('project_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    fetchInterviewsPage(supabase, id, interviewsPage, PAGE_SIZE),
    fetchArticlesPage(supabase, id, articlesPage, PAGE_SIZE),
    fetchUncreatedThemesPage(supabase, id, themesPage, PAGE_SIZE),
  ])

  const articleStubs = (articleStubsRaw ?? []) as ArticleStub[]
  const interviewItems = interviewsPageResult.rows
  const interviewCount = interviewsPageResult.total
  const articleItems = articlesPageResult.rows
  const articleCount = articlesPageResult.total
  const themeItems = themesPageResult.rows
  const themeCount = themesPageResult.total

  const interviewsTotalPages = Math.max(1, Math.ceil(interviewCount / PAGE_SIZE))
  const articlesTotalPages = Math.max(1, Math.ceil(articleCount / PAGE_SIZE))
  const themesTotalPages = Math.max(1, Math.ceil(themeCount / PAGE_SIZE))

  // 表示中の記事に紐づくインタビュアー情報（characterAvatar / 名前）の引き当て用。
  // ページ表示分のみ最小限フェッチする。
  const articleInterviewIds = Array.from(
    new Set(articleItems.map((a) => a.interview_id).filter((v): v is string => !!v)),
  )
  const articleInterviewerMap = new Map<string, string>()
  if (articleInterviewIds.length > 0) {
    const { data: ivRows } = await supabase
      .from('interviews')
      .select('id, interviewer_type')
      .in('id', articleInterviewIds)
    for (const row of ivRows ?? []) {
      articleInterviewerMap.set(row.id as string, row.interviewer_type as string)
    }
  }

  const analysisReady = isProjectAnalysisReady({
    project,
    competitors: competitors ?? [],
    audit: auditRow,
    competitorAnalyses: competitorAnalyses ?? [],
  }).isReady
  const analysisStatus = resolveProjectAnalysisStatus(project.status, analysisReady)

  const reanalysisNextAvailableAt = (() => {
    if (process.env.NODE_ENV === 'development') return null
    const raw = auditRow?.raw_data as Record<string, unknown> | null
    const analyzedAt = typeof raw?.analyzed_at === 'string' ? new Date(raw.analyzed_at) : null
    if (!analyzedAt) return null
    const next = new Date(analyzedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    return next > new Date() ? next.toISOString() : null
  })()

  const { articleCountByInterview } = buildArticleCountByInterview(articleStubs as InterviewArticleRef[])
  const analysisBadge = getProjectAnalysisBadge(analysisStatus, analysisReady)
  const contentBadge = getProjectContentBadge({
    status: project.status,
    interviewCount,
    articleCount,
  })
  const mint = getCharacter('mint')
  const claus = getCharacter('claus')

  // Analytics
  const rawData = auditRow?.raw_data as Record<string, unknown> | null
  const classifications = getStoredClassifications(rawData)
  const blogPosts = getStoredSiteBlogPosts(rawData)

  // JST ベースの日付キー生成ヘルパー
  const jstMonthKey = (date: Date) => {
    const parts = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit' }).formatToParts(date)
    return `${parts.find((p) => p.type === 'year')?.value ?? ''}-${parts.find((p) => p.type === 'month')?.value ?? ''}`
  }
  const jstDayKey = (date: Date) => {
    const parts = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
    return `${parts.find((p) => p.type === 'year')?.value ?? ''}-${parts.find((p) => p.type === 'month')?.value ?? ''}-${parts.find((p) => p.type === 'day')?.value ?? ''}`
  }

  const monthlyArticles: MonthlyPoint[] = (() => {
    const now = new Date()
    const nowKey = jstMonthKey(now)
    const [nY, nM] = nowKey.split('-').map(Number)
    return Array.from({ length: 12 }, (_, i) => {
      const offset = 11 - i
      const m = nM - offset
      const y = nY + Math.floor((m - 1) / 12)
      const mo = ((m - 1 + 120) % 12) + 1
      const key = `${y}-${String(mo).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'short' }).format(new Date(y, mo - 1, 1))
      return { m: label, n: articleStubs.filter((a) => jstMonthKey(new Date(a.created_at)) === key).length }
    })
  })()

  const heatmapData: HeatmapEntry[] = (() => {
    const countMap = new Map<string, number>()
    for (const a of articleStubs) {
      const key = jstDayKey(new Date(a.created_at))
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }
    return [...countMap.entries()].map(([date, count]) => ({ date, count }))
  })()

  // HP診断サマリー用データ
  const toStringList = (value: unknown) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
  const hpPriorityActions = toStringList(rawData?.priority_actions).slice(0, 5)
  const hpStrengths = toStringList(rawData?.strengths).slice(0, 4)
  const hpGaps = toStringList(rawData?.gaps).slice(0, 4)

  // 競合差分ハイライト用データ
  const influentialTopics = [...new Map(
    (competitorAnalyses ?? []).flatMap((ca) =>
      getCompetitorInfluentialTopics(ca.raw_data as Record<string, unknown>).map((t) => [t.theme, t] as const)
    )
  ).values()].slice(0, 5)

  // 未作成テーマ一覧（サーバーページネーション済み）
  const uncreatedThemeItems: UncreatedThemeItem[] = themeItems.map((row) => {
    const char = getCharacter(row.interviewer_type)
    return {
      theme: row.theme,
      interviewId: row.interview_id,
      interviewerName: char?.name ?? 'インタビュアー',
      icon48: char?.icon48,
      emoji: char?.emoji,
    }
  })

  // 取材メモアイテム（サーバーページネーション済みの interviews を表示用に整形）
  const interviewHistoryItems: InterviewHistoryItem[] = interviewItems.map((interview) => {
    const char = getCharacter(interview.interviewer_type)
    const managementHref = getInterviewManagementHref(interview, articleCountByInterview, 'project')
    const themeCount = Array.isArray(interview.themes)
      ? interview.themes.filter((t) => typeof t === 'string' && t.trim().length > 0).length
      : 0
    const ivArticleCount = articleCountByInterview.get(interview.id) ?? 0
    const uncreatedThemeCount = Math.max(0, themeCount - ivArticleCount)
    const { hasSummary } = getInterviewFlags(interview, articleCountByInterview)
    const isDone = interview.status === 'done' || hasSummary
    return {
      id: interview.id,
      charName: char?.name ?? 'インタビュアー',
      charEmoji: char?.emoji ?? '🎙️',
      charIcon48: char?.icon48,
      createdAt: interview.created_at,
      isDone,
      articleCount: ivArticleCount,
      uncreatedThemeCount,
      managementHref,
    }
  })

  // 記事アイテム（サーバーページネーション済み）
  const articleSectionItems: ArticleSectionItem[] = articleItems.map((article) => {
    const interviewerType = article.interview_id ? articleInterviewerMap.get(article.interview_id) : null
    const interviewChar = interviewerType ? getCharacter(interviewerType) : null
    return {
      id: article.id,
      title: article.title,
      articleType: article.article_type,
      createdAt: article.created_at,
      href: `/projects/${id}/articles/${article.id}`,
      interviewerName: interviewChar?.name ?? null,
      interviewerIcon48: interviewChar?.icon48,
      interviewerEmoji: interviewChar?.emoji,
    }
  })

  const continuityScore = (() => {
    const now = new Date()
    const thisSunday = new Date(now)
    thisSunday.setDate(now.getDate() - now.getDay())
    thisSunday.setHours(0, 0, 0, 0)
    let active = 0
    for (let w = 0; w < 12; w++) {
      const start = new Date(thisSunday)
      start.setDate(thisSunday.getDate() - w * 7)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)
      if (articleStubs.some((a) => { const d = new Date(a.created_at); return d >= start && d < end })) active++
    }
    return Math.min(100, Math.round((active / 12) * 100))
  })()

  return (
    <>
      <Breadcrumb items={[
        { label: 'プロジェクト一覧', href: '/projects' },
        { label: project.name || project.hp_url },
      ]} />
      {/* Overview panel */}
      <div
        className="rounded-[var(--r-lg)] border border-[var(--border)] p-7 mb-7"
        style={{ background: 'linear-gradient(135deg,var(--accent-l),var(--teal-l))' }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <ProjectAvatar
                imageUrl={project.image_url}
                name={project.name || project.hp_url}
                size={64}
              />
              <div>
                <div className="text-[22px] font-bold text-[var(--text)]">{project.name || project.hp_url}</div>
                <div className="text-base text-[var(--text2)] flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[var(--text2)]" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  {project.hp_url}
                </div>
                {canEdit && (
                  <div className="mt-1">
                    <ProjectImageRefreshButton projectId={id} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <StatusPill tone={analysisBadge.tone} className="px-2.5 py-1 text-[11px] font-semibold">
                {analysisBadge.label}
              </StatusPill>
              {contentBadge && (
                <StatusPill tone={contentBadge.tone} className="px-2.5 py-1 text-[11px] font-semibold">
                  {contentBadge.label}
                </StatusPill>
              )}
              {competitors && competitors.length > 0 && (
                <span className="text-[11px] bg-[rgba(255,255,255,0.5)] text-[var(--text2)] px-2.5 py-1 rounded-full font-semibold">競合 {competitors.length}件</span>
              )}
              {!isOwner && (
                <StatusPill tone="info" className="px-2.5 py-1 text-[11px] font-semibold">
                  {memberRole === 'editor' ? '編集者として参加中' : '閲覧者として参加中'}
                </StatusPill>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:min-w-[260px]">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { n: interviewCount, l: '取材回数' },
                { n: articleCount, l: '記事' },
              ].map((s) => (
                <div key={s.l} className="rounded-[var(--r)] px-4 py-3 text-center bg-white/60">
                  <div className="font-bold text-[22px] text-[var(--text)]">{s.n}</div>
                  <div className="text-[11px] text-[var(--text2)] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-[var(--text2)]">
              最終更新: {formatDateTime(project.updated_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="mt-8">
        <AnalyticsSectionDynamic
          monthlyArticles={monthlyArticles}
          heatmapData={heatmapData}
          continuityScore={continuityScore}
          nextProjectId={id}
          canEdit={canEdit}
        />
      </div>

      {/* Content map */}
      {blogPosts.length > 0 && (
        <div className="mt-6">
          <ContentMapPanel
            projectId={id}
            projectName={project.name || project.hp_url}
            initialClassifications={classifications}
            blogPostCount={blogPosts.length}
            clausIcon={claus?.icon48}
            clausEmoji={claus?.emoji}
          />
        </div>
      )}

      {/* HP診断サマリー */}
      {auditRow && (hpPriorityActions.length > 0 || hpStrengths.length > 0 || hpGaps.length > 0) && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[var(--text)]">HP診断サマリー</h2>
            <Link href={`/projects/${id}/report`} className="text-[13px] text-[var(--text2)] hover:text-[var(--text2)] transition-colors rounded">
              詳細レポートを見る <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {hpPriorityActions.length > 0 && (
              <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:col-span-3">
                <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--text2)] uppercase">優先アクション</p>
                <ul className="space-y-2">
                  {hpPriorityActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-base text-[var(--text)]">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white">{i + 1}</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hpStrengths.length > 0 && (
              <div className="rounded-[var(--r-lg)] border border-[var(--ok)]/30 bg-[var(--ok-l)] p-5 sm:col-span-1">
                <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--ok)] uppercase">強み</p>
                <ul className="space-y-1.5">
                  {hpStrengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-[var(--text)]">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--ok)]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hpGaps.length > 0 && (
              <div className="rounded-[var(--r-lg)] border border-[var(--warn)]/30 bg-[var(--warn-l)] p-5 sm:col-span-2">
                <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--warn)] uppercase">課題・弱点</p>
                <ul className="space-y-1.5">
                  {hpGaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-[var(--text)]">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--warn)]" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 競合差分ハイライト */}
      {influentialTopics.length > 0 && (
        <div className="mt-6">
          <div className="mb-3">
            <h2 className="text-[16px] font-bold text-[var(--text)]">競合が扱っている注目テーマ</h2>
          </div>
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
            {influentialTopics.map((topic, i) => {
              if (!canEdit) {
                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-4">
                    <div className="mt-0.5 flex items-center gap-2">
                      <CharacterAvatar src={claus?.icon48} alt={claus?.name ?? 'クラウス'} emoji={claus?.emoji} size={28} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-[var(--text)]">{topic.theme}</p>
                      <p className="mt-0.5 text-[13px] text-[var(--text2)] line-clamp-2">{topic.summary}</p>
                    </div>
                  </div>
                )
              }
              return (
                <Link
                  key={i}
                  href={`/projects/${id}/interviewer`}
                  className="group flex items-start gap-3 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
                >
                  <div className="mt-0.5 flex items-center gap-2">
                    <CharacterAvatar src={claus?.icon48} alt={claus?.name ?? 'クラウス'} emoji={claus?.emoji} size={28} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{topic.theme}</p>
                    <p className="mt-0.5 text-[13px] text-[var(--text2)] line-clamp-2 transition-colors group-hover:text-[var(--accent)]">{topic.summary}</p>
                  </div>
                  <span aria-hidden="true" className="shrink-0 self-end text-[12px] font-semibold text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">取材する →</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Analysis / competitors section */}
      <AnalysisStatusPanel
        projectId={id}
        projectName={project.name || project.hp_url}
        initialStatus={analysisStatus}
        competitorCount={competitors?.length ?? 0}
        hasAudit={!!auditRow}
        reanalysisNextAvailableAt={reanalysisNextAvailableAt}
        canEdit={canEdit}
        isOwner={isOwner}
      />

      {/* 未作成テーマ一覧 */}
      {themeCount > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[var(--text)]">記事にしていないテーマ</h2>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] font-medium text-[var(--text2)]">
              {themeCount}件
            </span>
          </div>
          <PaginatedUncreatedThemes
            items={uncreatedThemeItems}
            projectId={id}
            canEdit={canEdit}
            page={themesPage}
            totalPages={themesTotalPages}
          />
        </div>
      )}

      {/* Interview history */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-[16px] font-bold text-[var(--text)]">取材メモ</h2>
        </div>

        {interviewCount === 0 ? (
          <>
            <InterviewerSpeech
              icon={(
                <CharacterAvatar
                  src={mint?.icon48}
                  alt={`${mint?.name ?? 'インタビュアー'}のアイコン`}
                  emoji={mint?.emoji}
                  size={48}
                />
              )}
              name={mint?.name ?? 'インタビュアー'}
              title="AIキャストを呼んで、取材を始めましょう。"
              description="インタビューを重ねるたびに、ここに履歴と記事がまとまっていきます。"
              tone="soft"
            />
            {/* viewer は取材開始ボタンを非表示 */}
            {memberRole !== 'viewer' && (
              <div className="mt-4">
                <ButtonLink href={`/projects/${id}/interviewer`}>取材を始める <span aria-hidden="true">→</span></ButtonLink>
              </div>
            )}
          </>
        ) : (
          <PaginatedInterviewHistory
            items={interviewHistoryItems}
            page={interviewsPage}
            totalPages={interviewsTotalPages}
          />
        )}
      </div>

      {/* Articles section */}
      {articleCount > 0 && (
        <div id="articles" className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[var(--text)]">記事</h2>
          </div>
          <PaginatedArticles
            items={articleSectionItems}
            page={articlesPage}
            totalPages={articlesTotalPages}
          />
        </div>
      )}

      {/* メンバー共有セクション（オーナーのみ表示） */}
      {isOwner && (
        <div className="mt-8">
          <ProjectMemberSection projectId={id} />
        </div>
      )}

      {/* 外部取材リンクセクション（オーナーかつ法人プランのみ表示） */}
      {isOwner && externalInterviewLinksAllowed && (
        <div className="mt-8">
          <ExternalInterviewLinkSection projectId={id} />
        </div>
      )}
    </>
  )
}
