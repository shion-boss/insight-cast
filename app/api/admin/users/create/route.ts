import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanKey } from '@/lib/plans'

const VALID_PLANS = Object.keys(PLANS) as PlanKey[]

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',').map((e) => e.trim()).filter(Boolean).includes(user.email)
}

export async function POST(req: NextRequest) {
  const traceId = crypto.randomUUID()

  if (!(await isAdmin())) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: '権限がありません', traceId }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ code: 'INVALID_JSON', message: 'リクエストボディが不正です', traceId }, { status: 400 })
  }

  const { email, password, plan } = body as Record<string, unknown>

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'メールアドレスが不正です', traceId }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'パスワードは8文字以上で入力してください', traceId }, { status: 400 })
  }
  const planKey: PlanKey = VALID_PLANS.includes(plan as PlanKey) ? (plan as PlanKey) : 'free'

  const supabase = createAdminClient()

  // email_confirm: true でメール確認をスキップして即アクティブ化
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    const message = error.message.includes('already')
      ? 'このメールアドレスはすでに登録されています'
      : `作成に失敗しました: ${error.message}`
    return NextResponse.json({ code: 'AUTH_ERROR', message, traceId }, { status: 400 })
  }

  // free 以外のプランを指定された場合は subscriptions を更新
  if (planKey !== 'free') {
    await supabase
      .from('subscriptions')
      .update({ plan: planKey, status: 'active' })
      .eq('user_id', data.user.id)
  }

  return NextResponse.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email, created_at: data.user.created_at },
    plan: planKey,
    traceId,
  })
}
