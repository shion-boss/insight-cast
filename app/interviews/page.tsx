import Link from 'next/link'
import { redirect } from 'next/navigation'

import AppHeaderActions from '@/components/app-header-actions'
import { ButtonLink, CharacterAvatar, PageHeader, StateCard, StatusPill, SurfaceCard } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { buildArticleCountByInterview, getInterviewFlags, getInterviewManagementHref, type InterviewArticleRef } from '@/lib/interview-state'
import { createClient } from '@/lib/supabase/server'

type Project = {
  id: string
  name: string | null
  hp_url: string
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

export default async function InterviewsPage() {
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

  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, name, hp_url')
    .eq('user_id', user.id)

  const projects = (projectRows ?? []) as Project[]
  const projectMap = new Map(projects.map((project) => [project.id, project]))

  const { data: interviewRows } = projects.length > 0
    ? await supabase
      .from('interviews')
      .select('id, project_id, interviewer_type, status, summary, themes, created_at')
      .in('project_id', projects.map((project) => project.id))
      .order('created_at', { ascending: false })
    : { data: [] }

  const interviews = (interviewRows ?? []) as Interview[]

  const { data: articleRows } = interviews.length > 0
    ? await supabase
      .from('articles')
      .select('interview_id')
      .in('interview_id', interviews.map((interview) => interview.id))
    : { data: [] }

  const { articleInterviewIds, articleCountByInterview } = buildArticleCountByInterview((articleRows ?? []) as InterviewArticleRef[])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader
        title="インタビュー履歴"
        backHref="/dashboard"
        backLabel="← ダッシュボード"
        right={(
          <AppHeaderActions active="interviews" accountLabel={profile?.name ?? user.email ?? '設定'} />
        )}
      />

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <SurfaceCard tone="warm" className="rounded-[2.2rem]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">Interviews</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">これまでのインタビューを時系列で見返せます。</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
            取材メモに戻る、記事化へ進む、途中の会話を再開する、といった動線をまとめています。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-stone-300">
              {interviews.length}件のインタビュー
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-stone-300">
              {articleInterviewIds.size}件の記事化
            </span>
          </div>
        </SurfaceCard>

        {interviews.length === 0 ? (
          <StateCard
            icon="🎙️"
            title="まだインタビュー履歴はありません。"
            description="取材先を登録してインタビューを始めると、ここに履歴が並びます。"
            align="left"
            action={(
              <ButtonLink href={projects[0] ? `/projects/${projects[0].id}/interviewer` : '/projects/new'}>
                {projects[0] ? '最初のインタビューを始める' : '最初の取材先を登録する'}
              </ButtonLink>
            )}
          />
        ) : (
          <ul className="space-y-4">
            {interviews.map((interview) => {
              const project = projectMap.get(interview.project_id)
              if (!project) return null

              const char = getCharacter(interview.interviewer_type)
              const { hasSummary, hasArticle, hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
              const href = getInterviewManagementHref(interview, articleCountByInterview)

              return (
                <li key={interview.id}>
                  <Link
                    href={href}
                    className="block rounded-[1.8rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] p-5 backdrop-blur-sm transition-colors hover:border-stone-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
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
      </main>
    </div>
  )
}
