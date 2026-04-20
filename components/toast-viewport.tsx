'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { AppToastDetail } from '@/lib/client/toast'

type ToastItem = AppToastDetail & {
  id: string
}

const DEFAULT_DURATION_MS = 5000

function toneClass(tone: ToastItem['tone']) {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50'
  if (tone === 'warning') return 'border-amber-200 bg-amber-50'
  return 'border-[var(--border)] bg-[var(--surface)]'
}

export default function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<AppToastDetail>
      const detail = customEvent.detail
      const id = detail.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

      setToasts((prev) => [...prev, { ...detail, id }])

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, DEFAULT_DURATION_MS)
    }

    window.addEventListener('app-toast', handleToast as EventListener)
    return () => window.removeEventListener('app-toast', handleToast as EventListener)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 ${toneClass(toast.tone)}`}
        >
          <p className="text-sm font-medium text-[var(--text)]">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm leading-relaxed text-[var(--text3)]">{toast.description}</p>
          )}
          {toast.href && (
            <Link
              href={toast.href}
              prefetch={false}
              className="mt-3 inline-flex rounded-md text-sm text-[var(--text2)] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border2)]"
            >
              {toast.hrefLabel ?? '開く'}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
