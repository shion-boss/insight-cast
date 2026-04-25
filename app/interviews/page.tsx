export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { ButtonLink, CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
import { InterviewsFilterClient } from '@/components/interviews-filter-client'
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

  // auth+profile と projects を並列取得
  const [{ data: profile }, { data: projectRows }] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    supabase.from('projects').select('id, name, hp_url').eq('user_id', user.id),
  ])

  const projects = (projectRows ?? []) as Project[]
  const projectMap = new Map(projects.map((project) => [project.id, project]))

  // interviews と articles はprojectsに依存するが互いに独立 → 2段階並列
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
      title="取材履歴"
      active="interviews"
      accountLabel={profile?.name ?? user.email ?? '設定'}
      isAdmin={checkIsAdmin(user.email)}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text2)]">
            {interviews.length} 件
          </span>
          <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text2)]">
            記事化 {articleInterviewIds.size} 件
          </span>
        </div>
      </div>

      {interviews.length === 0 ? (
        (() => {
          const mint = getCharacter('mint')
          return (
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
                title="まだ取材の記録がありません。"
                description="インタビューを終えると、ここに取材ごとのメモと記事テーマが届きます。"
                tone="soft"
              />
              <div className="mt-4">
                <ButtonLink href={projects[0] ? `/projects/${projects[0].id}/interviewer` : '/projects/new'}>
                  {projects[0] ? 'AIキャストを呼んで取材を始める →' : '最初の取材先を登録する →'}
                </ButtonLink>
              </div>
            </>
          )
        })()
      ) : (
        <InterviewsFilterClient
          items={interviews.map((interview) => {
            const project = projectMap.get(interview.project_id)!
            const char = getCharacter(interview.interviewer_type)
            const { hasSummary, hasArticle, hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
            const href = getInterviewManagementHref(interview, articleCountByInterview)
            return {
              id: interview.id,
              projectId: interview.project_id,
              projectLabel: project?.name || project?.hp_url || '—',
              interviewerName: char?.name ?? 'インタビュアー',
              interviewerEmoji: char?.emoji ?? '🎙️',
              icon48: char?.icon48,
              isDone: interview.status === 'done' || hasSummary,
              hasSummary,
              hasArticle,
              hasUncreatedThemes,
              articleStatus: interview.article_status,
              articleCount: articleCountByInterview.get(interview.id) ?? 0,
              createdAtLabel: formatDate(interview.created_at),
              href,
            }
          })}
        />
      )}
    </AppShell>
  )
}
