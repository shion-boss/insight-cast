import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './logout-button'
import { ButtonLink, CharacterAvatar, InterviewerSpeech, PageHeader, SectionIntro, StateCard, StatusPill, SurfaceCard } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import StartAnalysisButton from '@/components/start-analysis-button'
import { isProjectAnalysisReady } from '@/lib/analysis/project-readiness'

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

function getInterviewState(interview: Interview, hasArticle: boolean) {
  if (hasArticle) {
    return {
      label: '記事作成へ',
      color: 'bg-green-50 text-green-600',
      href: `/projects/${interview.project_id}/article?interviewId=${interview.id}&from=dashboard`,
    }
  }

  if (interview.summary || interview.status === 'completed') {
    return {
      label: '取材メモを見る',
      color: 'bg-stone-100 text-stone-500',
      href: `/projects/${interview.project_id}/summary?interviewId=${interview.id}&from=dashboard`,
    }
  }

  return {
    label: '取材中',
    color: 'bg-blue-50 text-blue-600',
    href: `/projects/${interview.project_id}/interview?interviewId=${interview.id}&from=dashboard`,
  }
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
  const latestInterviewMap: Record<string, string> = {}
  const articleInterviewIds = new Set<string>()

  if (projectList.length > 0) {
    const { data: interviewRows } = await supabase
      .from('interviews')
      .select('id, project_id, interviewer_type, status, summary, created_at')
      .in('project_id', projectList.map((project) => project.id))
      .order('created_at', { ascending: false })

    interviews = (interviewRows ?? []) as Interview[]

    for (const interview of interviews) {
      if (!latestInterviewMap[interview.project_id]) {
        latestInterviewMap[interview.project_id] = interview.id
      }
    }

    if (interviews.length > 0) {
      const { data: articles } = await supabase
        .from('articles')
        .select('interview_id')
        .in('interview_id', interviews.map((interview) => interview.id))

      for (const article of articles ?? []) {
        if (article.interview_id) articleInterviewIds.add(article.interview_id)
      }
    }
  }

  const latestInterview = interviews[0] ?? null
  const latestInterviewProject = latestInterview ? projectMap[latestInterview.project_id] : null
  const latestInterviewState = latestInterview ? getInterviewState(latestInterview, articleInterviewIds.has(latestInterview.id)) : null
  const totalArticles = articleInterviewIds.size
  const projectCountLabel = `${projectList.length}件の取材先`
  const interviewCountLabel = `${interviews.length}件のインタビュー`
  const articleCountLabel = `${totalArticles}件の記事`
  const mint = getCharacter('mint')
  const nextProject = projectList[0] ?? null

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_22%),radial-gradient(circle_at_85%_10%,rgba(15,118,110,0.08),transparent_16%),linear-gradient(180deg,_#f2e9dc_0%,_#f7f1e7_36%,_#f5efe6_100%)]">
      <PageHeader
        title="ダッシュボード"
        right={(
          <div className="flex items-center gap-4">
            <Link href="/articles" className="hidden rounded-md text-sm font-medium text-stone-700 transition-colors hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 sm:inline-block">
              記事一覧
            </Link>
            <Link href="/settings" className="rounded-md text-sm font-medium text-stone-700 transition-colors hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">
              {profile?.name ?? user.email}
            </Link>
            <form action={signOut}>
              <LogoutButton />
            </form>
          </div>
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

              {latestInterview && latestInterviewProject && latestInterviewState && (
                <Link
                  href={latestInterviewState.href}
                  className="rounded-[1.8rem] border border-stone-300 bg-white p-4 transition-colors hover:border-stone-900/20 hover:bg-stone-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                >
                  <p className="text-xs font-medium tracking-[0.16em] text-stone-400 uppercase">直近のつづき</p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {latestInterviewProject.name || latestInterviewProject.hp_url}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatDateTime(latestInterview.created_at)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs ${latestInterviewState.color}`}>
                      {latestInterviewState.label}
                    </span>
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
                    const interviewState = getInterviewState(interview, articleInterviewIds.has(interview.id))
                    const hasArticle = articleInterviewIds.has(interview.id)

                    return (
                      <li key={interview.id}>
                        <Link
                          href={interviewState.href}
                          className="block rounded-[1.8rem] border border-stone-300 bg-white p-5 transition-colors hover:border-stone-900/20 hover:bg-stone-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
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
                                  <StatusPill tone={hasArticle ? 'success' : interview.summary || interview.status === 'completed' ? 'neutral' : 'info'}>
                                    {interviewState.label}
                                  </StatusPill>
                                  <StatusPill tone="neutral">{hasArticle ? '記事あり' : '記事なし'}</StatusPill>
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
                  <li key={project.id} className="rounded-[1.8rem] border border-stone-300 bg-white p-4">
                    <div className="flex flex-col gap-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block min-w-0 rounded-[1.2rem] px-1 py-1 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-950">{project.name || project.hp_url}</p>
                            <p className="mt-1 text-xs text-stone-500">{formatDate(project.updated_at)} に更新</p>
                            {latestInterviewMap[project.id] && (
                              <p className="mt-2 text-xs text-stone-700">
                                直近の取材: {formatShortDateTime(interviews.find((interview) => interview.id === latestInterviewMap[project.id])?.created_at ?? project.updated_at)}
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
