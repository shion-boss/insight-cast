import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMemberRole } from '@/lib/project-members'

type ReviewBody = {
  overall_score: number
  character_score?: number | null
  question_quality_score?: number | null
  enjoyment_score?: number | null
  good_points?: string | null
  improve_points?: string | null
}

function isScore(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5
}

function isOptionalScore(v: unknown): boolean {
  return v === undefined || v === null || isScore(v)
}

function isReviewBody(v: unknown): v is ReviewBody {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (!isScore(o.overall_score)) return false
  if (!isOptionalScore(o.character_score)) return false
  if (!isOptionalScore(o.question_quality_score)) return false
  if (!isOptionalScore(o.enjoyment_score)) return false
  if (o.good_points !== undefined && o.good_points !== null && typeof o.good_points !== 'string') return false
  if (o.improve_points !== undefined && o.improve_points !== null && typeof o.improve_points !== 'string') return false
  return true
}

async function authorize(projectId: string, interviewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, message: '権限がありません' }

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, project_id, interviews_project:projects(user_id)')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single()
  if (!interview) return { ok: false as const, status: 404, message: '取材が見つかりません' }

  const joined = interview.interviews_project as { user_id: string } | { user_id: string }[] | null
  const projectInfo = Array.isArray(joined) ? (joined[0] ?? null) : joined
  const isOwner = projectInfo?.user_id === user.id

  let reviewerRole: 'owner' | 'staff' | 'respondent' = 'owner'
  let memberCanWrite = isOwner
  if (!isOwner) {
    const memberRole = await getMemberRole(supabase, projectId, user.id)
    if (memberRole !== 'editor' && memberRole !== 'viewer') {
      return { ok: false as const, status: 403, message: '権限がありません' }
    }
    reviewerRole = 'staff'
    memberCanWrite = memberRole === 'editor'
  }
  return { ok: true as const, supabase, userId: user.id, reviewerRole, isOwner, memberCanWrite }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; interviewId: string }> },
) {
  const { id: projectId, interviewId } = await params
  const auth = await authorize(projectId, interviewId)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }
  const { data, error } = await auth.supabase
    .from('interview_reviews')
    .select('id, overall_score, character_score, question_quality_score, enjoyment_score, good_points, improve_points, reviewer_role, updated_at')
    .eq('interview_id', interviewId)
    .maybeSingle()
  if (error) {
    console.error('[interview review] select error', { interviewId, error: error.message })
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
  return NextResponse.json({ review: data ?? null })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; interviewId: string }> },
) {
  const { id: projectId, interviewId } = await params
  const auth = await authorize(projectId, interviewId)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }
  if (!auth.memberCanWrite) {
    return NextResponse.json({ error: '閲覧者は登録できません' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'リクエストボディが不正です' }, { status: 400 })
  }
  if (!isReviewBody(body)) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('interview_reviews')
    .upsert(
      {
        interview_id: interviewId,
        overall_score: body.overall_score,
        character_score: body.character_score ?? null,
        question_quality_score: body.question_quality_score ?? null,
        enjoyment_score: body.enjoyment_score ?? null,
        good_points: body.good_points?.trim() || null,
        improve_points: body.improve_points?.trim() || null,
        reviewer_user_id: auth.userId,
        reviewer_role: auth.reviewerRole,
      },
      { onConflict: 'interview_id' },
    )
    .select('id, overall_score, character_score, question_quality_score, enjoyment_score, good_points, improve_points, reviewer_role, updated_at')
    .single()

  if (error) {
    console.error('[interview review] upsert error', { interviewId, error: error.message })
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, review: data })
}
