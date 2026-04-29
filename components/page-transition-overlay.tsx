'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { FullPageLoading } from './full-page-loading'

const TOOL_PREFIXES = ['/dashboard', '/projects', '/interviews', '/articles', '/settings', '/onboarding']

function getArea(pathname: string): 'site' | 'tool' | 'admin' {
  if (pathname.startsWith('/admin')) return 'admin'
  if (TOOL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return 'tool'
  return 'site'
}

const MIN_MS = 2000

export function PageTransitionOverlay() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  // クリック時点の pathname を記録（遷移完了の検知に使う）
  const prevPath = useRef(pathname)
  // 最低表示時間を守るため、消せる最早時刻を記録
  const hideAt = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // pathname が変わった = 遷移完了 → MIN_MS を消化してから非表示
  useEffect(() => {
    if (!visible) return
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    const remaining = hideAt.current - Date.now()
    clearTimeout(timerRef.current)
    if (remaining > 0) {
      timerRef.current = setTimeout(() => setVisible(false), remaining)
    } else {
      setVisible(false)
    }
  }, [pathname, visible])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || anchor.download) return

      const fromArea = getArea(window.location.pathname)
      let toPath = href
      try { toPath = new URL(href, window.location.href).pathname } catch { return }
      if (toPath === window.location.pathname) return
      const toArea = getArea(toPath)

      if (fromArea !== toArea) {
        prevPath.current = window.location.pathname
        hideAt.current = Date.now() + MIN_MS
        // React 18 の自動バッチングで pathname 変更と同一バッチになると
        // ローディングが画面にコミットされないため flushSync で強制描画する
        flushSync(() => setVisible(true))
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      clearTimeout(timerRef.current)
    }
  }, [])

  if (!visible) return null
  return <FullPageLoading />
}
