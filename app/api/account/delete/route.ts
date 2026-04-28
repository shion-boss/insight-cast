import { NextResponse } from 'next/server'

import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const traceId = crypto.randomUUID()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const confirmation =
    typeof body?.confirmation === 'string' ? body.confirmation.trim() : ''

  if (!user.email || confirmation.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'invalid_confirmation' },
      { status: 422 },
    )
  }

  const admin = createAdminClient()

  const { data: avatarFiles, error: listError } = await admin.storage
    .from('avatars')
    .list(user.id, { limit: 100 })

  if (listError) {
    console.error('[account/delete] failed to list avatars', listError)
  } else if (avatarFiles.length > 0) {
    const avatarPaths = avatarFiles
      .map((file) => file.name)
      .filter(Boolean)
      .map((name) => `${user.id}/${name}`)

    if (avatarPaths.length > 0) {
      const { error: removeError } = await admin.storage
        .from('avatars')
        .remove(avatarPaths)

      if (removeError) {
        console.error('[account/delete] failed to remove avatars', removeError)
      }
    }
  }

  // Stripe サブスクリプションをキャンセル（有料プランのみ）
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (sub?.stripe_subscription_id) {
    try {
      const stripe = getStripe()
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    } catch (stripeErr) {
      const status = (stripeErr as { statusCode?: number }).statusCode
      // 404 or 400 → すでにキャンセル済みとみなして続行
      if (status === 404 || status === 400) {
        console.warn('[account/delete] stripe cancel 4xx (already cancelled?)', { traceId, status })
      } else {
        // 429, 5xx, ネットワークエラーなど → 削除を止める
        console.error('[account/delete] stripe cancel failed', { traceId, error: String(stripeErr) })
        return NextResponse.json(
          { code: 'STRIPE_ERROR', message: 'しばらく時間をおいてからもう一度お試しください', traceId },
          { status: 503 },
        )
      }
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    console.error('[account/delete] failed to delete user', error)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
