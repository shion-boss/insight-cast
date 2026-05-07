'use server'

import { getCastName, getCharacter } from '@/lib/characters'
import { createClient } from '@/lib/supabase/server'
import { ARTICLES_PAGE_SIZE, type ArticleItem } from './constants'

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'ブログ記事',
  interviewer: 'レポート記事',
  conversation: '会話記事',
}

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

function buildExcerpt(content: string) {
  return content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 80)
}

type ArticleFilters = {
  projectId?: string
  articleType?: string
  interviewId?: string
  cast?: string
}

/**
 * 記事一覧の追加チャンクをクライアントから取得するための server action。
 * フィルタ条件 + cursor (offset) を受け取り、次の ARTICLES_PAGE_SIZE 件を返す。
 */
export async function loadMoreArticles({
  cursor,
  projectId = 'all',
  articleType = 'all',
  interviewId = 'all',
  cast = 'all',
}: { cursor: number } & ArticleFilters): Promise<{ items: ArticleItem[]; hasMore: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { items: [], hasMore: false }
  const userId = user.id

  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, name, hp_url, user_id')
    .is('deleted_at', null)
  const projectIds = (projectRows ?? []).map((p) => p.id)
  if (projectIds.length === 0) return { items: [], hasMore: false }

  let query = supabase
    .from('articles')
    .select('id, title, content, article_type, created_at, project_id, interview_id')
    .in('project_id', projectIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (projectId !== 'all') query = query.eq('project_id', projectId)
  if (articleType !== 'all') query = query.eq('article_type', articleType)
  if (interviewId !== 'all') query = query.eq('interview_id', interviewId)
  if (cast !== 'all') {
    const { data: castInterviews } = await supabase
      .from('interviews')
      .select('id')
      .in('project_id', projectIds)
      .eq('interviewer_type', cast)
      .is('deleted_at', null)
    const ids = (castInterviews ?? []).map((i) => i.id as string)
    if (ids.length === 0) return { items: [], hasMore: false }
    query = query.in('interview_id', ids)
  }

  const { data: articleRows } = await query.range(cursor, cursor + ARTICLES_PAGE_SIZE - 1)
  const articles = articleRows ?? []
  if (articles.length === 0) return { items: [], hasMore: false }

  // 表示中の記事に紐づく project / interview を取得
  const displayProjectIds = [...new Set(articles.map((a) => a.project_id))]
  const displayInterviewIds = [...new Set(
    articles.map((a) => a.interview_id).filter((id): id is string => Boolean(id))
  )]

  const [{ data: displayProjectRows }, { data: displayInterviewRows }] = await Promise.all([
    displayProjectIds.length > 0
      ? supabase.from('projects').select('id, name, hp_url, user_id').in('id', displayProjectIds).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    displayInterviewIds.length > 0
      ? supabase.from('interviews').select('id, interviewer_type, created_at').in('id', displayInterviewIds).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
  ])

  const projectMap = new Map((displayProjectRows ?? []).map((p) => [p.id as string, p]))
  const interviewMap = new Map((displayInterviewRows ?? []).map((i) => [i.id as string, i]))

  const items: ArticleItem[] = articles.map((article) => {
    const project = projectMap.get(article.project_id)
    const interview = article.interview_id ? interviewMap.get(article.interview_id) : null
    const interviewChar = interview ? getCharacter(interview.interviewer_type as string) : null
    return {
      id: article.id,
      title: article.title || '記事',
      excerpt: buildExcerpt(article.content),
      articleTypeLabel: ARTICLE_TYPE_LABEL[article.article_type ?? ''] ?? '記事',
      createdAtLabel: formatDate(article.created_at),
      detailHref: `/projects/${article.project_id}/articles/${article.id}`,
      projectLabel: (project?.name as string | null) || (project?.hp_url as string | undefined) || '—',
      interviewerLabel: interview
        ? getCastName(interview.interviewer_type as string)
        : '—',
      interviewerIcon48: interviewChar?.icon48,
      interviewerEmoji: interviewChar?.emoji,
      isShared: project?.user_id !== userId,
    }
  })

  return { items, hasMore: items.length === ARTICLES_PAGE_SIZE }
}
