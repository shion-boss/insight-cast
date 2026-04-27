import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getStripe, getPriceIdToPlan } from '@/lib/stripe'

const CheckoutBodySchema = z.object({ priceId: z.string().min(1) })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    return NextResponse.json({ code: 'AUTH_ERROR', message: '認証エラーが発生しました' }, { status: 500 })
  }
  if (!user) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: '認証が必要です' }, { status: 401 })
  }

  const body: unknown = await request.json()
  const parsed = CheckoutBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ code: 'INVALID_INPUT', message: 'priceId が不正です' }, { status: 400 })
  }
  const { priceId } = parsed.data
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const stripe = getStripe()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, plan')
    .eq('user_id', user.id)
    .single()

  try {
    // 同じプランまたは上位プランへの再購入を防ぐ
    const PLAN_RANK: Record<string, number> = { free: 0, lightning: 1, personal: 2, business: 3 }
    const priceIdToPlan = getPriceIdToPlan()
    const requestedPlan = priceIdToPlan[priceId]

    // ホワイトリスト外の priceId は拒否（環境変数に登録されていない任意の price_id 送り込みを防ぐ）
    if (requestedPlan === undefined) {
      return NextResponse.json({ code: 'INVALID_PRICE_ID', message: '指定されたプランは存在しません' }, { status: 400 })
    }

    const currentPlan = (sub?.plan as string | undefined) ?? 'free'
    if ((PLAN_RANK[requestedPlan] ?? 0) <= (PLAN_RANK[currentPlan] ?? 0)) {
      const message = currentPlan === requestedPlan
        ? 'すでにこのプランをご契約中です'
        : 'より上位のプランをご契約中です'
      return NextResponse.json({ code: 'ALREADY_SUBSCRIBED', message }, { status: 409 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: sub?.stripe_customer_id ?? undefined,
      customer_email: sub?.stripe_customer_id ? undefined : (user.email ?? undefined),
      success_url: `${appUrl}/settings/billing?success=1`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { user_id: user.id },
    })

    // session.url が null の場合はセッション作成に問題があるため 500 を返す
    if (!session.url) {
      return NextResponse.json({ code: 'STRIPE_ERROR', message: 'お支払いページのURLを取得できませんでした' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ code: 'STRIPE_ERROR', message: 'お支払いページを開けませんでした' }, { status: 500 })
  }
}
