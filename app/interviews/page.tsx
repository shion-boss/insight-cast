export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ButtonLink, CharacterAvatar, StateCard } from '@/components/ui'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
import InterviewStatusPills from '@/components/interview-status-pills'
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
  article_status: string | null
  created_at: string
}

function formatDate(value: string) {
  const d = new Date(value)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
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
      .select('id, project_id, interviewer_type, status, summary, themes, article_status, created_at')
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
    <AppShell
      title="取材メモ一覧"
      active="interviews"
      accountLabel={profile?.name ?? user.email ?? '設定'}
      isAdmin={checkIsAdmin(user.email)}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">Interview Memos</p>
          <h1 className="mt-1 font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]">取材メモ一覧</h1>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text2)]">
            {interviews.length}件
          </span>
          <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text2)]">
            記事化 {articleInterviewIds.size}件
          </span>
        </div>
      </div>

      {interviews.length === 0 ? (
        <StateCard
          icon="🎙️"
          title="まだ取材メモはありません。"
          description="取材先を登録して取材を始めると、ここにメモが並びます。"
          align="left"
          action={(
            <ButtonLink href={projects[0] ? `/projects/${projects[0].id}/interviewer` : '/projects/new'}>
              {projects[0] ? '最初のインタビューを始める' : '最初の取材先を登録する'}
            </ButtonLink>
          )}
        />
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => {
            const project = projectMap.get(interview.project_id)
            if (!project) return null

            const char = getCharacter(interview.interviewer_type)
            const { hasSummary, hasArticle, hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
            const href = getInterviewManagementHref(interview, articleCountByInterview)
            const articleCount = articleCountByInterview.get(interview.id) ?? 0
            const isDone = interview.status === 'done' || hasSummary

            return (
              <Link
                key={interview.id}
                href={href}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 grid grid-cols-[48px_1fr_auto] gap-4 items-start hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-shadow block"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--bg2)]">
                  <CharacterAvatar
                    src={char?.icon48}
                    alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                    emoji={char?.emoji ?? '🎙️'}
                    size={48}
                    className="bg-amber-50"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-base leading-[1.3]">
                      {project.name || project.hp_url}
                    </p>
                    {isDone ? (
                      <span className="bg-[var(--ok-l)] text-[var(--ok)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">完了</span>
                    ) : (
                      <span className="bg-[var(--warn-l)] text-[var(--warn)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">途中</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text2)] mb-3">
                    {char?.name ?? 'インタビュアー'} · {formatDate(interview.created_at)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <InterviewStatusPills
                      interviewId={interview.id}
                      hasSummary={hasSummary}
                      hasArticle={hasArticle}
                      hasUncreatedThemes={hasUncreatedThemes}
                      articleStatus={interview.article_status}
                      summaryLabel="取材メモあり"
                      articleLabel="記事あり"
                      creatingLabel="作成中"
                      uncreatedLabel="未作成テーマあり"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs text-[var(--text3)]">記事素材 {articleCount}本</p>
                  {isDone ? (
                    <span className="border border-[var(--border)] text-[var(--text2)] text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">
                      メモを見る →
                    </span>
                  ) : (
                    <span className="bg-[var(--accent)] text-white text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">
                      続きを取材する →
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
