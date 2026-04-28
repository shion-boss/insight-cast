'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CharacterAvatar } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import type { AppToastDetail } from '@/lib/client/toast'

type ToastItem = AppToastDetail & {
  id: string
}

const DEFAULT_DURATION_MS = 5000
const UNDO_DURATION_MS = 8000

function toneClass(tone: ToastItem['tone']) {
  if (tone === 'success') return 'border-[var(--ok-l)] bg-[var(--ok-l)]'
  if (tone === 'warning') return 'border-[var(--warn-l)] bg-[var(--warn-l)]'
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
    <div
      role="region"
      aria-label="通知"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3"
    >
      {toasts.map((toast) => {
        const char = getCharacter(toast.characterId ?? 'mint')
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-2xl border px-4 py-3 ${toneClass(toast.tone)}`}
          >
            <div className="flex items-start gap-2.5">
              <CharacterAvatar
                src={char?.icon48}
                alt={`${char?.name ?? 'ミント'}のアイコン`}
                emoji={char?.emoji}
                size={28}
                className="flex-shrink-0 mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text)]">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text3)]">{toast.description}</p>
                )}
                {toast.onUndo && (
                  <button
                    type="button"
                    onClick={() => { void toast.onUndo?.() }}
                    className="mt-3 inline-flex rounded-md text-sm font-medium text-[var(--accent)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border2)]"
                  >
                    {toast.undoLabel ?? '元に戻す'}
                  </button>
                )}
                {!toast.onUndo && toast.href && (
                  <Link
                    href={toast.href}
                    prefetch={false}
                    className="mt-3 inline-flex rounded-md text-sm text-[var(--text2)] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border2)]"
                  >
                    {toast.hrefLabel ?? '開く'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
