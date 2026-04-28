'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getButtonClass } from '@/components/ui'
import { MobileNav } from '@/components/mobile-nav'
import { signOut } from '@/lib/actions/auth'

const NAV_LINKS = [
  { href: '/cast', label: 'キャスト' },
  { href: '/blog', label: 'ブログ' },
  { href: '/contact', label: 'お問い合わせ' },
]

const DRAWER_NAV_LINKS = [
  { href: '/cast', label: 'キャストを見る' },
  { href: '/blog', label: 'ブログ' },
  { href: '/cast-talk', label: 'Cast Talk' },
  { href: '/contact', label: 'お問い合わせ' },
]

const TOOL_PATHS = ['/dashboard', '/projects', '/interviews', '/articles', '/settings', '/onboarding']

function isSitePath(path: string): boolean {
  if (path.startsWith('/admin')) return false
  return !TOOL_PATHS.some((p) => path === p || path.startsWith(p + '/'))
}

export function SiteHeaderClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const [navActive, setNavActive] = useState(false)
  const [overlayTop, setOverlayTop] = useState(0)
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      setNavActive(false)
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
    if (!isSitePath(location.pathname) || !isSitePath(toPath)) return

    const bottom = headerRef.current?.getBoundingClientRect().bottom ?? 64
    setOverlayTop(bottom)
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

            <MobileNav navLinks={DRAWER_NAV_LINKS} isLoggedIn={isLoggedIn} />
          </div>

          <nav
            className="hidden md:flex gap-2 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="メインナビゲーション"
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                    isActive
                      ? 'text-[var(--accent)] font-semibold'
                      : 'text-[var(--text2)] hover:text-[var(--accent)]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {navActive && (
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
            <div className="h-full animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
          </div>
        )}
      </header>

      {navActive && (
        <div
          aria-hidden="true"
          className="fixed inset-x-0 bottom-0 z-[25] bg-[rgba(250,246,240,0.9)]"
          style={{ top: overlayTop }}
        />
      )}
    </>
  )
}
