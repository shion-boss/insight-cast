import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './logout-button'
import { PageHeader, StateCard } from '@/components/ui'
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

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8 space-y-4">
          <StateCard
            icon="🎙️"
            title="インタビューを主役に進められるようにしました。"
            description="取材はその都度ここから始めて、自社HPや競合の調査は取材先ごとに別で見直せます。"
            align="left"
            tone="soft"
            action={(
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={projectList[0] ? `/projects/${projectList[0].id}/interviewer` : '/projects/new'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-800 px-5 py-3 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                >
                  <span className="text-base">+</span>
                  {projectList[0] ? '新しいインタビューを始める' : '最初の取材先を登録する'}
                </Link>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-5 py-3 text-sm text-stone-600 hover:bg-white hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                >
                  取材先を追加する
                </Link>
              </div>
            )}
          />
        </div>

        {projectList.length === 0 ? (
          <StateCard
            icon="🐱"
            title="まだ取材先がありません。"
            description="最初の取材先を登録すると、ここにインタビュー履歴が並びます。"
            action={(
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-5 py-3 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
              >
                最初の取材先を登録する
              </Link>
            )}
          />
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-stone-800">インタビュー一覧</h2>
                  <p className="text-xs text-stone-400 mt-1">実施日時が新しい順に並びます。</p>
                </div>
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

                    return (
                      <li key={interview.id}>
                        <Link
                          href={interviewState.href}
                          className="flex items-center justify-between gap-4 rounded-xl border border-stone-100 bg-white p-4 hover:border-stone-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-800">
                              {formatDateTime(interview.created_at)}
                            </p>
                            <p className="mt-1 text-xs text-stone-500 truncate">
                              {project.name || project.hp_url}
                            </p>
                            <p className="mt-1 text-xs text-stone-400">
                              {char?.name ?? 'インタビュアー'}が担当
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-2 py-1 text-xs ${interviewState.color}`}>
                              {interviewState.label}
                            </span>
                            <span className="text-sm text-stone-300">→</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-medium text-stone-800">取材先ごとの準備</h2>
                <p className="text-xs text-stone-400 mt-1">自社HPの確認や競合比較は、必要なときだけ別で見直せます。</p>
              </div>

              <ul className="space-y-3">
                {projectList.map((project) => (
                  <li key={project.id} className="rounded-xl border border-stone-100 bg-white p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800">{project.name || project.hp_url}</p>
                        <p className="mt-1 text-xs text-stone-400">{formatDate(project.updated_at)} に更新</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
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
                          調査を見る
                        </Link>
                        <Link
                          href={`/projects/${project.id}/interviewer`}
                          className="inline-flex items-center justify-center rounded-xl bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors"
                        >
                          新しいインタビュー
                        </Link>
                      </div>
                    </div>
                    {latestInterviewMap[project.id] && (
                      <p className="mt-3 text-xs text-stone-400">
                        直近の取材: {formatDateTime(interviews.find((interview) => interview.id === latestInterviewMap[project.id])?.created_at ?? project.updated_at)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
