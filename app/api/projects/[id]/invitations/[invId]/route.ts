import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/projects/[id]/invitations/[invId]
 * 保留中の招待をキャンセルする（オーナーのみ、未承諾の招待のみ削除可能）
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; invId: string }> },
) {
  const { id: projectId, invId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // オーナー確認
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project) return new Response('Not found', { status: 404 })
  if (project.user_id !== user.id) return new Response('Forbidden', { status: 403 })

  // project_invitations に anon ポリシーがないため adminSupabase を使用
  const adminSupabase = createAdminClient()

  const { data: inv } = await adminSupabase
    .from('project_invitations')
    .select('id, accepted')
    .eq('id', invId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (!inv) return new Response('Not found', { status: 404 })

  // 承諾済みの招待は削除不可（メンバー削除は /members/[uid] DELETE で行う）
  if (inv.accepted) {
    return NextResponse.json(
      { error: 'already_accepted', message: '承諾済みの招待はキャンセルできません。メンバー削除から操作してください。' },
      { status: 400 },
    )
  }

  const { error } = await adminSupabase
    .from('project_invitations')
    .delete()
    .eq('id', invId)
    .eq('project_id', projectId)

  if (error) {
    console.error('[invitations/DELETE] delete error:', error.message)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
