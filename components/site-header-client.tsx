'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getButtonClass } from '@/components/ui'
import { MobileNav } from '@/components/mobile-nav'
import { signOut } from '@/lib/actions/auth'
import { useIsLoggedIn } from '@/lib/auth-state'
import { isSitePath } from '@/lib/nav-area'

const MIN_MS = 400

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/blog', label: 'ブログ' },
  { href: '/cast-talk', label: 'キャスト対談' },
  { href: '/cast', label: 'キャスト' },
  { href: '/pricing', label: '料金' },
]

export function SiteHeaderClient() {
  // 未解決時は未ログイン側を楽観的に描画する。
  // marketing pages の大半の訪問者は未ログインのため flash は最小限になる。
  const isLoggedIn = useIsLoggedIn() === true
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
        setTimeout(() => {
          timerRef.current = setTimeout(() => setNavActive(false), 300)
        }, 0)
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-[var(--elevation-3)]"
      >
        メインコンテンツへ
      </a>
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(250,246,240,0.93)] backdrop-blur-[16px]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-[62px] items-center justify-between gap-4">
            <div className="flex items-center gap-6 lg:gap-8">
              <Link
                href="/"
                className="transition-opacity hover:opacity-80"
              >
                <Image src="/logo.jpg" alt="Insight Cast" width={1116} height={350} className="h-[32px] w-auto object-contain" sizes="120px" />
              </Link>
              <nav aria-label="サイトナビゲーション" className="hidden lg:flex items-center gap-1">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-[var(--text)] bg-[var(--bg2)]'
                          : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)]/60'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:flex items-center gap-2 sm:gap-3">
                {isLoggedIn ? (
                  <>
                    <Link href="/dashboard" prefetch={false} className={getButtonClass('ghost', 'rounded-full px-4 py-2 text-sm font-medium')}>
                      ダッシュボード
                    </Link>
                    <form action={signOut}>
                      <button type="submit" className={getButtonClass('secondary', 'rounded-full px-4 py-2 text-sm font-medium')}>
                        ログアウト
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" prefetch={false} className={getButtonClass('ghost', 'rounded-full px-4 py-2 text-sm font-medium')}>
                      ログイン
                    </Link>
                    <Link href="/auth/signup" prefetch={false} className={getButtonClass('primary', 'rounded-full px-5 py-2.5 text-sm')}>
                      無料で試す <span aria-hidden="true">→</span>
                    </Link>
                  </>
                )}
              </div>

              <MobileNav navLinks={NAV_LINKS} isLoggedIn={isLoggedIn} />
            </div>
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
