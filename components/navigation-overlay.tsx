'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

const TOOL_PATHS = ['/dashboard', '/projects', '/interviews', '/articles', '/settings', '/onboarding']

function classify(path: string): 'tool' | 'admin' | 'site' {
  if (path.startsWith('/admin')) return 'admin'
  if (TOOL_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return 'tool'
  return 'site'
}

export function NavigationOverlay() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [headerBottom, setHeaderBottom] = useState(64)
  // クリック時点のエリアを記録（遷移後に変わる前に使うため ref）
  const areaRef = useRef(classify(pathname))
  const prevPath = useRef(pathname)

  // pathname が変わった = ナビゲーション完了 → オーバーレイを消す
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      setVisible(false)
    }
  }, [pathname])

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
    // エリアをまたぐ遷移は PageTransitionOverlay が担当するのでスキップ
    if (fromArea !== toArea) return

    // ヘッダー下端を測定してからオーバーレイを表示
    const h = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64
    setHeaderBottom(h)
    areaRef.current = fromArea
    setVisible(true)
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [handleClick])

  if (!visible) return null

  const area = areaRef.current

  // ヘッダー高さ・サイドバー幅をエリアごとに定義
  // tool: header 64px, sidebar 236px (lg以上)
  // admin: header 64px, sidebar 220px (lg以上)
  // site: header高さが可変なので fixed top-0 で全画面カバー
  if (area === 'site') {
    return (
      <div aria-hidden="true">
        <div className="fixed left-0 right-0 z-[31] h-[2px] overflow-hidden" style={{ top: headerBottom }}>
          <div className="h-full animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
        </div>
        <div className="fixed inset-0 z-[25] bg-[rgba(250,246,240,0.9)]" />
      </div>
    )
  }

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
