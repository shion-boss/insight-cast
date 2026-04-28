'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckoutButton } from './CheckoutButton'

type Plan = {
  id: string
  cta: string
  featured: boolean
}

const PLAN_RANK: Record<string, number> = { free: 0, lightning: 1, personal: 2, business: 3 }

export function PlanCardCTA({
  plan,
  priceIds,
}: {
  plan: Plan
  priceIds: { lightning: string; personal: string; business: string }
}) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('free')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setIsLoggedIn(false); return }
      setIsLoggedIn(true)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', data.user.id)
        .maybeSingle()
      setCurrentPlan((sub?.plan as string | undefined) ?? 'free')
    })
  }, [])

  if (isLoggedIn === null) {
    return (
      <div aria-busy="true" aria-label="読み込み中" className="w-full h-[46px] rounded-[var(--r-sm)] bg-[var(--border)] animate-pulse" />
    )
  }

  if (plan.id === 'free') {
    return isLoggedIn ? (
      <Link
        href="/dashboard"
        className="w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        ダッシュボードへ
      </Link>
    ) : (
      <Link
        href="/auth/signup"
        className="w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        {plan.cta}
      </Link>
    )
  }

  if (isLoggedIn) {
    const isCurrentPlan = currentPlan === plan.id
    const isHigherPlan = (PLAN_RANK[currentPlan] ?? 0) > (PLAN_RANK[plan.id] ?? 0)

    if (isCurrentPlan || isHigherPlan) {
      return (
        <div className="w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold inline-flex items-center justify-center gap-2 border-[1.5px] border-[var(--ok)]/40 bg-[var(--ok-l)] text-[var(--ok)] cursor-default">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="7" cy="7" r="6.5" stroke="currentColor"/>
            <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          現在ご契約中
        </div>
      )
    }

    const priceId =
      plan.id === 'lightning' ? priceIds.lightning
      : plan.id === 'personal' ? priceIds.personal
      : priceIds.business

    return (
      <CheckoutButton
        priceId={priceId}
        label={plan.cta}
        featured={plan.featured}
      />
    )
  }

  return (
    <Link
      href={`/auth/login?next=${encodeURIComponent(`/api/stripe/checkout-redirect?plan=${plan.id}`)}`}
      className={`w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
        plan.featured
          ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'
          : 'border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
      }`}
    >
      {plan.cta}
    </Link>
  )
}

export function PricingBottomCTA() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user))
    })
  }, [])

  if (isLoggedIn === null) {
    return (
      <div aria-busy="true" aria-label="読み込み中">
        <div className="h-10 w-64 mx-auto rounded-[var(--r-sm)] bg-[var(--border)] animate-pulse mb-4" />
        <div className="h-5 w-80 mx-auto rounded bg-[var(--border)] animate-pulse" />
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <div className="h-[52px] w-48 rounded-[var(--r-sm)] bg-[var(--border)] animate-pulse" />
          <div className="h-[52px] w-36 rounded-[var(--r-sm)] bg-[var(--border)] animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <>
      <h2
        className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]"
        style={{ fontSize: 'clamp(24px,3vw,38px)' }}
      >
        {isLoggedIn ? 'ダッシュボードから始めましょう' : 'ご不明な点はお気軽にどうぞ'}
      </h2>
      <p className="mt-4 text-[15px] text-[var(--text2)] leading-relaxed">
        {isLoggedIn
          ? 'ご登録ありがとうございます。ダッシュボードから取材を始めてください。'
          : 'プランの選び方や機能についてのご質問など、どんなことでもご相談ください。'}
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold transition-colors shadow-[0_4px_24px_rgba(0,0,0,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            ダッシュボードへ <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <>
            <Link
              href="/contact"
              className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold transition-colors shadow-[0_4px_24px_rgba(0,0,0,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              相談してみる <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/auth/signup"
              className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3.5 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              無料で始める
            </Link>
          </>
        )}
      </div>
    </>
  )
}
