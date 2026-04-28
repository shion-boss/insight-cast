import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth === `Bearer ${cronSecret}`) return true
  }
  return false
}

/**
 * GET /api/cron/cleanup-deleted
 * 論理削除から30日経過したレコードを物理削除する（毎日 03:00 UTC に実行）
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [articlesResult, interviewsResult, projectsResult] = await Promise.all([
    supabase.from('articles').delete().not('deleted_at', 'is', null).lt('deleted_at', cutoff),
    supabase.from('interviews').delete().not('deleted_at', 'is', null).lt('deleted_at', cutoff),
    supabase.from('projects').delete().not('deleted_at', 'is', null).lt('deleted_at', cutoff),
  ])

  const errors = [articlesResult.error, interviewsResult.error, projectsResult.error].filter(Boolean)
  if (errors.length > 0) {
    console.error('[cron/cleanup-deleted] errors', errors)
    return NextResponse.json({ ok: false, errors: errors.map((e) => e!.message) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, cutoff })
}
