import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/articles/[id]
 * ソフトデリート: article を論理削除する
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = crypto.randomUUID()
  const { id: articleId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '権限がありません', traceId },
      { status: 401 },
    )
  }

  // 自分の article であることを確認（project_id 経由で user_id を検証）
  const { data: article } = await supabase
    .from('articles')
    .select('id, project_id')
    .eq('id', articleId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!article) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '記事が見つかりません', traceId },
      { status: 404 },
    )
  }

  // project の所有者確認
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', article.project_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!project) {
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '権限がありません', traceId },
      { status: 403 },
    )
  }

  // article を論理削除
  const { error } = await supabase
    .from('articles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', articleId)

  if (error) {
    console.error('[DELETE /api/articles/[id]] error', { traceId, error: error.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '削除に失敗しました', traceId },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, traceId })
}
