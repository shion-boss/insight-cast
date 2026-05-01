import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import { isProjectAnalysisReady, resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'
import { buildArticleCountByInterview, getInterviewFlags, getInterviewManagementHref, type InterviewArticleRef } from '@/lib/interview-state'
import { getProjectAnalysisBadge, getProjectContentBadge } from '@/lib/project-badges'
import { Breadcrumb, ButtonLink, CharacterAvatar, InterviewerSpeech, StatusPill } from '@/components/ui'
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


type InterviewRow = {
  id: string
  project_id: string
  interviewer_type: string
  status: string | null
  summary: string | null
  themes: string[] | null
  article_status: string | null
  created_at: string
}

type ArticleRow = {
  id: string
  interview_id: string | null
  article_type: string | null
  title: string | null
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

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // project を取得（RLSでオーナー・メンバー両方がアクセス可）
  const [{ data: project }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, hp_url, status, updated_at, user_id')
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

  // project が取れてから interviews, auditRow, competitors, competitorAnalyses, articles を並列取得
  const [
    { data: interviewRows },
    { data: auditRow },
    { data: competitors },
    { data: competitorAnalyses },
    { data: articleRows },
  ] = await Promise.all([
    supabase
      .from('interviews')
      .select('id, project_id, interviewer_type, status, summary, themes, article_status, created_at')
      .eq('project_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('hp_audits')
      .select('id, raw_data')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('competitors').select('id, url').eq('project_id', id),
    supabase.from('competitor_analyses').select('competitor_id, raw_data').eq('project_id', id),
    supabase
      .from('articles')
      .select('id, interview_id, article_type, title, created_at')
      .eq('project_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  const interviews = (interviewRows ?? []) as InterviewRow[]
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

  const articles = (articleRows ?? []) as ArticleRow[]

  const { articleCountByInterview } = buildArticleCountByInterview(articles as InterviewArticleRef[])
  const articlesByInterview = new Map<string, ArticleRow[]>()
  for (const article of articles) {
    if (!article.interview_id) continue
    const current = articlesByInterview.get(article.interview_id) ?? []
    current.push(article)
    articlesByInterview.set(article.interview_id, current)
  }
  const analysisBadge = getProjectAnalysisBadge(analysisStatus, analysisReady)
  const contentBadge = getProjectContentBadge({
    status: project.status,
    interviewCount: interviews.length,
    articleCount: articles.length,
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
    return Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i
      const m = nM - offset
      const y = nY + Math.floor((m - 1) / 12)
      const mo = ((m - 1 + 120) % 12) + 1
      const key = `${y}-${String(mo).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'short' }).format(new Date(y, mo - 1, 1))
      return { m: label, n: articles.filter((a) => jstMonthKey(new Date(a.created_at)) === key).length }
    })
  })()

  const heatmapData: HeatmapEntry[] = (() => {
    const countMap = new Map<string, number>()
    for (const a of articles) {
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

  // 未作成テーマ一覧
  const uncreatedThemeItems: UncreatedThemeItem[] = interviews
    .filter((interview) => {
      const { hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
      return hasUncreatedThemes && Array.isArray(interview.themes) && interview.themes.length > 0
    })
    .flatMap((interview) => {
      const char = getCharacter(interview.interviewer_type)
      return (interview.themes ?? []).map((theme) => ({
        theme,
        interviewId: interview.id,
        interviewerName: char?.name ?? 'インタビュアー',
        icon48: char?.icon48,
        emoji: char?.emoji,
      }))
    })

  // 取材履歴アイテム
  const interviewHistoryItems: InterviewHistoryItem[] = interviews.map((interview) => {
    const interviewArticles = articlesByInterview.get(interview.id) ?? []
    const latestInterviewArticle = interviewArticles[0] ?? null
    const char = getCharacter(interview.interviewer_type)
    const { hasSummary, hasArticle, hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
    const managementHref = getInterviewManagementHref(interview, articleCountByInterview, 'project')
    const articleHref = interviewArticles.length > 1
      ? `/articles?interviewId=${interview.id}&projectId=${id}`
      : latestInterviewArticle
        ? `/projects/${id}/articles/${latestInterviewArticle.id}`
        : null
    return {
      id: interview.id,
      charName: char?.name ?? 'インタビュアー',
      charEmoji: char?.emoji ?? '🎙️',
      charIcon48: char?.icon48,
      themes: interview.themes,
      hasSummary,
      hasArticle,
      hasUncreatedThemes,
      articleStatus: interview.article_status,
      createdAt: interview.created_at,
      articleCount: interviewArticles.length,
      articleHref,
      articleLabel: interviewArticles.length > 1 ? '記事一覧を見る' : '記事を見る',
      managementHref,
    }
  })

  // 記事アイテム
  const articleSectionItems: ArticleSectionItem[] = articles.map((article) => ({
    id: article.id,
    title: article.title,
    articleType: article.article_type,
    createdAt: article.created_at,
    href: `/projects/${id}/articles/${article.id}`,
  }))

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
      if (articles.some((a) => { const d = new Date(a.created_at); return d >= start && d < end })) active++
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
              <div className="w-10 h-10 rounded-[var(--r)] bg-[var(--accent-l)] flex items-center justify-center flex-shrink-0">
                <CharacterAvatar src={mint?.icon48} alt={mint?.name ?? 'ミント'} emoji={mint?.emoji} size={32} />
              </div>
              <div>
                <div className="text-[22px] font-bold text-[var(--text)]">{project.name || project.hp_url}</div>
                <div className="text-sm text-[var(--text2)] flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[var(--text3)]" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  {project.hp_url}
                </div>
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
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:min-w-[260px]">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { n: interviews.length, l: '取材回数' },
                { n: articles.length, l: '記事' },
              ].map((s) => (
                <div key={s.l} className="rounded-[var(--r)] px-4 py-3 text-center bg-white/60">
                  <div className="font-bold text-[22px] text-[var(--text)]">{s.n}</div>
                  <div className="text-[11px] text-[var(--text2)] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-[var(--text3)]">
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
            <Link href={`/projects/${id}/report`} className="text-xs text-[var(--text3)] hover:text-[var(--text2)] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
              詳細レポートを見る <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {hpPriorityActions.length > 0 && (
              <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:col-span-3">
                <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">優先アクション</p>
                <ul className="space-y-2">
                  {hpPriorityActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text)]">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">{i + 1}</span>
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
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]">
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
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]">
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
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            {influentialTopics.map((topic, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <div className="mt-0.5 flex items-center gap-2">
                  <CharacterAvatar src={claus?.icon48} alt={claus?.name ?? 'クラウス'} emoji={claus?.emoji} size={28} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">{topic.theme}</p>
                  <p className="mt-0.5 text-xs text-[var(--text3)] line-clamp-2">{topic.summary}</p>
                </div>
              </div>
            ))}
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
      />

      {/* 未作成テーマ一覧 */}
      {uncreatedThemeItems.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[var(--text)]">記事にしていないテーマ</h2>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text2)]">
              {uncreatedThemeItems.length}件
            </span>
          </div>
          <PaginatedUncreatedThemes items={uncreatedThemeItems} projectId={id} />
        </div>
      )}

      {/* Interview history */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-[16px] font-bold text-[var(--text)]">取材履歴</h2>
        </div>

        {interviews.length === 0 ? (
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
          <PaginatedInterviewHistory items={interviewHistoryItems} />
        )}
      </div>

      {/* Articles section */}
      {articles.length > 0 && (
        <div id="articles" className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[var(--text)]">記事</h2>
          </div>
          <PaginatedArticles items={articleSectionItems} />
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
