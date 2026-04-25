'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getButtonClass } from '@/components/ui'
import { MobileNav } from '@/components/mobile-nav'
import { signOut } from '@/lib/actions/auth'

const NAV_LINKS = [
  { href: '/service', label: 'サービス' },
  { href: '/pricing', label: '料金' },
  { href: '/cast', label: 'キャスト' },
  { href: '/blog', label: 'ブログ' },
  { href: '/cast-talk', label: 'Cast Talk' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'お問い合わせ' },
  { href: '/faq', label: 'FAQ' },
]

const DRAWER_NAV_LINKS = [
  { href: '/cast', label: 'キャストを見る' },
  { href: '/blog', label: 'ブログ' },
  { href: '/cast-talk', label: 'Cast Talk' },
  { href: '/pricing', label: '料金プラン' },
  { href: '/service', label: '使い方' },
]

export function SiteHeaderClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(250,246,240,0.93)] backdrop-blur-[16px]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-[62px] items-center justify-between gap-4">
          <Link
            href="/"
            className="transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            <img src="/logo.jpg" alt="Insight Cast" className="h-[32px] w-auto object-contain" />
          </Link>

          {/* PC用ボタン群 */}
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
                  無料で試す →
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
    </header>
  )
}
