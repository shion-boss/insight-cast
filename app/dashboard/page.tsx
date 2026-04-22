export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ButtonLink, CharacterAvatar, InterviewerSpeech, StatusPill, getButtonClass } from '@/components/ui'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
import { getCharacter } from '@/lib/characters'
import { buildArticleCountByInterview, getInterviewFlags, getInterviewManagementHref, type InterviewArticleRef } from '@/lib/interview-state'
import { isProjectAnalysisReady } from '@/lib/analysis/project-readiness'
import { getProjectAnalysisBadge, getProjectContentBadge } from '@/lib/project-badges'

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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()


  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, hp_url, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const projectList = (projects ?? []) as Project[]
  const projectMap = Object.fromEntries(projectList.map((p) => [p.id, p]))

  const { data: auditRows } = projectList.length > 0
    ? await supabase
      .from('hp_audits')
      .select('id, project_id, raw_data, created_at')
      .in('project_id', projectList.map((p) => p.id))
      .order('created_at', { ascending: false })
    : { data: [] }

  const { data: competitorRows } = projectList.length > 0
    ? await supabase
      .from('competitors')
      .select('id, project_id, url')
      .in('project_id', projectList.map((p) => p.id))
    : { data: [] }

  const { data: competitorAnalysisRows } = projectList.length > 0
    ? await supabase
      .from('competitor_analyses')
      .select('project_id, competitor_id, raw_data')
      .in('project_id', projectList.map((p) => p.id))
    : { data: [] }

  const analysisReadyProjectIds = new Set(
    projectList
      .filter((p) => isProjectAnalysisReady({
        project: p,
        competitors: (competitorRows ?? []).filter((c) => c.project_id === p.id),
        audit: (auditRows ?? []).find((a) => a.project_id === p.id),
        competitorAnalyses: (competitorAnalysisRows ?? []).filter((r) => r.project_id === p.id),
      }).isReady)
      .map((p) => p.id),
  )

  let interviews: Interview[] = []
  const latestInterviewMap = new Map<string, Interview>()
  let articleCountByInterview = new Map<string, number>()
  const interviewCountByProject = new Map<string, number>()
  const articleCountByProject = new Map<string, number>()

  if (projectList.length > 0) {
    const { data: ivRows } = await supabase
      .from('interviews')
      .select('id, project_id, interviewer_type, status, summary, themes, created_at')
      .in('project_id', projectList.map((p) => p.id))
      .order('created_at', { ascending: false })

    interviews = (ivRows ?? []) as Interview[]

    for (const iv of interviews) {
      if (!latestInterviewMap.has(iv.project_id)) latestInterviewMap.set(iv.project_id, iv)
      interviewCountByProject.set(iv.project_id, (interviewCountByProject.get(iv.project_id) ?? 0) + 1)
    }
  }

  // Fetch articles with created_at for charts
  let allArticles: ArticleRow[] = []
  if (interviews.length > 0) {
    const { data: articleRows } = await supabase
      .from('articles')
      .select('id, interview_id, created_at')
      .in('interview_id', interviews.map((iv) => iv.id))
      .order('created_at', { ascending: false })

    allArticles = (articleRows ?? []) as ArticleRow[]
    const built = buildArticleCountByInterview(allArticles as InterviewArticleRef[])
    articleCountByInterview = built.articleCountByInterview

    for (const iv of interviews) {
      articleCountByProject.set(
        iv.project_id,
        (articleCountByProject.get(iv.project_id) ?? 0) + (articleCountByInterview.get(iv.id) ?? 0),
      )
    }
  }

  const totalArticles = allArticles.length

  // Previous-month deltas
  const now = new Date()
  const thisMonthKey = monthKey(now)
  const lastMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))

  const thisMonthInterviews = interviews.filter((iv) => iv.created_at.slice(0, 7) === thisMonthKey).length
  const lastMonthInterviews = interviews.filter((iv) => iv.created_at.slice(0, 7) === lastMonthKey).length
  const interviewDelta = thisMonthInterviews - lastMonthInterviews

  const thisMonthArticles = allArticles.filter((a) => a.created_at.slice(0, 7) === thisMonthKey).length
  const lastMonthArticles = allArticles.filter((a) => a.created_at.slice(0, 7) === lastMonthKey).length
  const articleDelta = thisMonthArticles - lastMonthArticles

  const thisMonthProjects = projectList.filter((p) => p.created_at.slice(0, 7) === thisMonthKey).length
  const lastMonthProjectCount = projectList.filter((p) => p.created_at.slice(0, 7) === lastMonthKey).length
  const projectDelta = thisMonthProjects - lastMonthProjectCount

  const mint = getCharacter('mint')
  const nextProject = projectList[0] ?? null

  const deltaLabel = (n: number) =>
    n === 0 ? '先月と同じ' : n > 0 ? `先月比 +${n}` : `先月比 ${n}`

  return (
    <AppShell
      title="ダッシュボード"
      active="dashboard"
      accountLabel={profile?.name ?? user.email ?? '設定'}
      isAdmin={checkIsAdmin(user.email)}
      headerRight={(
        <Link href="/projects/new" className={getButtonClass('primary', 'px-4 py-2.5 text-sm')}>
          + 取材先を追加
        </Link>
      )}
    >
      {/* ── Greeting bar ── */}
      <div
        className="mb-6 rounded-[var(--r-lg)] border border-[var(--border)] px-7 py-5 flex items-center justify-between gap-6"
        style={{ background: 'linear-gradient(135deg,var(--accent-l),var(--teal-l))' }}
      >
        <div>
          <div className="font-[family-name:var(--font-noto-serif-jp)] text-[20px] font-bold text-[var(--text)] mb-1.5">
            こんにちは、{profile?.name ?? 'ゲスト'}さん 👋
          </div>
          <div className="text-[13px] text-[var(--text2)]">
            今月の取材: <strong>{thisMonthInterviews} 回</strong>
            {totalArticles > 0 && <> · 累計記事素材 <strong>{totalArticles} 件</strong></>}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link
            href={nextProject ? `/projects/${nextProject.id}/interviewer` : '/projects/new'}
            className={getButtonClass('primary', 'text-[13px] px-4 py-2')}
          >
            次の取材を開く →
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { n: projectList.length,  l: '取材先',      delta: deltaLabel(projectDelta) },
          { n: interviews.length,   l: '完了した取材', delta: deltaLabel(interviewDelta) },
          { n: totalArticles,       l: '記事素材',    delta: deltaLabel(articleDelta) },
        ].map((stat) => (
          <div key={stat.l} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-[22px]">
            <div className="font-[family-name:var(--font-noto-serif-jp)] text-[34px] font-bold text-[var(--text)] leading-none">{stat.n}</div>
            <div className="text-[13px] text-[var(--text2)] mt-1.5">{stat.l}</div>
            <div className="text-[12px] mt-1 font-semibold" style={{ color: 'var(--teal)' }}>{stat.delta}</div>
          </div>
        ))}
      </div>

      {projectList.length === 0 ? (
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
            title="まだ取材先がありません。"
            description="最初の取材先を登録すると、ここにインタビュー履歴と取材先の管理が並びます。"
            tone="soft"
          />
          <div className="mt-4">
            <ButtonLink href="/projects/new">最初の取材先を登録する</ButtonLink>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* ── Quick actions ── */}
          {(() => {
            const mint = getCharacter('mint')
            const claus = getCharacter('claus')
            const rain = getCharacter('rain')
            return (
              <div className="grid grid-cols-3 gap-3">
                <Link
                  href="/projects/new"
                  className="bg-[var(--surface)] border-[1.5px] border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-5 flex flex-col items-center gap-2.5 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-l)]"
                >
                  <CharacterAvatar src={claus?.icon48} alt={claus?.name ?? 'クラウス'} emoji={claus?.emoji} size={40} />
                  <div className="text-[13px] font-semibold text-[var(--text2)]">取材先を追加する</div>
                </Link>
                <Link
                  href={nextProject ? `/projects/${nextProject.id}/interviewer` : '/projects/new'}
                  className="bg-[var(--surface)] border-[1.5px] border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-5 flex flex-col items-center gap-2.5 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-l)]"
                >
                  <CharacterAvatar src={mint?.icon48} alt={mint?.name ?? 'ミント'} emoji={mint?.emoji} size={40} />
                  <div className="text-[13px] font-semibold text-[var(--text2)]">取材画面を開く</div>
                </Link>
                <Link
                  href="/articles"
                  className="bg-[var(--surface)] border-[1.5px] border-dashed border-[var(--border)] rounded-[var(--r-lg)] p-5 flex flex-col items-center gap-2.5 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-l)]"
                >
                  <CharacterAvatar src={rain?.icon48} alt={rain?.name ?? 'レイン'} emoji={rain?.emoji} size={40} />
                  <div className="text-[13px] font-semibold text-[var(--text2)]">記事素材を確認する</div>
                </Link>
              </div>
            )
          })()}

          {/* ── Projects + Interviews ── */}
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-[18px] font-bold text-[var(--text)]">取材先一覧</h2>
                <Link href="/projects" className="text-[13px] text-[var(--accent)] font-semibold hover:underline">すべて見る →</Link>
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
                      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-5 flex items-center gap-4 transition-shadow hover:shadow-[0_4px_20px_var(--shadow,rgba(0,0,0,0.08))]"
                    >
                      <div className="w-11 h-11 rounded-[10px] bg-[var(--accent-l)] flex items-center justify-center flex-shrink-0">
                        <CharacterAvatar src={mint?.icon48} alt={mint?.name ?? 'ミント'} emoji={mint?.emoji} size={32} />
                      </div>
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
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-[18px] font-bold text-[var(--text)]">最近の取材</h2>
                <Link href="/interviews" className="text-[13px] text-[var(--accent)] font-semibold hover:underline">すべて見る →</Link>
              </div>
              {interviews.length === 0 ? (
                <InterviewerSpeech
                  icon={<CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'インタビュアー'}のアイコン`} emoji={mint?.emoji} size={48} />}
                  name={mint?.name ?? 'インタビュアー'}
                  title="まだインタビューは始まっていません。"
                  description="取材先を選んで、インタビューを始めましょう。"
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
                        className={`flex items-center gap-[14px] py-[14px] ${i < Math.min(interviews.length, 4) - 1 ? 'border-b border-[var(--border)]' : ''} hover:bg-[var(--bg)] -mx-5 px-5 rounded transition-colors`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                          <CharacterAvatar
                            src={char?.icon48}
                            alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                            emoji={char?.emoji ?? '🎙️'}
                            size={32}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-[var(--text)] mb-0.5">
                            {project.name || project.hp_url}
                          </div>
                          <div className="text-[12px] text-[var(--text3)]">
                            {char?.name ?? 'インタビュアー'} · {formatDate(interview.created_at)}
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
    </AppShell>
  )
}
