import Link from 'next/link'
import type { ReactNode } from 'react'

import LogoutButton from '@/app/dashboard/logout-button'
import { signOut } from '@/lib/actions/auth'
import { getButtonClass } from '@/components/ui'
import { ToolMobileNav } from '@/components/tool-mobile-nav'

type AppSection = 'dashboard' | 'projects' | 'interviews' | 'articles' | 'settings'

export { checkIsAdmin } from '@/lib/auth-utils.server'

const NAV_ITEMS: Array<{ href: string; label: string; icon: string; key: AppSection }> = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '⊡', key: 'dashboard' },
  { href: '/projects', label: '取材先一覧', icon: '◫', key: 'projects' },
  { href: '/interviews', label: '取材メモ一覧', icon: '◎', key: 'interviews' },
  { href: '/articles', label: '記事一覧', icon: '≡', key: 'articles' },
  { href: '/settings', label: '設定', icon: '⚙', key: 'settings' },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function navLinkClass(active: boolean) {
  return cx(
    'flex items-center gap-2.5 rounded-[var(--r-sm)] px-3 py-2.5 text-sm font-medium transition-colors duration-150',
    active
      ? 'bg-[var(--accent-l)] text-[var(--accent)]'
      : 'text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)]',
  )
}

function getAccountInitial(value: string) {
  return value.trim().charAt(0) || 'U'
}

export function AppShell({
  title,
  active,
  accountLabel,
  isAdmin,
  children,
  headerRight,
  contentClassName,
}: {
  title: ReactNode
  active: AppSection
  accountLabel: string
  isAdmin?: boolean
  children: ReactNode
  headerRight?: ReactNode
  contentClassName?: string
}) {
  const accountInitial = getAccountInitial(accountLabel)
  const showAdmin = !!isAdmin

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* PC サイドバー */}
      <aside aria-label="サイドバーナビゲーション" className="hidden bg-[var(--surface)] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[236px] lg:flex-col lg:border-r lg:border-[var(--border)]">
        <div className="border-b border-[var(--border)] px-5 py-5">
          <Link
            href="/"
            className="font-serif text-[17px] font-bold text-[var(--text)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            Insight <span className="text-[var(--accent)]">Cast</span>
          </Link>
        </div>

        <nav aria-label="メインナビゲーション" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.key === active ? 'page' : undefined}
              className={navLinkClass(item.key === active)}
            >
              <span aria-hidden="true" className="text-base leading-none">{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] px-3 py-4 space-y-2">
          {showAdmin && (
            <Link
              href="/admin"
              className="flex items-center justify-between rounded-[var(--r-sm)] border border-stone-700/40 bg-[#1c1410] px-3 py-2.5 text-xs font-semibold text-stone-300 transition-colors hover:bg-[#2a1f18] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true">⚙</span>管理画面
              </span>
              <span className="rounded bg-stone-700/60 px-1.5 py-0.5 text-[10px] font-bold text-stone-400 uppercase">Admin</span>
            </Link>
          )}
          <Link href="/" className={getButtonClass('secondary', 'justify-center px-4 py-2.5 text-sm')}>
            ← 公開サイトへ
          </Link>
          <form action={signOut}>
            <LogoutButton />
          </form>
        </div>
      </aside>

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(250,246,240,0.93)] backdrop-blur-md">
          <div className="mx-auto flex min-h-[64px] max-w-6xl items-center px-4 py-2 sm:px-6">
            {/* モバイル: ロゴ（左）+ ハンバーガー（右） */}
            <div className="flex w-full items-center justify-between lg:hidden">
              <Link href="/">
                <img src="/logo.jpg" alt="Insight Cast" className="h-8 w-auto" />
              </Link>
              <ToolMobileNav
                navItems={NAV_ITEMS}
                active={active}
                accountLabel={accountLabel}
                accountInitial={accountInitial}
                isAdmin={showAdmin}
              />
            </div>
            {/* PC: タイトル + 右側アクション */}
            <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-between lg:gap-4 lg:min-w-0">
              <p className="truncate font-serif text-lg font-bold text-[var(--text)]">{title}</p>
              <div className="flex shrink-0 items-center gap-3">
                {headerRight}
                <Link
                  href="/settings"
                  aria-label="設定"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--accent-l)] text-xs font-semibold text-[var(--accent)] transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  {accountInitial}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className={cx('mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8', contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  )
}
