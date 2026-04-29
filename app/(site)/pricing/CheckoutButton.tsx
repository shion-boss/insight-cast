'use client'

import { useState } from 'react'
import { showToast } from '@/lib/client/toast'

export function CheckoutButton({
  priceId,
  label,
  featured,
}: {
  priceId: string
  label: string
  featured: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json() as { url?: string; message?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        showToast({
          title: 'お支払いページを開けませんでした',
          description: data.message ?? 'しばらく待ってから、もう一度お試しください。',
          tone: 'warning',
          characterId: 'mint',
        })
        setLoading(false)
      }
    } catch {
      showToast({
        title: 'お支払いページを開けませんでした',
        description: 'しばらく待ってから、もう一度お試しください。',
        tone: 'warning',
        characterId: 'mint',
      })
      setLoading(false)
    }
  }

  if (!priceId) {
    return (
      <div className="w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold inline-flex items-center justify-center opacity-50 cursor-not-allowed border-[1.5px] border-[var(--border)] text-[var(--text)]">
        準備中
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`w-full text-center min-h-[44px] py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
        featured
          ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'
          : 'border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
      }`}
    >
      {loading ? '移動中...' : label}
    </button>
  )
}
