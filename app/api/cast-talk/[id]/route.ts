import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type UpdateBody = {
  status?: 'draft' | 'published'
  title?: string
  summary?: string | null
  messages?: Array<{ castId: string; text: string }>
}

function isUpdateBody(v: unknown): v is UpdateBody {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (o.status !== undefined && o.status !== 'draft' && o.status !== 'published') return false
  if (o.title !== undefined && typeof o.title !== 'string') return false
  if (o.summary !== undefined && o.summary !== null && typeof o.summary !== 'string') return false
  if (o.messages !== undefined && !Array.isArray(o.messages)) return false
  return true
}

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  return adminEmails.includes(user.email)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = crypto.randomUUID()

  if (!(await isAdmin())) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '権限がありません', traceId },
      { status: 401 },
    )
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { code: 'INVALID_JSON', message: 'リクエストボディが不正です', traceId },
      { status: 400 },
    )
  }

  if (!isUpdateBody(body)) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: '入力値が不正です', traceId },
      { status: 400 },
    )
  }

  const { status, title, summary, messages } = body
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {}
  if (status !== undefined) {
    updateData.status = status
    if (status === 'published') updateData.published_at = new Date().toISOString()
  }
  if (title !== undefined) updateData.title = title
  if (summary !== undefined) updateData.summary = summary
  if (messages !== undefined) updateData.messages = messages

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: '更新内容がありません', traceId }, { status: 400 })
  }

  const { error } = await supabase
    .from('cast_talks')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('[cast-talk/[id]] PATCH error', { traceId, error: error.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '更新に失敗しました', traceId },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, traceId })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = crypto.randomUUID()

  if (!(await isAdmin())) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '権限がありません', traceId },
      { status: 401 },
    )
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from('cast_talks').delete().eq('id', id)

  if (error) {
    console.error('[cast-talk/[id]] DELETE error', { traceId, error: error.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '削除に失敗しました', traceId },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, traceId })
}
