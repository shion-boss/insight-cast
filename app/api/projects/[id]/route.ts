import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/projects/[id]
 * ソフトデリート: projects + 配下の interviews + articles を論理削除する
 */
export async function DELETE(
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

  // 自分のプロジェクトであることを確認
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!project) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '取材先が見つかりません', traceId },
      { status: 404 },
    )
  }

  const now = new Date().toISOString()

  // 連鎖論理削除: 配下の articles
  const { error: articlesError } = await supabase
    .from('articles')
    .update({ deleted_at: now })
    .eq('project_id', projectId)
    .is('deleted_at', null)

  if (articlesError) {
    console.error('[DELETE /api/projects/[id]] articles error', { traceId, error: articlesError.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '削除に失敗しました', traceId },
      { status: 500 },
    )
  }

  // 連鎖論理削除: 配下の interviews
  const { error: interviewsError } = await supabase
    .from('interviews')
    .update({ deleted_at: now })
    .eq('project_id', projectId)
    .is('deleted_at', null)

  if (interviewsError) {
    console.error('[DELETE /api/projects/[id]] interviews error', { traceId, error: interviewsError.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '削除に失敗しました', traceId },
      { status: 500 },
    )
  }

  // project 自身を論理削除
  const { error: projectError } = await supabase
    .from('projects')
    .update({ deleted_at: now })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (projectError) {
    console.error('[DELETE /api/projects/[id]] project error', { traceId, error: projectError.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '削除に失敗しました', traceId },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, traceId })
}
