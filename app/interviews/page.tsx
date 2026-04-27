export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
export const metadata: Metadata = { robots: { index: false, follow: false } }

import { redirect } from 'next/navigation'

import { ButtonLink, CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { AppShell, checkIsAdmin } from '@/components/app-shell'
import { InterviewsFilterClient } from '@/components/interviews-filter-client'
import { getCharacter, CHARACTERS } from '@/lib/characters'
import { buildArticleCountByInterview, getInterviewFlags, getInterviewManagementHref, type InterviewArticleRef } from '@/lib/interview-state'
import { getUserPlan } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

type Project = { id: string; name: string | null; hp_url: string }
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

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; projectId?: string; cast?: string; status?: string }>
}) {
  const { page: pageStr, projectId: projectIdParam = 'all', cast: castParam = 'all', status: statusParam = 'all' } = await searchParams

  const page = Math.max(1, Number(pageStr ?? '1'))
  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: profile }, { data: projectRows }, plan] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    supabase.from('projects').select('id, name, hp_url').eq('user_id', user.id),
    getUserPlan(supabase, user.id),
  ])

  const projects = (projectRows ?? []) as Project[]
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const projectIds = projects.map((p) => p.id)

  if (projectIds.length === 0) {
    const mint = getCharacter('mint')
    return (
      <AppShell title="取材メモ一覧" active="interviews" accountLabel={profile?.name ?? user.email ?? '設定'} isAdmin={checkIsAdmin(user.email)}>
        <InterviewerSpeech
          icon={<CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'インタビュアー'}のアイコン`} emoji={mint?.emoji} size={48} />}
          name={mint?.name ?? 'インタビュアー'}
          title="まだ取材の記録がありません。"
          description="インタビューを終えると、ここに取材ごとのメモと記事テーマが届きます。"
          tone="soft"
        />
        <div className="mt-4">
          <ButtonLink href="/projects/new">最初の取材先を登録する <span aria-hidden="true">→</span></ButtonLink>
        </div>
      </AppShell>
    )
  }

  // cast options（使用済みキャストの一覧）と filtered+paginated interviews を並列取得
  let interviewQuery = supabase
    .from('interviews')
    .select('id, project_id, interviewer_type, status, summary, themes, article_status, created_at', { count: 'exact' })
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  if (projectIdParam !== 'all') interviewQuery = interviewQuery.eq('project_id', projectIdParam)
  if (castParam !== 'all') interviewQuery = interviewQuery.eq('interviewer_type', castParam)
  if (statusParam === 'done') {
    interviewQuery = interviewQuery.or('status.eq.done,status.eq.completed,not.summary.is.null')
  } else if (statusParam === 'in_progress') {
    interviewQuery = interviewQuery.or('status.is.null,not.status.in.(done,completed)').is('summary', null)
  }

  const [
    { data: castTypeRows },
    { data: interviewRows, count: filteredCount },
  ] = await Promise.all([
    supabase.from('interviews').select('interviewer_type').in('project_id', projectIds),
    interviewQuery.range(start, end),
  ])

  const interviews = (interviewRows ?? []) as Interview[]
  const totalCount = filteredCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // 表示中の取材分だけ記事数を取得
  const displayedIds = interviews.map((i) => i.id)
  const { data: articleRows } = displayedIds.length > 0
    ? await supabase.from('articles').select('interview_id').in('interview_id', displayedIds)
    : { data: [] }

  const { articleCountByInterview } = buildArticleCountByInterview((articleRows ?? []) as InterviewArticleRef[])

  const items = interviews.map((interview) => {
    const project = projectMap.get(interview.project_id)
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
  })

  // 使用済みキャストの選択肢（ドロップダウン用）
  const usedCastTypes = [...new Set((castTypeRows ?? []).map((r) => r.interviewer_type))]
  const castOptions = CHARACTERS
    .filter((c) => usedCastTypes.includes(c.id))
    .map((c) => ({ type: c.id, name: c.name }))

  // キャストの取材件数（全件）をヘッダーバッジ用に取得
  const totalInterviewCount = castTypeRows?.length ?? 0

  if (totalInterviewCount === 0) {
    const mint = getCharacter('mint')
    return (
      <AppShell title="取材メモ一覧" active="interviews" accountLabel={profile?.name ?? user.email ?? '設定'} isAdmin={checkIsAdmin(user.email)}>
        <InterviewerSpeech
          icon={<CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'インタビュアー'}のアイコン`} emoji={mint?.emoji} size={48} />}
          name={mint?.name ?? 'インタビュアー'}
          title="まだ取材の記録がありません。"
          description="インタビューを終えると、ここに取材ごとのメモと記事テーマが届きます。"
          tone="soft"
        />
        <div className="mt-4">
          <ButtonLink href={`/projects/${projects[0].id}/interviewer`}>
            取材を始める <span aria-hidden="true">→</span>
          </ButtonLink>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="取材メモ一覧"
      active="interviews"
      accountLabel={profile?.name ?? user.email ?? '設定'}
      isAdmin={checkIsAdmin(user.email)}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text2)]">
          全 {totalInterviewCount} 件
        </span>
      </div>

      <InterviewsFilterClient
        items={items}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        projectOptions={projects.map((p) => ({ id: p.id, label: p.name || p.hp_url }))}
        castOptions={castOptions}
        alwaysShowProjectFilter={plan === 'business'}
      />
    </AppShell>
  )
}
