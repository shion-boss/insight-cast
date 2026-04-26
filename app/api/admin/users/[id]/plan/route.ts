import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { PlanKey } from '@/lib/plans'

const VALID_PLANS: PlanKey[] = ['free', 'personal', 'business']

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = crypto.randomUUID()

  if (!(await isAdmin())) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: '権限がありません', traceId }, { status: 401 })
  }

  const { id: userId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ code: 'INVALID_JSON', message: 'リクエストボディが不正です', traceId }, { status: 400 })
  }

  const plan = (body as Record<string, unknown>)?.plan
  if (!VALID_PLANS.includes(plan as PlanKey)) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: '無効なプランです', traceId }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({ plan, status: 'active' })
    .eq('user_id', userId)

  if (error) {
    console.error('[admin/users/plan] update error', { traceId, error: error.message })
    return NextResponse.json({ code: 'DB_ERROR', message: '更新に失敗しました', traceId }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plan, traceId })
}
