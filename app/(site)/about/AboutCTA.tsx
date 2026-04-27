'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AboutBottomCTA() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(Boolean(user))
    })
  }, [])

  return (
    <div className="mt-7 flex flex-wrap justify-center gap-3">
      {isLoggedIn ? (
        <Link
          href="/dashboard"
          className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-7 py-3.5 text-sm font-semibold transition-colors inline-flex items-center shadow-[0_4px_24px_rgba(0,0,0,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          ダッシュボードへ <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <Link
          href="/auth/signup"
          className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-7 py-3.5 text-sm font-semibold transition-colors inline-flex items-center shadow-[0_4px_24px_rgba(0,0,0,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          カード不要・無料で体験する <span aria-hidden="true">→</span>
        </Link>
      )}
      <Link
        href="/contact"
        className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3.5 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        まず相談する
      </Link>
    </div>
  )
}
