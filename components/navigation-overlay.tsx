'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

const TOOL_PATHS = ['/dashboard', '/projects', '/interviews', '/articles', '/settings', '/onboarding']
const MIN_MS = 400

function classify(path: string): 'tool' | 'admin' | 'site' {
  if (path.startsWith('/admin')) return 'admin'
  if (TOOL_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return 'tool'
  return 'site'
}

export function NavigationOverlay() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [headerBottom, setHeaderBottom] = useState(64)
  const areaRef = useRef<'tool' | 'admin' | 'site'>('tool')
  const prevPath = useRef(pathname)
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
    return () => { clearTimeout(timerRef.current) }
  }, [])

  const handleClick = useCallback((e: MouseEvent) => {
    const a = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
    if (!a) return
    const raw = a.getAttribute('href') ?? ''
    if (!raw || raw.startsWith('http') || raw.startsWith('//') || raw.startsWith('#') || a.download || a.target === '_blank') return
    let toUrl: URL
    try { toUrl = new URL(raw, location.href) } catch { return }
    const toPath = toUrl.pathname
    if (toPath === location.pathname && toUrl.search === location.search) return

    const fromArea = classify(location.pathname)
    const toArea = classify(toPath)
    if (fromArea !== toArea) return
    if (fromArea === 'site') return

    const h = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64
    setHeaderBottom(h)
    areaRef.current = fromArea
    prevPath.current = location.pathname
    hideAt.current = Date.now() + MIN_MS
    flushSync(() => setVisible(true))
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [handleClick])

  if (!visible) return null

  const area = areaRef.current
  const sidebarClass = area === 'admin' ? 'lg:left-[220px]' : 'lg:left-[236px]'

  return (
    <div aria-hidden="true">
      <div
        className={`fixed left-0 right-0 z-[31] h-[2px] overflow-hidden ${sidebarClass}`}
        style={{ top: headerBottom }}
      >
        <div className="absolute inset-0 animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
      </div>
      <div
        className={`fixed left-0 right-0 bottom-0 z-[25] bg-[rgba(250,246,240,0.9)] ${sidebarClass}`}
        style={{ top: headerBottom }}
      />
    </div>
  )
}
