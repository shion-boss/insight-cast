import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/interviews/[id]/respondent
 * 取材に答えたアカウントの表示名・アバターURLを返す。
 * profiles の RLS は own-only なので admin client で読む。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: interviewId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // RLS で見えるなら取得できる（プロジェクトオーナー・メンバー共通）
  const { data: interview } = await supabase
    .from('interviews')
    .select('interviewee_user_id, external_respondent_name, project_id')
    .eq('id', interviewId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!interview) {
    return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  }

  // 外部取材は名前のみ（avatar なし）
  if (interview.external_respondent_name) {
    return NextResponse.json({ name: interview.external_respondent_name, avatarUrl: null })
  }

  // interviewee_user_id がなければ project owner にフォールバック
  let userId = interview.interviewee_user_id
  if (!userId) {
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', interview.project_id)
      .maybeSingle()
    userId = project?.user_id ?? null
  }

  if (!userId) {
    return NextResponse.json({ name: null, avatarUrl: null })
  }

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  return NextResponse.json({
    name: profile?.name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  })
}
