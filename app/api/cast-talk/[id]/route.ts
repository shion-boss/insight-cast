import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type UpdateBody = {
  status: 'draft' | 'published'
}

function isUpdateBody(v: unknown): v is UpdateBody {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return o.status === 'draft' || o.status === 'published'
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

  const { status } = body
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'published') {
    updateData.published_at = new Date().toISOString()
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
