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

  // isPending が false になった = React が新ページのレンダリング完了
  // requestAnimationFrame でブラウザが実際に描画するフレームを待ってからオーバーレイを消す
  useEffect(() => {
    if (isPending || !visible) return
    const id = requestAnimationFrame(() => setVisible(false))
    return () => cancelAnimationFrame(id)
  }, [isPending, visible])

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
