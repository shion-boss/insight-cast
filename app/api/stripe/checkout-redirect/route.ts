import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const plan = searchParams.get('plan')

  const priceId =
    plan === 'personal'
      ? process.env.STRIPE_PRICE_ID_PERSONAL
      : plan === 'business'
        ? process.env.STRIPE_PRICE_ID_BUSINESS
        : null

  if (!priceId) {
    return NextResponse.redirect(`${origin}/pricing`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?next=${encodeURIComponent(`/api/stripe/checkout-redirect?plan=${plan}`)}`)
  }

  const stripe = getStripe()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin

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

  if (!session.url) {
    return NextResponse.redirect(`${origin}/pricing`)
  }

  return NextResponse.redirect(session.url)
}
