'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'insight-cast:last-account-site-metrics-refresh'
const MIN_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000

type Props = {
  enabled: boolean
}

export default function AccountSiteMetricsRefresher({ enabled }: Props) {
  const router = useRouter()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!enabled || startedRef.current) return

    const lastRunAt = window.localStorage.getItem(STORAGE_KEY)
    const lastRunMs = lastRunAt ? new Date(lastRunAt).getTime() : 0
    if (lastRunMs && !Number.isNaN(lastRunMs) && Date.now() - lastRunMs < MIN_REFRESH_INTERVAL_MS) {
      return
    }

    startedRef.current = true

    void fetch('/api/account/refresh-site-metrics', {
      method: 'POST',
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) return
        const json = await response.json().catch(() => null)
        window.localStorage.setItem(STORAGE_KEY, new Date().toISOString())
        if (typeof json?.refreshed === 'number' && json.refreshed > 0) {
          router.refresh()
        }
      })
      .catch(() => {
        startedRef.current = false
      })
  }, [enabled, router])

  return null
}
