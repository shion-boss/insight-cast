import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PAGE_SIZE = 12

export async function GET(req: NextRequest) {
  const rawOffset = req.nextUrl.searchParams.get('offset')
  const rawLimit = req.nextUrl.searchParams.get('limit')
  const page = Math.max(0, Number(req.nextUrl.searchParams.get('page') ?? '0'))
  // offset が指定されていれば優先、なければ page * PAGE_SIZE をフォールバック
  const offset = rawOffset !== null ? Math.max(0, Number(rawOffset)) : page * PAGE_SIZE
  const limit = rawLimit !== null ? Math.min(Math.max(1, Number(rawLimit)), 50) : PAGE_SIZE

  const supabase = createAdminClient()

  const { data, error, count } = await supabase
    .from('cast_talks')
    .select('id, title, summary, interviewer_id, guest_id, slug, published_at', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    const traceId = crypto.randomUUID()
    console.error('[cast-talk/list] DB error', { traceId, error: error.message })
    return NextResponse.json({ code: 'DB_ERROR', message: 'データ取得に失敗しました', traceId }, { status: 500 })
  }

  return NextResponse.json(
    { talks: data ?? [], total: count ?? 0, pageSize: limit },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  )
}
