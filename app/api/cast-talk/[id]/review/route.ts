import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .includes(user.email)
}

type ReviewBody = {
  overall_score: number
  naturalness_score?: number | null
  character_score?: number | null
  good_points?: string | null
  improve_points?: string | null
}

function isScore(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5
}

function isReviewBody(v: unknown): v is ReviewBody {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (!isScore(o.overall_score)) return false
  if (o.naturalness_score !== undefined && o.naturalness_score !== null && !isScore(o.naturalness_score)) return false
  if (o.character_score !== undefined && o.character_score !== null && !isScore(o.character_score)) return false
  if (o.good_points !== undefined && o.good_points !== null && typeof o.good_points !== 'string') return false
  if (o.improve_points !== undefined && o.improve_points !== null && typeof o.improve_points !== 'string') return false
  return true
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: '権限がありません' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cast_talk_reviews')
    .select('id, overall_score, naturalness_score, character_score, good_points, improve_points, updated_at')
    .eq('cast_talk_id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ code: 'DB_ERROR', message: '取得に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ review: data ?? null })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = crypto.randomUUID()

  if (!(await isAdmin())) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: '権限がありません', traceId }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ code: 'INVALID_JSON', message: 'リクエストボディが不正です', traceId }, { status: 400 })
  }

  if (!isReviewBody(body)) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: '入力値が不正です', traceId }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('cast_talk_reviews')
    .upsert(
      {
        cast_talk_id: id,
        overall_score: body.overall_score,
        naturalness_score: body.naturalness_score ?? null,
        character_score: body.character_score ?? null,
        good_points: body.good_points?.trim() || null,
        improve_points: body.improve_points?.trim() || null,
      },
      { onConflict: 'cast_talk_id' },
    )
    .select('id, overall_score, naturalness_score, character_score, good_points, improve_points, updated_at')
    .single()

  if (error) {
    console.error('[cast-talk/review] upsert error', { traceId, error: error.message })
    return NextResponse.json({ code: 'DB_ERROR', message: '保存に失敗しました', traceId }, { status: 500 })
  }

  return NextResponse.json({ ok: true, review: data, traceId })
}
