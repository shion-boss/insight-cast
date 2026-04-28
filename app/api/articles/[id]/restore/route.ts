import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/articles/[id]/restore
 * 論理削除された記事を復元する（deleted_at を NULL に戻す）
 */
export async function POST(
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

  const { data: article } = await supabase
    .from('articles')
    .select('id, project_id')
    .eq('id', articleId)
    .not('deleted_at', 'is', null)
    .maybeSingle()

  if (!article) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '記事が見つかりません', traceId },
      { status: 404 },
    )
  }

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

  const { error } = await supabase
    .from('articles')
    .update({ deleted_at: null })
    .eq('id', articleId)

  if (error) {
    console.error('[POST /api/articles/[id]/restore] error', { traceId, error: error.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '復元に失敗しました', traceId },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, traceId })
}
