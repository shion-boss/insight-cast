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

export function PlanCardCTA({
  plan,
  priceIds,
}: {
  plan: Plan
  priceIds: { personal: string; business: string }
}) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user))
    })
  }, [])

  if (isLoggedIn === null) {
    return (
      <div className="w-full h-[46px] rounded-[var(--r-sm)] bg-[var(--border)] animate-pulse" />
    )
  }

  if (plan.id === 'free') {
    return isLoggedIn ? (
      <Link
        href="/dashboard"
        className="w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        ダッシュボードへ
      </Link>
    ) : (
      <Link
        href="/auth/signup"
        className="w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        {plan.cta}
      </Link>
    )
  }

  return isLoggedIn ? (
    <CheckoutButton
      priceId={plan.id === 'personal' ? priceIds.personal : priceIds.business}
      label={plan.cta}
      featured={plan.featured}
    />
  ) : (
    <Link
      href={`/auth/login?next=${encodeURIComponent(`/api/stripe/checkout-redirect?plan=${plan.id}`)}`}
      className={`w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center ${
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
      <>
        <div className="h-10 w-64 mx-auto rounded-[var(--r-sm)] bg-[var(--border)] animate-pulse mb-4" />
        <div className="h-5 w-80 mx-auto rounded bg-[var(--border)] animate-pulse" />
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <div className="h-[52px] w-48 rounded-[var(--r-sm)] bg-[var(--border)] animate-pulse" />
          <div className="h-[52px] w-36 rounded-[var(--r-sm)] bg-[var(--border)] animate-pulse" />
        </div>
      </>
    )
  }

  return (
    <>
      <h2
        className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]"
        style={{ fontSize: 'clamp(24px,3vw,38px)' }}
      >
        {isLoggedIn ? 'ダッシュボードから始めましょう' : 'まず、無料で試してみませんか？'}
      </h2>
      <p className="mt-4 text-[15px] text-[var(--text2)] leading-relaxed">
        {isLoggedIn
          ? 'ご登録ありがとうございます。ダッシュボードから取材を始めてください。'
          : 'クレジットカード不要。メールアドレスだけで始められます。'}
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold transition-colors shadow-[0_4px_24px_rgba(0,0,0,.12)]"
          >
            ダッシュボードへ →
          </Link>
        ) : (
          <Link
            href="/auth/signup"
            className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold transition-colors shadow-[0_4px_24px_rgba(0,0,0,.12)]"
          >
            無料で始める →
          </Link>
        )}
        <Link
          href="/contact"
          className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3.5 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          まず相談してみる
        </Link>
      </div>
    </>
  )
}
