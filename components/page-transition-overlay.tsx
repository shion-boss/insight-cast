'use client'

import { useEffect, useRef, useState } from 'react'
import { FullPageLoading } from './full-page-loading'

const TOOL_PREFIXES = ['/dashboard', '/projects', '/interviews', '/articles', '/settings', '/onboarding']

function getArea(pathname: string): 'site' | 'tool' | 'admin' {
  if (pathname.startsWith('/admin')) return 'admin'
  if (TOOL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return 'tool'
  return 'site'
}

const MIN_MS = 2000

export function PageTransitionOverlay() {
  const [visible, setVisible] = useState(false)
  const hideAt = useRef<number>(0)
  const rafRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const show = () => {
      setVisible(true)
      hideAt.current = Date.now() + MIN_MS
      clearTimeout(rafRef.current)
      rafRef.current = setTimeout(() => setVisible(false), MIN_MS)
    }

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      // 外部リンク・ハッシュのみ・download は無視
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || anchor.download) return

      const fromArea = getArea(window.location.pathname)
      // href は相対パスの場合があるので pathname 部分だけ取り出す
      let toPath = href
      try { toPath = new URL(href, window.location.href).pathname } catch {}
      const toArea = getArea(toPath)

      // エリアをまたぐ遷移のみ全画面ローディングを出す
      if (fromArea !== toArea) show()
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      clearTimeout(rafRef.current)
    }
  }, [])

  if (!visible) return null
  return <FullPageLoading />
}
