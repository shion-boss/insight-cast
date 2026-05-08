import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PatchBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  industry: z.string().max(100).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

type Params = { params: Promise<{ id: string }> }

// PATCH: 取材先情報更新
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = PatchBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad_request', details: parsed.error.flatten() }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) {
    const trimmed = parsed.data.name.trim()
    if (!trimmed) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    updates.name = trimmed
  }
  if (parsed.data.industry !== undefined) {
    updates.industry = parsed.data.industry?.trim() || null
  }
  if (parsed.data.role !== undefined) {
    updates.role = parsed.data.role?.trim() || null
  }
  if (parsed.data.notes !== undefined) {
    updates.notes = parsed.data.notes?.trim() || null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('interviewees')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, name, industry, role, notes, linked_user_id, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'duplicate_name' }, { status: 409 })
    }
    console.error('[PATCH /api/interviewees/[id]] db error:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ interviewee: data })
}

// DELETE: ソフトデリート
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('interviewees')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('[DELETE /api/interviewees/[id]] db error:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
