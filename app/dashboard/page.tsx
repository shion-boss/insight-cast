import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ButtonLink, CharacterAvatar, InterviewerSpeech, PageHeader, SectionIntro, StateCard, StatusPill, SurfaceCard } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { buildArticleCountByInterview, getInterviewFlags, getInterviewManagementHref, type InterviewArticleRef } from '@/lib/interview-state'
import StartAnalysisButton from '@/components/start-analysis-button'
import { isProjectAnalysisReady } from '@/lib/analysis/project-readiness'
import AppHeaderActions from '@/components/app-header-actions'

type Project = {
  id: string
  name: string | null
  hp_url: string
  status: string
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
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

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, onboarded')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarded) redirect('/onboarding')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, hp_url, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const projectList = (projects ?? []) as Project[]
  const projectMap = Object.fromEntries(projectList.map((project) => [project.id, project]))

  const { data: auditRows } = projectList.length > 0
    ? await supabase
      .from('hp_audits')
      .select('id, project_id, raw_data, created_at')
      .in('project_id', projectList.map((project) => project.id))
    : { data: [] }

  const { data: competitorRows } = projectList.length > 0
    ? await supabase
      .from('competitors')
      .select('id, project_id, url')
      .in('project_id', projectList.map((project) => project.id))
    : { data: [] }

  const { data: competitorAnalysisRows } = projectList.length > 0
    ? await supabase
      .from('competitor_analyses')
      .select('project_id, competitor_id, raw_data')
      .in('project_id', projectList.map((project) => project.id))
    : { data: [] }

  const analysisReadyProjectIds = new Set(
    projectList
      .filter((project) => isProjectAnalysisReady({
        project,
        competitors: (competitorRows ?? []).filter((competitor) => competitor.project_id === project.id),
        audit: (auditRows ?? []).find((audit) => audit.project_id === project.id),
        competitorAnalyses: (competitorAnalysisRows ?? []).filter((row) => row.project_id === project.id),
      }).isReady)
      .map((project) => project.id),
  )

  let interviews: Interview[] = []
  const latestInterviewMap = new Map<string, Interview>()
  let articleInterviewIds = new Set<string>()
  let articleCountByInterview = new Map<string, number>()

  if (projectList.length > 0) {
    const { data: interviewRows } = await supabase
      .from('interviews')
      .select('id, project_id, interviewer_type, status, summary, themes, created_at')
      .in('project_id', projectList.map((project) => project.id))
      .order('created_at', { ascending: false })

    interviews = (interviewRows ?? []) as Interview[]

    for (const interview of interviews) {
      if (!latestInterviewMap.has(interview.project_id)) {
        latestInterviewMap.set(interview.project_id, interview)
      }
    }

    if (interviews.length > 0) {
      const { data: articles } = await supabase
        .from('articles')
        .select('interview_id')
        .in('interview_id', interviews.map((interview) => interview.id))

      const built = buildArticleCountByInterview((articles ?? []) as InterviewArticleRef[])
      articleInterviewIds = built.articleInterviewIds
      articleCountByInterview = built.articleCountByInterview
    }
  }

  const latestInterview = interviews[0] ?? null
  const latestInterviewProject = latestInterview ? projectMap[latestInterview.project_id] : null
  const latestInterviewFlags = latestInterview ? getInterviewFlags(latestInterview, articleCountByInterview) : null
  const latestInterviewHref = latestInterview
    ? getInterviewManagementHref(latestInterview, articleCountByInterview)
    : null
  const totalArticles = articleInterviewIds.size
  const projectCountLabel = `${projectList.length}件の取材先`
  const interviewCountLabel = `${interviews.length}件のインタビュー`
  const articleCountLabel = `${totalArticles}件の記事`
  const mint = getCharacter('mint')
  const nextProject = projectList[0] ?? null

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader
        title="ダッシュボード"
        right={(
          <AppHeaderActions active="dashboard" accountLabel={profile?.name ?? user.email ?? '設定'} />
        )}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <SurfaceCard tone="warm" className="rounded-[2.4rem]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">今日はどの取材を進めますか？</h1>
              <p className="mt-3 text-sm leading-relaxed text-stone-700">
                まずは次の一歩を決めやすいように、続きを開く場所と取材先ごとの準備を分けて置いています。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[projectCountLabel, interviewCountLabel, articleCountLabel].map((label) => (
                  <span key={label} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-stone-300">
                    {label}
                  </span>
                ))}
              </div>
            </div>

              <div className="flex w-full flex-col gap-3 lg:max-w-sm">
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <ButtonLink
                  href={nextProject ? `/projects/${nextProject.id}/interviewer` : '/projects/new'}
                  className="gap-2 whitespace-nowrap"
                >
                  <span className="text-base">+</span>
                  {nextProject ? 'インタビューを始める' : '最初の取材先を登録する'}
                </ButtonLink>
                <ButtonLink
                  href="/projects/new"
                  tone="secondary"
                  className="whitespace-nowrap"
                >
                  取材先を追加する
                </ButtonLink>
              </div>

              {latestInterview && latestInterviewProject && latestInterviewHref && (
                <Link
                  href={latestInterviewHref}
                  className="rounded-[1.8rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] p-4 backdrop-blur-sm transition-all duration-150 hover:border-stone-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                >
                  <p className="text-xs font-medium tracking-[0.16em] text-stone-400 uppercase">直近のつづき</p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {latestInterviewProject.name || latestInterviewProject.hp_url}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatDateTime(latestInterview.created_at)}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {latestInterviewFlags?.hasSummary && <StatusPill tone="neutral">取材メモあり</StatusPill>}
                      {latestInterviewFlags?.hasArticle && <StatusPill tone="success">記事あり</StatusPill>}
                      {latestInterviewFlags?.hasUncreatedThemes && <StatusPill tone="warning">未作成テーマあり</StatusPill>}
                    </div>
                    <span className="text-sm text-stone-400">→</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </SurfaceCard>

        {projectList.length === 0 ? (
          <div className="mt-8">
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
              <ButtonLink
                href="/projects/new"
              >
                最初の取材先を登録する
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <SectionIntro
                  eyebrow="Next Action"
                  title="最近のインタビュー"
                  description="まずは続きを開くものをここから選べます。"
                  className="max-w-md"
                />
                {interviews.length > 0 && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-stone-400 ring-1 ring-stone-200">
                    新しい順
                  </span>
                )}
              </div>

              {interviews.length === 0 ? (
                <StateCard
                  icon="📝"
                  title="まだインタビューは始まっていません。"
                  description="取材先を選んで、必要なタイミングでインタビューを始められます。"
                  align="left"
                  action={(
                    <ButtonLink href={`/projects/${projectList[0].id}/interviewer`}>
                      最初のインタビューを始める
                    </ButtonLink>
                  )}
                />
              ) : (
                <ul className="space-y-3">
                  {interviews.map((interview) => {
                    const project = projectMap[interview.project_id]
                    if (!project) return null

                    const char = getCharacter(interview.interviewer_type)
                    const { hasSummary, hasArticle, hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
                    const interviewHref = getInterviewManagementHref(interview, articleCountByInterview)

                    return (
                      <li key={interview.id}>
                        <Link
                          href={interviewHref}
                          className="block rounded-[1.8rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] p-5 backdrop-blur-sm transition-all duration-150 hover:border-stone-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                              <CharacterAvatar
                                src={char?.icon48}
                                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                                emoji={char?.emoji ?? '🎙️'}
                                size={44}
                                className="mt-0.5 border-amber-100 bg-amber-50"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-stone-950">
                                  {project.name || project.hp_url}
                                </p>
                                <p className="mt-1 text-xs text-stone-500">
                                  {formatDateTime(interview.created_at)} ・ {char?.name ?? 'インタビュアー'}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {hasSummary && <StatusPill tone="neutral">取材メモあり</StatusPill>}
                                  {hasArticle && <StatusPill tone="success">記事あり</StatusPill>}
                                  {hasUncreatedThemes && <StatusPill tone="warning">未作成テーマあり</StatusPill>}
                                </div>
                              </div>
                            </div>
                            <span className="mt-1 text-sm text-stone-400">→</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <aside className="space-y-4">
              <SurfaceCard className="p-5">
                <h2 className="text-sm font-semibold text-stone-950">取材先ごとの準備</h2>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  調査や管理を開く場所は右側にまとめました。インタビューの流れを邪魔しない置き方にしています。
                </p>
              </SurfaceCard>

              <ul className="space-y-3">
                {projectList.map((project) => (
                  <li key={project.id} className="rounded-[1.8rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] p-4 backdrop-blur-sm">
                    <div className="flex flex-col gap-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block min-w-0 rounded-[1.2rem] px-1 py-1 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-950">{project.name || project.hp_url}</p>
                            <p className="mt-1 text-xs text-stone-500">{formatDate(project.updated_at)} に更新</p>
                            {latestInterviewMap.has(project.id) && (
                              <p className="mt-2 text-xs text-stone-700">
                                直近の取材: {formatShortDateTime(latestInterviewMap.get(project.id)?.created_at ?? project.updated_at)}
                              </p>
                            )}
                          </div>
                          <span className="mt-0.5 flex-shrink-0 text-sm text-stone-400">→</span>
                        </div>
                      </Link>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {!analysisReadyProjectIds.has(project.id) || project.status === 'analysis_pending' ? (
                          <StartAnalysisButton
                            projectId={project.id}
                            projectName={project.name || project.hp_url}
                            compact
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-900/20 hover:bg-stone-50 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 sm:whitespace-nowrap"
                          />
                        ) : project.status === 'analyzing' ? (
                          <div className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 sm:whitespace-nowrap">
                            調査中
                          </div>
                        ) : (
                          <>
                            <Link
                              href={`/projects/${project.id}/report`}
                              prefetch={false}
                              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-900/20 hover:bg-stone-50 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 sm:whitespace-nowrap"
                            >
                              調査結果を見る
                            </Link>
                            <StartAnalysisButton
                              projectId={project.id}
                              projectName={project.name || project.hp_url}
                              compact
                              force
                              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-900/20 hover:bg-stone-50 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 sm:whitespace-nowrap"
                            />
                          </>
                        )}
                        <Link
                          href={`/projects/${project.id}/interviewer`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#111827,#1f2937)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#243041] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 sm:col-span-2 sm:whitespace-nowrap"
                        >
                          インタビューを始める
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
