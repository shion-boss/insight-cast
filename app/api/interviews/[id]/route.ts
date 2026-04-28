import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/interviews/[id]
 * ソフトデリート: interview + 配下の articles を論理削除する
 */
export async function DELETE(
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

  // 自分の interview であることを確認（project_id 経由で user_id を検証）
  const { data: interview } = await supabase
    .from('interviews')
    .select('id, project_id')
    .eq('id', interviewId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!interview) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '取材記録が見つかりません', traceId },
      { status: 404 },
    )
  }

  // project の所有者確認
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

  const now = new Date().toISOString()

  // 連鎖論理削除: 配下の articles
  const { error: articlesError } = await supabase
    .from('articles')
    .update({ deleted_at: now })
    .eq('interview_id', interviewId)
    .is('deleted_at', null)

  if (articlesError) {
    console.error('[DELETE /api/interviews/[id]] articles error', { traceId, error: articlesError.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '削除に失敗しました', traceId },
      { status: 500 },
    )
  }

  // interview 自身を論理削除
  const { error: interviewError } = await supabase
    .from('interviews')
    .update({ deleted_at: now })
    .eq('id', interviewId)

  if (interviewError) {
    console.error('[DELETE /api/interviews/[id]] interview error', { traceId, error: interviewError.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '削除に失敗しました', traceId },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, traceId })
}
