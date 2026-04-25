'use client'

import { useState } from 'react'
import { getButtonClass } from '@/components/ui'

export function PortalButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json() as { url?: string }
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={getButtonClass('secondary', 'px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed')}
    >
      {loading ? '開いています...' : '支払い管理を開く'}
    </button>
  )
}
