import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ code: 'NO_SIGNATURE', message: 'Stripe署名がありません' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ code: 'CONFIG_ERROR', message: 'Webhook設定がありません' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ code: 'INVALID_SIGNATURE', message: '署名検証に失敗しました' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const userId = session.metadata?.user_id
      if (!userId) break

      const subscription = await getStripe().subscriptions.retrieve(session.subscription as string)

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id ?? null,
        plan: resolvePlan(subscription.items.data[0]?.price.id),
        status: subscription.status as string,
        current_period_end: subscription.items.data[0]?.current_period_end
          ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
          : null,
      }, { onConflict: 'user_id' })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: existing } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!existing) break

      await supabase.from('subscriptions').update({
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id ?? null,
        plan: resolvePlan(subscription.items.data[0]?.price.id),
        status: subscription.status as string,
        current_period_end: subscription.items.data[0]?.current_period_end
          ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
          : null,
      }).eq('user_id', existing.user_id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: existing } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!existing) break

      await supabase.from('subscriptions').update({
        plan: 'free',
        status: 'canceled',
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_end: null,
      }).eq('user_id', existing.user_id)
      break
    }
  }

  return NextResponse.json({ received: true })
}

function resolvePlan(priceId?: string): 'free' | 'personal' | 'business' {
  if (!priceId) return 'free'
  if (priceId === process.env.STRIPE_PRICE_ID_PERSONAL) return 'personal'
  if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) return 'business'
  return 'free'
}
