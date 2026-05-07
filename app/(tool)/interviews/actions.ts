'use server'

import { getCharacter } from '@/lib/characters'
import { buildArticleCountByInterview, getInterviewManagementHref, getInterviewThemeCount, type InterviewArticleRef } from '@/lib/interview-state'
import { createClient } from '@/lib/supabase/server'
import { INTERVIEWS_PAGE_SIZE, type InterviewItem } from './constants'

function formatDate(value: string) {
  const d = new Date(value)
  const datePart = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d).replace(/\//g, '.')
  const timePart = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${datePart} ${timePart}`
}

type InterviewFilters = {
  projectId?: string
  cast?: string
  status?: string
}

/**
 * 取材メモ一覧の追加チャンクをクライアントから取得するための server action。
 */
export async function loadMoreInterviews({
  cursor,
  projectId = 'all',
  cast = 'all',
  status = 'all',
}: { cursor: number } & InterviewFilters): Promise<{ items: InterviewItem[]; hasMore: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { items: [], hasMore: false }
  const userId = user.id

  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, name, hp_url, user_id')
    .is('deleted_at', null)
  const projects = projectRows ?? []
  const projectMap = new Map(projects.map((p) => [p.id as string, p]))
  const projectIds = projects.map((p) => p.id as string)
  if (projectIds.length === 0) return { items: [], hasMore: false }

  // viewer ロール判定
  const sharedProjectIds = projectIds.filter((id) => projectMap.get(id)?.user_id !== userId)
  const viewerProjectIds = new Set<string>()
  if (sharedProjectIds.length > 0) {
    const { data: memberRows } = await supabase
      .from('project_members')
      .select('project_id, role')
      .eq('user_id', userId)
      .in('project_id', sharedProjectIds)
    for (const row of memberRows ?? []) {
      if (row.role === 'viewer') viewerProjectIds.add(row.project_id as string)
    }
  }

  let query = supabase
    .from('interviews')
    .select('id, project_id, interviewer_type, status, summary, themes, article_status, created_at')
    .in('project_id', projectIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (projectId !== 'all') query = query.eq('project_id', projectId)
  if (cast !== 'all') query = query.eq('interviewer_type', cast)
  if (status === 'done') {
    // 完了: status='done' または status='completed' または summary が入っている
    query = query.or('status.eq.done,status.eq.completed,summary.not.is.null')
  } else if (status === 'in_progress') {
    // 途中: summary なし かつ status が 'done'/'completed' でない（null は含む）
    query = query
      .is('summary', null)
      .or('status.is.null,and(status.neq.done,status.neq.completed)')
  }

  const { data: interviewRows } = await query.range(cursor, cursor + INTERVIEWS_PAGE_SIZE - 1)
  const interviews = interviewRows ?? []
  if (interviews.length === 0) return { items: [], hasMore: false }

  const displayedIds = interviews.map((i) => i.id as string)
  const { data: articleRows } = await supabase
    .from('articles')
    .select('interview_id')
    .in('interview_id', displayedIds)
    .is('deleted_at', null)

  const { articleCountByInterview } = buildArticleCountByInterview((articleRows ?? []) as InterviewArticleRef[])

  const items: InterviewItem[] = interviews.map((interview) => {
    const project = projectMap.get(interview.project_id as string)
    const char = getCharacter(interview.interviewer_type as string)
    const articleCount = articleCountByInterview.get(interview.id as string) ?? 0
    const themeCount = getInterviewThemeCount((interview.themes ?? null) as string[] | null)
    const uncreatedThemeCount = Math.max(0, themeCount - articleCount)
    const hasSummary = Boolean(interview.summary || interview.status === 'completed')
    const href = getInterviewManagementHref(interview as Parameters<typeof getInterviewManagementHref>[0], articleCountByInterview)
    return {
      id: interview.id as string,
      projectId: interview.project_id as string,
      projectLabel: (project?.name as string | null) || (project?.hp_url as string | undefined) || '—',
      interviewerName: char?.name ?? 'インタビュアー',
      interviewerEmoji: char?.emoji ?? '🎙️',
      icon48: char?.icon48,
      isDone: interview.status === 'done' || hasSummary,
      articleCount,
      uncreatedThemeCount,
      createdAtLabel: formatDate(interview.created_at as string),
      href,
      canContinue: !viewerProjectIds.has(interview.project_id as string),
      isShared: project?.user_id !== userId,
    }
  })

  return { items, hasMore: items.length === INTERVIEWS_PAGE_SIZE }
}
