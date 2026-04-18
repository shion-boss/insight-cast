import Link from 'next/link'
import { redirect } from 'next/navigation'

import AppHeaderActions from '@/components/app-header-actions'
import StartAnalysisButton from '@/components/start-analysis-button'
import { ButtonLink, PageHeader, StateCard, SurfaceCard, getButtonClass, getInteractivePanelClass, getPanelClass } from '@/components/ui'
import { isProjectAnalysisReady } from '@/lib/analysis/project-readiness'
import { createClient } from '@/lib/supabase/server'

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
  created_at: string
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

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const { data: interviewRows } = projectList.length > 0
    ? await supabase
      .from('interviews')
      .select('id, project_id, created_at')
      .in('project_id', projectList.map((project) => project.id))
      .order('created_at', { ascending: false })
    : { data: [] }

  const interviews = (interviewRows ?? []) as Interview[]
  const latestInterviewMap = new Map<string, Interview>()

  for (const interview of interviews) {
    if (!latestInterviewMap.has(interview.project_id)) {
      latestInterviewMap.set(interview.project_id, interview)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader
        title="取材先一覧"
        backHref="/dashboard"
        backLabel="← ダッシュボード"
        right={(
          <AppHeaderActions active="projects" accountLabel={profile?.name ?? user.email ?? '設定'} />
        )}
      />

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <SurfaceCard tone="warm" className="rounded-[2.2rem]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">Projects</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">登録した取材先をまとめて管理できます。</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
            ホームページ調査、取材の再開、記事作成の入口を取材先ごとに整理しています。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-stone-300">
              {projectList.length}件の取材先
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-stone-300">
              {interviews.length}件のインタビュー
            </span>
          </div>
        </SurfaceCard>

        {projectList.length === 0 ? (
          <StateCard
            icon="🏷️"
            title="まだ取材先はありません。"
            description="最初の取材先を登録すると、ここに調査やインタビューの導線が並びます。"
            align="left"
            action={(
              <ButtonLink href="/projects/new">
                最初の取材先を登録する
              </ButtonLink>
            )}
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {projectList.map((project) => {
              const latestInterview = latestInterviewMap.get(project.id)

              return (
                <li key={project.id} className={getPanelClass('p-5')}>
                  <div className="flex flex-col gap-4">
                    <Link
                      href={`/projects/${project.id}`}
                      className={getInteractivePanelClass('block rounded-[1.2rem] px-3 py-3')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-950">{project.name || project.hp_url}</p>
                          <p className="mt-1 text-xs text-stone-500">{formatDate(project.updated_at)} に更新</p>
                          {latestInterview && (
                            <p className="mt-2 text-xs text-stone-700">
                              直近の取材: {formatShortDateTime(latestInterview.created_at)}
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
                          className={getButtonClass('secondary', 'sm:whitespace-nowrap')}
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
                            className={getButtonClass('secondary', 'sm:whitespace-nowrap')}
                          >
                            調査結果を見る
                          </Link>
                          <StartAnalysisButton
                          projectId={project.id}
                          projectName={project.name || project.hp_url}
                          compact
                          force
                          className={getButtonClass('secondary', 'sm:whitespace-nowrap')}
                        />
                      </>
                    )}

                    <Link
                      href={`/projects/${project.id}/interviewer`}
                      className={getButtonClass('primary', 'sm:col-span-2 sm:whitespace-nowrap')}
                    >
                      インタビューを始める
                    </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
