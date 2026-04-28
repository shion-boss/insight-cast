'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

const TOOL_PATHS = ['/dashboard', '/projects', '/interviews', '/articles', '/settings', '/onboarding']

function classify(path: string): 'tool' | 'admin' | 'site' {
  if (path.startsWith('/admin')) return 'admin'
  if (TOOL_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return 'tool'
  return 'site'
}

// React 18 concurrent mode でナビゲーション完了と visible=true が同一バッチになっても
// 確実にプログレスバーを視認できるよう最低表示時間を設ける
const MIN_MS = 400

export function NavigationOverlay() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [headerBottom, setHeaderBottom] = useState(64)
  const areaRef = useRef(classify(pathname))
  const prevPath = useRef(pathname)
  const hideAt = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // pathname が変わった = ナビゲーション完了 → MIN_MS を消化してから非表示
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

  const handleClick = useCallback((e: MouseEvent) => {
    const a = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
    if (!a) return
    const raw = a.getAttribute('href') ?? ''
    if (!raw || raw.startsWith('http') || raw.startsWith('//') || raw.startsWith('#') || a.download) return
    let toPath = raw
    try { toPath = new URL(raw, location.href).pathname } catch { return }
    if (toPath === location.pathname) return

    const fromArea = classify(location.pathname)
    const toArea = classify(toPath)
    // site 側は SiteHeaderClient が担当。エリアをまたぐ遷移は PageTransitionOverlay が担当
    if (fromArea !== toArea) return
    if (fromArea === 'site') return

    const h = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64
    setHeaderBottom(h)
    areaRef.current = fromArea
    prevPath.current = location.pathname
    hideAt.current = Date.now() + MIN_MS
    setVisible(true)
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      clearTimeout(timerRef.current)
    }
  }, [handleClick])

  if (!visible) return null

  const area = areaRef.current

  // tool: header 64px, sidebar 236px (lg以上)
  // admin: header 64px, sidebar 220px (lg以上)
  // site: SiteHeaderClient が担当するため NavigationOverlay では扱わない
  const sidebarClass = area === 'admin' ? 'lg:left-[220px]' : 'lg:left-[236px]'

  return (
    <div aria-hidden="true">
      <div
        className={`fixed left-0 right-0 z-[31] h-[2px] overflow-hidden ${sidebarClass}`}
        style={{ top: headerBottom }}
      >
        <div className="h-full animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
      </div>
      <div
        className={`fixed left-0 right-0 bottom-0 z-[25] bg-[rgba(250,246,240,0.9)] ${sidebarClass}`}
        style={{ top: headerBottom }}
      />
    </div>
  )
}
