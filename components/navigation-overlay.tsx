'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { flushSync } from 'react-dom'

const TOOL_PATHS = ['/dashboard', '/projects', '/interviews', '/articles', '/settings', '/onboarding']

function classify(path: string): 'tool' | 'admin' | 'site' {
  if (path.startsWith('/admin')) return 'admin'
  if (TOOL_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return 'tool'
  return 'site'
}

export function NavigationOverlay() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [visible, setVisible] = useState(false)
  const [headerBottom, setHeaderBottom] = useState(64)
  const areaRef = useRef<'tool' | 'admin' | 'site'>('tool')

  // 新ページのレンダリングが完了したらオーバーレイを非表示
  useEffect(() => {
    if (!isPending) setVisible(false)
  }, [isPending])

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
    // site 側は SiteHeaderClient が担当。エリアをまたぐ遷移は PageTransitionOverlay が担当
    if (fromArea !== toArea) return
    if (fromArea === 'site') return

    // <Link> のデフォルト遷移を横取りし startTransition で包む
    // → isPending が true の間は現ページを維持したままプログレスバーを表示し続ける
    e.preventDefault()

    const h = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64
    setHeaderBottom(h)
    areaRef.current = fromArea
    flushSync(() => setVisible(true))

    startTransition(() => {
      router.push(toUrl.pathname + toUrl.search)
    })
  }, [router])

  useEffect(() => {
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
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
        style={{ top: headerBottom, backgroundColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}
      >
        <div className="absolute inset-0 animate-[page-load_1s_linear_infinite] bg-[var(--accent)]" />
      </div>
      <div
        className={`fixed left-0 right-0 bottom-0 z-[25] bg-[rgba(250,246,240,0.72)] backdrop-blur-sm ${sidebarClass}`}
        style={{ top: headerBottom }}
      />
    </div>
  )
}
