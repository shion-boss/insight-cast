import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PostBodySchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
})

type Params = { params: Promise<{ id: string }> }

// GET: プロジェクトの取材先一覧（取材数・記事数の集計付き）
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // RLS でアクセス可なら取れる。
  // linked_user_id がある（プロジェクトメンバー由来）レコードはメンバーセクションで管理するため、ここでは除外。
  const { data: rows, error } = await supabase
    .from('interviewees')
    .select('id, name, industry, role, notes, linked_user_id, created_at, updated_at')
    .eq('project_id', projectId)
    .is('linked_user_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/projects/[id]/interviewees] db error:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  const ids = (rows ?? []).map((r) => r.id as string)

  // 取材数の集計
  const interviewCountMap = new Map<string, number>()
  const lastInterviewAtMap = new Map<string, string>()
  if (ids.length > 0) {
    const { data: interviewRows } = await supabase
      .from('interviews')
      .select('interviewee_id, created_at')
      .in('interviewee_id', ids)
      .is('deleted_at', null)
    for (const row of interviewRows ?? []) {
      const k = row.interviewee_id as string
      interviewCountMap.set(k, (interviewCountMap.get(k) ?? 0) + 1)
      const prev = lastInterviewAtMap.get(k)
      const cur = row.created_at as string
      if (!prev || cur > prev) lastInterviewAtMap.set(k, cur)
    }
  }

  // 記事数の集計（interview 経由で interviewee_id を辿る）
  const articleCountMap = new Map<string, number>()
  if (ids.length > 0) {
    // interview_id → interviewee_id のマップを取得して、articles を groupBy
    const { data: interviewMapRows } = await supabase
      .from('interviews')
      .select('id, interviewee_id')
      .in('interviewee_id', ids)
      .is('deleted_at', null)
    const interviewIdToIntervieweeId = new Map<string, string>()
    for (const row of interviewMapRows ?? []) {
      interviewIdToIntervieweeId.set(row.id as string, row.interviewee_id as string)
    }
    const interviewIds = [...interviewIdToIntervieweeId.keys()]
    if (interviewIds.length > 0) {
      const { data: articleRows } = await supabase
        .from('articles')
        .select('interview_id')
        .in('interview_id', interviewIds)
        .is('deleted_at', null)
      for (const row of articleRows ?? []) {
        const intervieweeId = interviewIdToIntervieweeId.get(row.interview_id as string)
        if (!intervieweeId) continue
        articleCountMap.set(intervieweeId, (articleCountMap.get(intervieweeId) ?? 0) + 1)
      }
    }
  }

  const interviewees = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    industry: r.industry,
    role: r.role,
    notes: r.notes,
    linked_user_id: r.linked_user_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    interview_count: interviewCountMap.get(r.id as string) ?? 0,
    article_count: articleCountMap.get(r.id as string) ?? 0,
    last_interview_at: lastInterviewAtMap.get(r.id as string) ?? null,
  }))

  return NextResponse.json({ interviewees })
}

// POST: 新規取材先作成
export async function POST(req: NextRequest, { params }: Params) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = PostBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad_request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, industry, role, notes } = parsed.data
  const trimmedName = name.trim()
  if (!trimmedName) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  // 重複チェック（同プロジェクト内で同名）
  const { data: existing } = await supabase
    .from('interviewees')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', trimmedName)
    .is('deleted_at', null)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'duplicate_name' }, { status: 409 })
  }

  const { data: created, error } = await supabase
    .from('interviewees')
    .insert({
      project_id: projectId,
      name: trimmedName,
      industry: industry?.trim() || null,
      role: role?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select('id, name, industry, role, notes, linked_user_id, created_at, updated_at')
    .single()

  if (error || !created) {
    console.error('[POST /api/projects/[id]/interviewees] insert error:', error?.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ interviewee: created }, { status: 201 })
}
