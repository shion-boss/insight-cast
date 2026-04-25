'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ButtonLink } from '@/components/ui'

export function ServiceHeroCTA() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(Boolean(user))
    })
  }, [])

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {isLoggedIn ? (
        <ButtonLink href="/dashboard" className="px-7 py-4">ダッシュボードへ →</ButtonLink>
      ) : (
        <ButtonLink href="/auth/signup" className="px-7 py-4">無料で始める →</ButtonLink>
      )}
      <ButtonLink href="/pricing" tone="secondary" className="px-7 py-4">料金を見る</ButtonLink>
    </div>
  )
}

export function ServiceBottomCTA() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(Boolean(user))
    })
  }, [])

  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
      {isLoggedIn ? (
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent)] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] shadow-[0_4px_24px_rgba(0,0,0,.12)]"
        >
          ダッシュボードへ →
        </Link>
      ) : (
        <Link
          href="/auth/signup"
          className="inline-flex items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent)] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] shadow-[0_4px_24px_rgba(0,0,0,.12)]"
        >
          無料で体験する
        </Link>
      )}
      <Link
        href="/contact"
        className="inline-flex items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] px-8 py-3.5 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        まず相談してみる
      </Link>
    </div>
  )
}
