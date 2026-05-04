import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const PatchSchema = z.object({
  role: z.enum(['editor', 'viewer']),
})

/**
 * PATCH /api/projects/[id]/members/[uid]
 * メンバーの role 変更（オーナーのみ）
 *
 * オーナー確認後は admin client で更新する。RLS の USING 条件で 0 行更新になり
 * 「成功扱いだけど反映されない」サイレント失敗を避けるため。
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  const { id: projectId, uid } = await params
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

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }
  const { role } = parsed.data

  // admin client で実行（オーナー確認済みのため安全）
  const adminSupabase = createAdminClient()
  const { data: updated, error } = await adminSupabase
    .from('project_members')
    .update({ role })
    .eq('project_id', projectId)
    .eq('user_id', uid)
    .select('id')

  if (error) {
    console.error('[members/PATCH] update error:', error.message)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'member_not_found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/projects/[id]/members/[uid]
 * メンバー削除（オーナーのみ）
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  const { id: projectId, uid } = await params
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

  // admin client で実行（オーナー確認済みのため安全）
  const adminSupabase = createAdminClient()
  const { data: deleted, error } = await adminSupabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', uid)
    .select('id')

  if (error) {
    console.error('[members/DELETE] delete error:', error.message)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: 'member_not_found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
