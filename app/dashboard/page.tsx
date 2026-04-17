import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './logout-button'
import { CharacterAvatar, DevAiLabel, InterviewerSpeech, PageHeader, StateCard } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

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
      href: `/projects/${interview.project_id}/article?interviewId=${interview.id}`,
    }
  }

  if (interview.summary || interview.status === 'completed') {
    return {
      label: '取材メモを見る',
      color: 'bg-stone-100 text-stone-500',
      href: `/projects/${interview.project_id}/summary?interviewId=${interview.id}`,
    }
  }

  return {
    label: '取材中',
    color: 'bg-blue-50 text-blue-600',
    href: `/projects/${interview.project_id}/interview?interviewId=${interview.id}`,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, onboarded')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, hp_url, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const projectList = (projects ?? []) as Project[]
  const projectMap = Object.fromEntries(projectList.map((project) => [project.id, project]))

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

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader
        title="Insight Cast"
        right={(
          <div className="flex items-center gap-4">
            <Link href="/settings" className="rounded-md text-sm text-stone-500 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors">
              {profile?.name ?? user.email}
            </Link>
            <form action={signOut}>
              <LogoutButton />
            </form>
          </div>
        )}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="rounded-[28px] border border-stone-200 bg-gradient-to-br from-amber-50 via-white to-stone-100 p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">Dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold text-stone-800">今日はどの取材を進めますか？</h1>
              <p className="mt-3 text-sm leading-relaxed text-stone-500">
                直近のインタビューを上で追いかけながら、取材先ごとの準備や調査は右側から必要なときだけ開けます。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[projectCountLabel, interviewCountLabel, articleCountLabel].map((label) => (
                  <span key={label} className="rounded-full bg-white/80 px-3 py-1 text-xs text-stone-500 ring-1 ring-stone-200">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:max-w-sm">
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href={projectList[0] ? `/projects/${projectList[0].id}/interviewer` : '/projects/new'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-800 px-5 py-4 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                >
                  <span className="text-base">+</span>
                  {projectList[0] ? '新しいインタビューを始める' : '最初の取材先を登録する'}
                </Link>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                >
                  取材先を追加する
                </Link>
              </div>

              {latestInterview && latestInterviewProject && latestInterviewState && (
                <Link
                  href={latestInterviewState.href}
                  className="rounded-2xl border border-stone-200 bg-white/90 p-4 hover:border-stone-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                >
                  <p className="text-xs text-stone-400">直近のつづき</p>
                  <p className="mt-1 text-sm font-medium text-stone-800">
                    {latestInterviewProject.name || latestInterviewProject.hp_url}
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    {formatDateTime(latestInterview.created_at)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-1 text-xs ${latestInterviewState.color}`}>
                      {latestInterviewState.label}
                    </span>
                    <span className="text-sm text-stone-300">→</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>

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
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-5 py-3 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
              >
                最初の取材先を登録する
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-stone-800">最近のインタビュー</h2>
                  <p className="mt-1 text-xs text-stone-400">続きを開くものを左側にまとめました。</p>
                </div>
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
                    <Link
                      href={`/projects/${projectList[0].id}/interviewer`}
                      className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-5 py-3 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                    >
                      最初のインタビューを始める
                    </Link>
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
                          className="block rounded-2xl border border-stone-100 bg-white p-5 hover:border-stone-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
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
                                <p className="text-sm font-medium text-stone-800">
                                  {project.name || project.hp_url}
                                </p>
                                <p className="mt-1 text-xs text-stone-400">
                                  {formatDateTime(interview.created_at)} ・ {char?.name ?? 'インタビュアー'}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className={`rounded-full px-2 py-1 text-xs ${interviewState.color}`}>
                                    {interviewState.label}
                                  </span>
                                  <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-500">
                                    {hasArticle ? '記事あり' : '記事なし'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="mt-1 text-sm text-stone-300">→</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-stone-100 bg-white p-5">
                <h2 className="text-sm font-medium text-stone-800">取材先ごとの準備</h2>
                <p className="mt-1 text-xs leading-relaxed text-stone-400">
                  調査や管理を開く場所は右側にまとめました。インタビューの流れを邪魔しない置き方にしています。
                </p>
              </div>

              <ul className="space-y-3">
                {projectList.map((project) => (
                  <li key={project.id} className="rounded-2xl border border-stone-100 bg-white p-4">
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800">{project.name || project.hp_url}</p>
                        <p className="mt-1 text-xs text-stone-400">{formatDate(project.updated_at)} に更新</p>
                        {latestInterviewMap[project.id] && (
                          <p className="mt-2 text-xs text-stone-500">
                            直近の取材: {formatShortDateTime(interviews.find((interview) => interview.id === latestInterviewMap[project.id])?.created_at ?? project.updated_at)}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                        >
                          管理を見る
                        </Link>
                        <Link
                          href={`/projects/${project.id}/report`}
                          className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                        >
                          <DevAiLabel>調査を見る</DevAiLabel>
                        </Link>
                        <Link
                          href={`/projects/${project.id}/interviewer`}
                          className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                        >
                          新しいインタビュー
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
