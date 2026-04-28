import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/projects/[id]/restore
 * 論理削除されたプロジェクトを復元する（deleted_at を NULL に戻す）
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = crypto.randomUUID()
  const { id: projectId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '権限がありません', traceId },
      { status: 401 },
    )
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .maybeSingle()

  if (!project) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '取材先が見つかりません', traceId },
      { status: 404 },
    )
  }

  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: null })
    .eq('id', projectId)

  if (error) {
    console.error('[POST /api/projects/[id]/restore] error', { traceId, error: error.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '復元に失敗しました', traceId },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, traceId })
}
