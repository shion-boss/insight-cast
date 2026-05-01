'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { classifyArea } from '@/lib/nav-area'

const MIN_MS = 400

export function NavigationOverlay() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [headerBottom, setHeaderBottom] = useState(62)
  const areaRef = useRef<'tool' | 'admin' | 'site'>('tool')
  const prevPath = useRef(pathname)
  const hideAt = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // pathname が変わった = Next.js が新ページの React ツリーを更新完了
  // MIN_MS を消化してからオーバーレイを非表示
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

    const fromArea = classifyArea(location.pathname)
    const toArea = classifyArea(toPath)
    // site 側は SiteHeaderClient が担当。エリアをまたぐ遷移は PageTransitionOverlay が担当
    if (fromArea !== toArea) return
    if (fromArea === 'site') return

    const h = document.querySelector('[data-app-header]')?.getBoundingClientRect().bottom ?? 62
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
