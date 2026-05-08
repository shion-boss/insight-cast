// 取材先（人物）ライブラリ
// プロジェクト単位で管理する。法人プランで外部取材リンクの再会機能を支える。

export type Interviewee = {
  id: string
  project_id: string
  name: string
  industry: string | null
  role: string | null
  notes: string | null
  linked_user_id: string | null
  created_at: string
  updated_at: string
}

export type IntervieweeWithStats = Interviewee & {
  interview_count: number
  article_count: number
  last_interview_at: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SBClient = { from: (table: string) => any }

/**
 * (project_id, name) で既存取材先を探し、無ければ作る。
 * 名前空白なら null を返す（取材先未設定として扱う）。
 */
export async function findOrCreateIntervieweeByName(
  supabase: SBClient,
  projectId: string,
  name: string | null | undefined,
  options?: { industry?: string | null; linkedUserId?: string | null },
): Promise<{ id: string; name: string } | null> {
  if (!name || !name.trim()) return null
  const trimmedName = name.trim()
  const trimmedIndustry = options?.industry?.trim() || null

  // 既存を検索（ソフトデリート除外）
  const { data: existing } = await supabase
    .from('interviewees')
    .select('id, name')
    .eq('project_id', projectId)
    .eq('name', trimmedName)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    return { id: existing.id as string, name: existing.name as string }
  }

  // 新規作成
  const { data: created, error } = await supabase
    .from('interviewees')
    .insert({
      project_id: projectId,
      name: trimmedName,
      industry: trimmedIndustry,
      linked_user_id: options?.linkedUserId ?? null,
    })
    .select('id, name')
    .single()

  if (error || !created) return null
  return { id: created.id as string, name: created.name as string }
}
