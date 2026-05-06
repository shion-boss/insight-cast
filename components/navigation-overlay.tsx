'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { classifyArea } from '@/lib/nav-area'

const MIN_MS = 400

export function NavigationOverlay() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locationKey = pathname + '?' + searchParams.toString()
  const [visible, setVisible] = useState(false)
  const [headerBottom, setHeaderBottom] = useState(62)
  const areaRef = useRef<'tool' | 'admin' | 'site'>('tool')
  const prevPath = useRef(locationKey)
  const hideAt = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // ページ読み込み完了後にセット。次にバーが画面右端まで抜けたタイミング（=1サイクル境界）で hide する。
  const finishingRef = useRef(false)

  // locationKey (pathname + search) が変わった = Next.js が新ページの React ツリーを更新完了
  useEffect(() => {
    if (!visible) return
    if (prevPath.current === locationKey) return
    prevPath.current = locationKey

    const startFinish = () => {
      finishingRef.current = true
      // フェイルセーフ: animationiteration が来ない環境でも 1.2s 後には必ず消す
      timerRef.current = setTimeout(() => {
        finishingRef.current = false
        document.querySelectorAll('a[data-nav-pending]').forEach((el) => {
          el.removeAttribute('data-nav-pending')
        })
        setVisible(false)
      }, 1200)
    }

    const remaining = hideAt.current - Date.now()
    clearTimeout(timerRef.current)
    if (remaining > 0) {
      timerRef.current = setTimeout(startFinish, remaining)
    } else {
      startFinish()
    }
  }, [locationKey, visible])

  const handleAnimationIteration = useCallback(() => {
    if (!finishingRef.current) return
    finishingRef.current = false
    clearTimeout(timerRef.current)
    document.querySelectorAll('a[data-nav-pending]').forEach((el) => {
      el.removeAttribute('data-nav-pending')
    })
    setVisible(false)
  }, [])

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

    // is-tool-fullscreen（インタビュー画面など）ではヘッダーが display:none で
    // getBoundingClientRect().bottom が 0 になり、バーが画面最上部に出てしまう。
    // ヘッダーが視覚的に出ていないページではバーも出さない。
    const headerEl = document.querySelector('[data-app-header]') as HTMLElement | null
    if (!headerEl || headerEl.offsetParent === null) return
    const h = headerEl.getBoundingClientRect().bottom
    setHeaderBottom(h)
    areaRef.current = fromArea
    prevPath.current = location.pathname + location.search
    hideAt.current = Date.now() + MIN_MS
    finishingRef.current = false
    a.setAttribute('data-nav-pending', 'true')
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
        <div
          className="absolute inset-0 animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]"
          onAnimationIteration={handleAnimationIteration}
        />
      </div>
    </div>
  )
}
