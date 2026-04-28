import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/interviews/[id]/restore
 * 論理削除された取材記録を復元する（deleted_at を NULL に戻す）
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = crypto.randomUUID()
  const { id: interviewId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '権限がありません', traceId },
      { status: 401 },
    )
  }

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, project_id')
    .eq('id', interviewId)
    .not('deleted_at', 'is', null)
    .maybeSingle()

  if (!interview) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '取材記録が見つかりません', traceId },
      { status: 404 },
    )
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', interview.project_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!project) {
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '権限がありません', traceId },
      { status: 403 },
    )
  }

  const { error } = await supabase
    .from('interviews')
    .update({ deleted_at: null })
    .eq('id', interviewId)

  if (error) {
    console.error('[POST /api/interviews/[id]/restore] error', { traceId, error: error.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '復元に失敗しました', traceId },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, traceId })
}
