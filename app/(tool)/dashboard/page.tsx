import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ButtonLink, CharacterAvatar, InterviewerSpeech, StatusPill, getButtonClass } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { buildArticleCountByInterview, getInterviewFlags, getInterviewManagementHref, type InterviewArticleRef } from '@/lib/interview-state'
import { isProjectAnalysisReady } from '@/lib/analysis/project-readiness'
import { getProjectAnalysisBadge, getProjectContentBadge } from '@/lib/project-badges'
import { getUserPlan, getPlanLimits } from '@/lib/plans'
import type { Character } from '@/lib/characters'

async function SharedProjectsZeroState({
  userId,
  mint,
}: {
  userId: string
  mint: Character | undefined
}) {
  const supabase = await createClient()
  const { count: sharedCount } = await supabase
    .from('project_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((sharedCount ?? 0) > 0) {
    return (
      <div className="mt-4">
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
          title="招待されたプロジェクトがあります。"
          description="プロジェクト一覧からアクセスできます。自分のプロジェクトを登録することもできます。"
          tone="soft"
        />
        <div className="mt-4">
          <ButtonLink href="/projects">プロジェクト一覧を見る <span aria-hidden="true">→</span></ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
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
        title="AIキャストが取材の準備をして待っています。"
        description="まずはプロジェクトを登録してみましょう。登録するとインタビューを始められます。"
        tone="soft"
      />
      <div className="mt-4">
        <ButtonLink href="/projects/new">最初のプロジェクトを登録する <span aria-hidden="true">→</span></ButtonLink>
      </div>
    </div>
  )
}

type Project = {
  id: string
  name: string | null
  hp_url: string
  status: string
  created_at: string
  updated_at: string
}

type Interview = {
  id: string
  project_id: string
  interviewer_type: string
  status: string | null
  summary: string | null
  themes: string[] | null
  created_at: string
}

type ArticleRow = {
  id: string
  interview_id: string | null
  created_at: string
}

function getProjectContinueHref(project: { id: string; status: string | null }) {
  switch (project.status) {
    case 'analyzing':
    case 'report_ready':
      return `/projects/${project.id}/report`
    default:
      return `/projects/${project.id}`
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function jstMonthKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  const y = parts.find((p) => p.type === 'year')?.value ?? ''
  const m = parts.find((p) => p.type === 'month')?.value ?? ''
  return `${y}-${m}`
}

export default async function DashboardPage() {
  let supabase
  let user

  try {
    supabase = await createClient()
    const authResult = await supabase.auth.getUser()
    user = authResult.data.user
  } catch {
    redirect('/')
  }

  if (!supabase) redirect('/')
  if (!user) redirect('/')

  const userId = user.id

  const [{ data: profile }, { data: projects }, userPlan] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', userId).maybeSingle(),
    supabase
      .from('projects')
      .select('id, name, hp_url, status, created_at, updated_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false }),
    getUserPlan(supabase, userId),
  ])

  const projectList = (projects ?? []) as Project[]
  const projectMap = Object.fromEntries(projectList.map((p) => [p.id, p]))
  const projectIds = projectList.map((p) => p.id)

  const [auditResult, competitorResult, competitorAnalysisResult, interviewResult, articleResult] = await Promise.all([
    projectList.length > 0
      ? supabase.from('hp_audits').select('id, project_id, raw_data, created_at').in('project_id', projectIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    projectList.length > 0
      ? supabase.from('competitors').select('id, project_id, url').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
    projectList.length > 0
      ? supabase.from('competitor_analyses').select('project_id, competitor_id, raw_data').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
    projectList.length > 0
      ? supabase.from('interviews').select('id, project_id, interviewer_type, status, summary, themes, created_at').in('project_id', projectIds).is('deleted_at', null).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    projectList.length > 0
      ? supabase.from('articles').select('id, interview_id, created_at').in('project_id', projectIds).is('deleted_at', null).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const auditRows = auditResult.data ?? []
  const competitorRows = competitorResult.data ?? []
  const competitorAnalysisRows = competitorAnalysisResult.data ?? []
  const interviews = (interviewResult.data ?? []) as Interview[]

  const analysisReadyProjectIds = new Set(
    projectList
      .filter((p) => isProjectAnalysisReady({
        project: p,
        competitors: competitorRows.filter((c) => c.project_id === p.id),
        audit: auditRows.find((a) => a.project_id === p.id),
        competitorAnalyses: competitorAnalysisRows.filter((r) => r.project_id === p.id),
      }).isReady)
      .map((p) => p.id),
  )

  const latestInterviewMap = new Map<string, Interview>()
  let articleCountByInterview = new Map<string, number>()
  const interviewCountByProject = new Map<string, number>()
  const articleCountByProject = new Map<string, number>()

  for (const iv of interviews) {
    if (!latestInterviewMap.has(iv.project_id)) latestInterviewMap.set(iv.project_id, iv)
    interviewCountByProject.set(iv.project_id, (interviewCountByProject.get(iv.project_id) ?? 0) + 1)
  }

  const allArticles = (articleResult.data ?? []) as ArticleRow[]
  const built = buildArticleCountByInterview(allArticles as InterviewArticleRef[])
  articleCountByInterview = built.articleCountByInterview

  for (const iv of interviews) {
    articleCountByProject.set(
      iv.project_id,
      (articleCountByProject.get(iv.project_id) ?? 0) + (articleCountByInterview.get(iv.id) ?? 0),
    )
  }

  const totalArticles = allArticles.length

  // Previous-month deltas
  const now = new Date()
  const thisMonthKey = jstMonthKey(now)
  const [kmY, kmM] = thisMonthKey.split('-').map(Number)
  const prevM = kmM === 1 ? 12 : kmM - 1
  const prevY = kmM === 1 ? kmY - 1 : kmY
  const lastMonthKey = `${prevY}-${String(prevM).padStart(2, '0')}`

  const thisMonthInterviews = interviews.filter((iv) => jstMonthKey(new Date(iv.created_at)) === thisMonthKey).length
  const lastMonthInterviews = interviews.filter((iv) => jstMonthKey(new Date(iv.created_at)) === lastMonthKey).length
  const interviewDelta = thisMonthInterviews - lastMonthInterviews

  const thisMonthArticles = allArticles.filter((a) => jstMonthKey(new Date(a.created_at)) === thisMonthKey).length
  const lastMonthArticles = allArticles.filter((a) => jstMonthKey(new Date(a.created_at)) === lastMonthKey).length
  const articleDelta = thisMonthArticles - lastMonthArticles

  const thisMonthProjects = projectList.filter((p) => jstMonthKey(new Date(p.created_at)) === thisMonthKey).length
  const lastMonthProjectCount = projectList.filter((p) => jstMonthKey(new Date(p.created_at)) === lastMonthKey).length
  const projectDelta = thisMonthProjects - lastMonthProjectCount

  const mint = getCharacter('mint')
  const interviewerHref =
    projectList.length === 0
      ? '/projects/new'
      : projectList.length === 1
        ? `/projects/${projectList[0].id}/interviewer`
        : '/projects'

  const planLimits = getPlanLimits(userPlan)
  const isProjectLimitReached = projectList.length >= planLimits.maxProjects
  const totalInterviewCount = interviews.length
  const isFreePlan = planLimits.lifetimeInterviewLimit !== null
  const isInterviewLimitReached = isFreePlan
    ? totalInterviewCount >= (planLimits.lifetimeInterviewLimit ?? Infinity)
    : thisMonthInterviews >= planLimits.monthlyInterviewLimit

  const deltaLabel = (n: number) =>
    n === 0 ? '先月と同じ' : n > 0 ? `先月比 +${n}` : `先月比 ${n}`

  return (
    <>
      {/* ── ページタイトル + ヘッダーアクション ── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-serif text-xl font-bold text-[var(--text)]">ダッシュボード</h1>
        <div>
          {isProjectLimitReached ? (
            <Link
              href="/pricing?reason=project_limit"
              className={getButtonClass('secondary', 'px-4 py-2 text-sm opacity-60 flex items-center gap-1.5')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> プロジェクトを追加（上限）
            </Link>
          ) : (
            <Link href="/projects/new" className={getButtonClass('primary', 'px-4 py-2 text-sm')}>
              + プロジェクトを追加
            </Link>
          )}
        </div>
      </div>

      {/* ── Greeting bar ── */}
      <div
        className="mb-6 rounded-[var(--r-lg)] border border-[var(--border)] px-5 py-5 sm:px-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ background: 'linear-gradient(135deg,var(--accent-l),var(--teal-l))' }}
      >
        <div>
          <div className="text-[20px] font-bold text-[var(--text)] mb-1.5">
            こんにちは、{profile?.name ?? 'ゲスト'}さん
          </div>
          {!profile?.name && (
            <Link href="/settings" className="text-xs text-[var(--accent)] hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
              名前を設定する <span aria-hidden="true">→</span>
            </Link>
          )}
          <div className="text-sm text-[var(--text2)]">
            {isFreePlan
              ? <>生涯取材: <strong>{totalInterviewCount} / {planLimits.lifetimeInterviewLimit} 回</strong></>
              : <>今月の取材: <strong>{thisMonthInterviews} / {planLimits.monthlyInterviewLimit} 回</strong></>
            }
            {totalArticles > 0 && <><span aria-hidden="true"> · </span>累計記事 <strong>{totalArticles} 件</strong></>}
          </div>
          {(isFreePlan ? planLimits.lifetimeInterviewLimit !== null : planLimits.monthlyInterviewLimit < 9999) && (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={isFreePlan ? (planLimits.lifetimeInterviewLimit ?? 1) : planLimits.monthlyInterviewLimit}
              aria-valuenow={isFreePlan ? totalInterviewCount : thisMonthInterviews}
              aria-label={isFreePlan ? '生涯取材回数' : '今月の取材回数'}
              className="mt-2 w-48 h-1.5 rounded-full bg-[rgba(0,0,0,0.08)] overflow-hidden"
            >
              <div
                aria-hidden="true"
                className={`h-full rounded-full transition-all ${isInterviewLimitReached ? 'bg-[var(--err)]' : 'bg-[var(--accent)]'}`}
                style={{
                  width: isFreePlan
                    ? `${Math.min((totalInterviewCount / (planLimits.lifetimeInterviewLimit ?? 1)) * 100, 100)}%`
                    : `${Math.min((thisMonthInterviews / planLimits.monthlyInterviewLimit) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {isInterviewLimitReached ? (
            <Link
              href="/pricing?reason=interview_limit"
              className={getButtonClass('secondary', 'text-sm px-4 py-2 opacity-60 flex items-center gap-1.5')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> 取材上限 — プランを確認する
            </Link>
          ) : (
            <Link
              href={interviewerHref}
              className={getButtonClass('primary', 'text-sm px-4 py-2')}
            >
              {projectList.length > 1 ? <>プロジェクトを選ぶ <span aria-hidden="true">→</span></> : <>取材を始める <span aria-hidden="true">→</span></>}
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { n: projectList.length,  l: 'プロジェクト',      delta: deltaLabel(projectDelta) },
          { n: interviews.filter((iv) => iv.status === 'done' || iv.summary).length, l: '完了した取材', delta: deltaLabel(interviewDelta) },
          { n: totalArticles,       l: '記事',    delta: deltaLabel(articleDelta) },
        ].map((stat) => (
          <div key={stat.l} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-[22px]">
            <div className="text-[34px] font-bold tabular-nums text-[var(--text)] leading-none">{stat.n}</div>
            <div className="text-sm text-[var(--text2)] mt-1.5">{stat.l}</div>
            <div className="text-[12px] mt-1 font-semibold text-[var(--teal)]">{stat.delta}</div>
          </div>
        ))}
      </div>

      {projectList.length === 0 ? (
        <SharedProjectsZeroState userId={userId} mint={mint} />
      ) : (
        <div className="flex flex-col gap-6">

          {/* ── Quick actions ── */}
          {(() => {
            const claus = getCharacter('claus')
            const rain = getCharacter('rain')
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href={isProjectLimitReached ? '/pricing?reason=project_limit' : '/projects/new'}
                  aria-label={isProjectLimitReached ? 'プロジェクトを追加（プラン上限 — アップグレードする）' : undefined}
                  className="relative bg-[var(--surface)] border-[1.5px] border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-5 flex flex-col items-center gap-2.5 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-l)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  {isProjectLimitReached && (
                    <div className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[var(--text3)] text-white">
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="1" y="5" width="8" height="7" rx="1.5" fill="currentColor"/>
                        <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                      </svg>
                    </div>
                  )}
                  <CharacterAvatar src={claus?.icon48} alt={claus?.name ?? 'クラウス'} emoji={claus?.emoji} size={40} className={isProjectLimitReached ? 'opacity-40' : undefined} />
                  <div className={`text-sm font-semibold ${isProjectLimitReached ? 'text-[var(--text3)]' : 'text-[var(--text2)]'}`}>プロジェクトを追加する</div>
                </Link>
                {isInterviewLimitReached ? (
                  <Link
                    href="/pricing?reason=interview_limit"
                    className="relative bg-[var(--bg2)] border-[1.5px] border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-5 flex flex-col items-center gap-2.5 opacity-60 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    <div className="absolute top-2 right-2 text-xs font-bold bg-[var(--text3)] text-white rounded-full px-1.5 py-0.5 leading-none">上限</div>
                    <CharacterAvatar src={mint?.icon48} alt={mint?.name ?? 'ミント'} emoji={mint?.emoji} size={40} className="grayscale" />
                    <div className="text-sm font-semibold text-[var(--text3)]">取材を始める</div>
                    <div className="text-[11px] text-[var(--accent)] font-semibold">プランを見る <span aria-hidden="true">→</span></div>
                  </Link>
                ) : (
                  <Link
                    href={interviewerHref}
                    className="bg-[var(--surface)] border-[1.5px] border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-5 flex flex-col items-center gap-2.5 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-l)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    <CharacterAvatar src={mint?.icon48} alt={mint?.name ?? 'ミント'} emoji={mint?.emoji} size={40} />
                    <div className="text-sm font-semibold text-[var(--text2)]">{projectList.length > 1 ? 'プロジェクトを選ぶ' : '取材を始める'}</div>
                  </Link>
                )}
                <Link
                  href="/articles"
                  className="bg-[var(--surface)] border-[1.5px] border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-5 flex flex-col items-center gap-2.5 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-l)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  <CharacterAvatar src={rain?.icon48} alt={rain?.name ?? 'レイン'} emoji={rain?.emoji} size={40} />
                  <div className="text-sm font-semibold text-[var(--text2)]">記事を確認する</div>
                </Link>
              </div>
            )
          })()}

          {/* ── Projects + Interviews ── */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold text-[var(--text)]">プロジェクト一覧</h2>
                <Link href="/projects" aria-label="プロジェクトをすべて見る" className="text-sm text-[var(--accent)] font-semibold hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">すべて見る <span aria-hidden="true">→</span></Link>
              </div>
              <div className="flex flex-col gap-[10px]">
                {projectList.slice(0, 4).map((project) => {
                  const analysisBadge = getProjectAnalysisBadge(project.status, analysisReadyProjectIds.has(project.id))
                  const contentBadge = getProjectContentBadge({
                    status: project.status,
                    interviewCount: interviewCountByProject.get(project.id) ?? 0,
                    articleCount: articleCountByProject.get(project.id) ?? 0,
                  })
                  return (
                    <Link
                      key={project.id}
                      href={getProjectContinueHref(project)}
                      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-5 flex items-center gap-4 transition-[shadow,border-color] hover:border-[var(--accent)]/40 hover:shadow-[0_4px_20px_var(--shadow,rgba(0,0,0,0.08))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      {(() => {
                        const latestIv = latestInterviewMap.get(project.id)
                        const cardChar = latestIv ? (getCharacter(latestIv.interviewer_type) ?? mint) : mint
                        return (
                          <div className="w-11 h-11 rounded-[var(--r)] bg-[var(--accent-l)] flex items-center justify-center flex-shrink-0">
                            <CharacterAvatar src={cardChar?.icon48} alt={cardChar?.name ?? 'インタビュアー'} emoji={cardChar?.emoji} size={32} />
                          </div>
                        )
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-[var(--text)] mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                          {project.name || project.hp_url}
                        </div>
                        <div className="text-[12px] text-[var(--text3)]">
                          {latestInterviewMap.has(project.id)
                            ? `最終取材: ${formatShortDateTime(latestInterviewMap.get(project.id)!.created_at)}`
                            : `更新: ${formatDate(project.updated_at)}`}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <StatusPill tone={analysisBadge.tone} className="px-2.5 py-1 text-[11px] font-semibold">
                          {analysisBadge.label}
                        </StatusPill>
                        {contentBadge && (
                          <StatusPill tone={contentBadge.tone} className="px-2.5 py-1 text-[11px] font-semibold">
                            {contentBadge.label}
                          </StatusPill>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold text-[var(--text)]">最近の取材</h2>
                <Link href="/interviews" aria-label="取材履歴をすべて見る" className="text-sm text-[var(--accent)] font-semibold hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">すべて見る <span aria-hidden="true">→</span></Link>
              </div>
              {interviews.length === 0 ? (
                <InterviewerSpeech
                  icon={<CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'インタビュアー'}のアイコン`} emoji={mint?.emoji} size={48} />}
                  name={mint?.name ?? 'インタビュアー'}
                  title="まだ取材は始まっていません。"
                  description="上の「プロジェクト一覧」からプロジェクトを開き、インタビューを始めてみてください。"
                  tone="soft"
                />
              ) : (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] px-5 py-1">
                  {interviews.slice(0, 4).map((interview, i) => {
                    const project = projectMap[interview.project_id]
                    if (!project) return null
                    const char = getCharacter(interview.interviewer_type)
                    const { hasSummary, hasArticle, hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
                    const interviewHref = getInterviewManagementHref(interview, articleCountByInterview)
                    return (
                      <Link
                        key={interview.id}
                        href={interviewHref}
                        className={`flex items-center gap-[14px] py-[14px] ${i < Math.min(interviews.length, 4) - 1 ? 'border-b border-[var(--border)]' : ''} hover:bg-[var(--bg)] -mx-5 px-5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                          <CharacterAvatar
                            src={char?.icon48}
                            alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                            emoji={char?.emoji}
                            size={32}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-[var(--text)] mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                            {project.name || project.hp_url}
                          </div>
                          <div className="text-[12px] text-[var(--text3)]">
                            {char?.name ?? 'インタビュアー'}<span aria-hidden="true"> · </span>{formatShortDateTime(interview.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasSummary && <StatusPill tone="neutral">メモ</StatusPill>}
                          {hasArticle && <StatusPill tone="success">記事</StatusPill>}
                          {hasUncreatedThemes && <StatusPill tone="warning">未作成</StatusPill>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </>
  )
}

