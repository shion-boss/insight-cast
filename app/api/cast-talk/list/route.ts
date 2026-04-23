import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PAGE_SIZE = 12

export async function GET(req: NextRequest) {
  const page = Math.max(0, Number(req.nextUrl.searchParams.get('page') ?? '0'))
  const supabase = createAdminClient()

  const { data, error, count } = await supabase
    .from('cast_talks')
    .select('id, title, summary, interviewer_id, guest_id, slug, published_at', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ talks: data ?? [], total: count ?? 0, pageSize: PAGE_SIZE })
}
