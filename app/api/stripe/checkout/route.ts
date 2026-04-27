import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: '認証が必要です' }, { status: 401 })
  }

  const body: unknown = await request.json()
  const priceId =
    body !== null &&
    typeof body === 'object' &&
    'priceId' in body &&
    typeof (body as Record<string, unknown>).priceId === 'string'
      ? (body as Record<string, string>).priceId
      : null

  if (!priceId) {
    return NextResponse.json({ code: 'INVALID_INPUT', message: 'priceId が不正です' }, { status: 400 })
  }
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const stripe = getStripe()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, plan')
    .eq('user_id', user.id)
    .single()

  // 同じプランまたは上位プランへの再購入を防ぐ
  const PLAN_RANK: Record<string, number> = { free: 0, personal: 1, business: 2 }
  const priceIdToPlan: Record<string, string> = {
    [process.env.STRIPE_PRICE_ID_PERSONAL ?? '']: 'personal',
    [process.env.STRIPE_PRICE_ID_BUSINESS ?? '']: 'business',
  }
  const requestedPlan = priceIdToPlan[priceId]
  const currentPlan = (sub?.plan as string | undefined) ?? 'free'
  if (requestedPlan && (PLAN_RANK[requestedPlan] ?? 0) <= (PLAN_RANK[currentPlan] ?? 0)) {
    const message = currentPlan === requestedPlan
      ? 'すでにこのプランをご契約中です'
      : 'より上位のプランをご契約中です'
    return NextResponse.json({ code: 'ALREADY_SUBSCRIBED', message }, { status: 409 })
  }

  try {
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
    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ code: 'STRIPE_ERROR', message: 'お支払いページを開けませんでした' }, { status: 500 })
  }
}
