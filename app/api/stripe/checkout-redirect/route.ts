import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

const PLAN_RANK: Record<string, number> = { free: 0, lightning: 1, personal: 2, business: 3 }

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const plan = searchParams.get('plan')

  const priceId =
    plan === 'lightning'
      ? process.env.STRIPE_PRICE_ID_LIGHTNING
      : plan === 'personal'
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
    .select('stripe_customer_id, stripe_subscription_id, status, plan')
    .eq('user_id', user.id)
    .single()

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? origin).replace(/\/$/, '')

  // アクティブなサブスクがある場合はプラン変更（新規作成すると二重請求になる）
  const isActive = sub?.status === 'active' || sub?.status === 'trialing'
  if (sub?.stripe_subscription_id && isActive) {
    // ダウングレード・同一プランへの変更を防ぐ
    const currentPlan = (sub?.plan as string | undefined) ?? 'free'
    const requestedRank = PLAN_RANK[plan ?? ''] ?? -1
    const currentRank = PLAN_RANK[currentPlan] ?? 0
    if (requestedRank <= currentRank) {
      return NextResponse.redirect(`${origin}/pricing`)
    }

    try {
      const existing = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
      const itemId = existing.items.data[0]?.id
      if (!itemId) return NextResponse.redirect(`${origin}/pricing`)

      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{ id: itemId, price: priceId }],
        proration_behavior: 'create_prorations',
      })
      // webhook は非同期で遅延するため、リダイレクト前に DB を即時更新する
      await createAdminClient()
        .from('subscriptions')
        .update({ plan: plan as 'lightning' | 'personal' | 'business', stripe_price_id: priceId })
        .eq('user_id', user.id)
      return NextResponse.redirect(`${appUrl}/settings/billing?success=1`)
    } catch {
      return NextResponse.redirect(`${origin}/pricing`)
    }
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

    if (!session.url) {
      return NextResponse.redirect(`${origin}/pricing`)
    }

    return NextResponse.redirect(session.url)
  } catch {
    return NextResponse.redirect(`${origin}/pricing`)
  }
}
