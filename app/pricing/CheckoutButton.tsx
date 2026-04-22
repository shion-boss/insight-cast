'use client'

import { useState } from 'react'

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
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json() as { url?: string; message?: string }
    if (data.url) {
      window.location.href = data.url
    } else {
      alert(data.message ?? 'エラーが発生しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  if (!priceId) {
    return (
      <div className={`w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold inline-flex items-center justify-center opacity-50 cursor-not-allowed border-[1.5px] border-[var(--border)] text-[var(--text)]`}>
        準備中
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed ${
        featured
          ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'
          : 'border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
      }`}
    >
      {loading ? '移動中...' : label}
    </button>
  )
}
