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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const stripe = getStripe()

  // 既存の stripe_customer_id があれば再利用
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

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
