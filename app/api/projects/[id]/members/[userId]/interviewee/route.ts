import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PatchBodySchema = z.object({
  industry: z.string().max(100).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

type Params = { params: Promise<{ id: string; userId: string }> }

async function ensureOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  authUserId: string,
) {
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()
  return !!project && project.user_id === authUserId
}

// GET: プロジェクトメンバーに紐づく interviewees レコードを返す（無ければ null）
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: projectId, userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!(await ensureOwner(supabase, projectId, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: row } = await supabase
    .from('interviewees')
    .select('id, name, industry, role, notes, linked_user_id, created_at, updated_at')
    .eq('project_id', projectId)
    .eq('linked_user_id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  return NextResponse.json({ interviewee: row ?? null })
}

// PATCH: メンバーの interviewees を upsert（無ければ profile.name から作成）
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: projectId, userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!(await ensureOwner(supabase, projectId, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = PatchBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad_request', details: parsed.error.flatten() }, { status: 400 })
  }

  const updates = {
    industry: parsed.data.industry !== undefined ? (parsed.data.industry?.trim() || null) : undefined,
    role: parsed.data.role !== undefined ? (parsed.data.role?.trim() || null) : undefined,
    notes: parsed.data.notes !== undefined ? (parsed.data.notes?.trim() || null) : undefined,
  }

  // 既存レコード探索
  const { data: existing } = await supabase
    .from('interviewees')
    .select('id')
    .eq('project_id', projectId)
    .eq('linked_user_id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    const patch: Record<string, unknown> = {}
    if (updates.industry !== undefined) patch.industry = updates.industry
    if (updates.role !== undefined) patch.role = updates.role
    if (updates.notes !== undefined) patch.notes = updates.notes
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('interviewees')
      .update(patch)
      .eq('id', existing.id)
      .select('id, name, industry, role, notes, linked_user_id, created_at, updated_at')
      .single()
    if (error) {
      console.error('[PATCH member interviewee] update error:', error.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
    return NextResponse.json({ interviewee: data })
  }

  // 新規作成: profiles.name を name として使う。重複時は (project_id, name) UNIQUE で衝突 → 名前末尾にユーザID短縮を付ける
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle()

  const baseName = profile?.name?.trim() || 'メンバー'
  let name = baseName
  // 同名の取材先が外部由来で既に存在する場合に備えて、衝突したらユーザIDの先頭8文字を付ける
  const { data: nameDup } = await supabase
    .from('interviewees')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', baseName)
    .is('deleted_at', null)
    .maybeSingle()
  if (nameDup) {
    name = `${baseName}（${userId.slice(0, 8)}）`
  }

  const { data: created, error } = await supabase
    .from('interviewees')
    .insert({
      project_id: projectId,
      name,
      linked_user_id: userId,
      industry: updates.industry ?? null,
      role: updates.role ?? null,
      notes: updates.notes ?? null,
    })
    .select('id, name, industry, role, notes, linked_user_id, created_at, updated_at')
    .single()

  if (error || !created) {
    console.error('[PATCH member interviewee] insert error:', error?.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ interviewee: created })
}
