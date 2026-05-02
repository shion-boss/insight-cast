'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getButtonClass } from '@/components/ui'
import { MobileNav } from '@/components/mobile-nav'
import { signOut } from '@/lib/actions/auth'
import { isSitePath } from '@/lib/nav-area'

const MIN_MS = 400

export function SiteHeaderClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const [navActive, setNavActive] = useState(false)
  const prevPath = useRef(pathname)
  const hideAt = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!navActive) return
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    const hide = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          timerRef.current = setTimeout(() => setNavActive(false), 300)
        })
      })
    }

    const remaining = hideAt.current - Date.now()
    clearTimeout(timerRef.current)
    if (remaining > 0) {
      timerRef.current = setTimeout(hide, remaining)
    } else {
      hide()
    }
  }, [pathname, navActive])

  useEffect(() => {
    return () => { clearTimeout(timerRef.current) }
  }, [])

  const handleClick = useCallback((e: MouseEvent) => {
    const a = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
    if (!a) return
    const raw = a.getAttribute('href') ?? ''
    if (!raw || raw.startsWith('http') || raw.startsWith('//') || raw.startsWith('#') || a.download) return
    let toPath = raw
    try { toPath = new URL(raw, location.href).pathname } catch { return }
    if (toPath === location.pathname) return
    if (!isSitePath(location.pathname) || !isSitePath(toPath)) return

    prevPath.current = location.pathname
    hideAt.current = Date.now() + MIN_MS
    setNavActive(true)
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [handleClick])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--r-sm)] focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        メインコンテンツへ
      </a>
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(250,246,240,0.93)] backdrop-blur-[16px]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-[62px] items-center justify-between gap-4">
            <Link
              href="/"
              className="transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              <Image src="/logo.jpg" alt="Insight Cast" width={1116} height={350} className="h-[32px] w-auto object-contain" sizes="120px" priority />
            </Link>

            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link href="/dashboard" className={getButtonClass('ghost', 'rounded-full px-4 py-2 text-sm font-medium')}>
                    ダッシュボード
                  </Link>
                  <form action={signOut}>
                    <button type="submit" className={getButtonClass('secondary', 'rounded-full px-4 py-2 text-sm font-medium')}>
                      ログアウト
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <Link href="/auth/login" className={getButtonClass('ghost', 'rounded-full px-4 py-2 text-sm font-medium')}>
                    ログイン
                  </Link>
                  <Link href="/auth/signup" className={getButtonClass('primary', 'rounded-full px-5 py-2.5 text-sm')}>
                    無料で試す <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </div>

            <MobileNav navLinks={[]} isLoggedIn={isLoggedIn} />
          </div>

        </div>

        {navActive && (
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
            <div className="h-full animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
          </div>
        )}
      </header>

    </>
  )
}
