import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isProjectMember } from '@/lib/project-members'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/projects/[id]/gsc
 * 当該プロジェクトの GSC 接続状態を返す。
 * GSC 連携はプロジェクト単位なので、オーナー / editor / viewer 全員に同じ状態を見せる。
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // オーナー or メンバーかを確認
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const isOwner = project.user_id === user.id
  const hasMemberAccess = isOwner || (await isProjectMember(supabase, id, user.id))
  if (!hasMemberAccess) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // メンバーは gsc_connections に対する RLS を持たないので admin client で読む
  const adminSupabase = createAdminClient()
  const { data: connection } = await adminSupabase
    .from('gsc_connections')
    .select('site_url')
    .eq('project_id', id)
    .maybeSingle()

  if (!connection) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({ connected: true, site_url: connection.site_url })
}

/**
 * DELETE /api/projects/[id]/gsc
 * GSC 連携を解除する（gsc_connections から削除）。
 */
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext,
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // プロジェクトの所有権確認
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { error } = await supabase
    .from('gsc_connections')
    .delete()
    .eq('project_id', id)

  if (error) {
    console.error('[gsc delete]', error.message)
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
