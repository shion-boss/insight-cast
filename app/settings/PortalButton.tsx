'use client'

import { useState } from 'react'
import { getButtonClass } from '@/components/ui'
import { showToast } from '@/lib/client/toast'

export function PortalButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        showToast({
          title: '支払い管理を開けませんでした',
          description: 'しばらく待ってから、もう一度お試しください。',
          tone: 'warning',
          characterId: 'mint',
        })
        setLoading(false)
      }
    } catch {
      showToast({
        title: '支払い管理を開けませんでした',
        description: 'しばらく待ってから、もう一度お試しください。',
        tone: 'warning',
        characterId: 'mint',
      })
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={getButtonClass('secondary', 'px-4 py-2 text-sm')}
    >
      {loading ? '開いています...' : '支払い管理を開く'}
    </button>
  )
}
