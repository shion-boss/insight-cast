export const PAGE_SIZE = 5

export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const n = Number.parseInt(raw ?? '1', 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return n
}

// プロジェクトで使うクライアントは ssr / admin / supabase-js が混在するため、
// ここでは最小限のメソッド型のみ要求する。
type SBClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export type InterviewListRow = {
  id: string
  project_id: string
  interviewer_type: string
  status: string | null
  summary: string | null
  themes: string[] | null
  created_at: string
}

export async function fetchInterviewsPage(
  supabase: SBClient,
  projectId: string,
  page: number,
  perPage: number = PAGE_SIZE,
): Promise<{ rows: InterviewListRow[]; total: number }> {
  const offset = (page - 1) * perPage
  const [rowsResult, countResult] = await Promise.all([
    supabase
      .from('interviews')
      .select('id, project_id, interviewer_type, status, summary, themes, created_at')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1),
    supabase
      .from('interviews')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .is('deleted_at', null),
  ])
  const rows = (rowsResult.data as InterviewListRow[] | null) ?? []
  const total = countResult.count ?? 0
  return { rows, total }
}

export type ArticleListRow = {
  id: string
  interview_id: string | null
  article_type: string | null
  title: string | null
  created_at: string
}

export async function fetchArticlesPage(
  supabase: SBClient,
  projectId: string,
  page: number,
  perPage: number = PAGE_SIZE,
): Promise<{ rows: ArticleListRow[]; total: number }> {
  const offset = (page - 1) * perPage
  const [rowsResult, countResult] = await Promise.all([
    supabase
      .from('articles')
      .select('id, interview_id, article_type, title, created_at')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .is('deleted_at', null),
  ])
  const rows = (rowsResult.data as ArticleListRow[] | null) ?? []
  const total = countResult.count ?? 0
  return { rows, total }
}
