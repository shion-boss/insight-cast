import Link from 'next/link'
import type { ReactNode } from 'react'

import LogoutButton from '@/app/dashboard/logout-button'
import { signOut } from '@/lib/actions/auth'
import { getButtonClass } from '@/components/ui'

type AppSection = 'dashboard' | 'projects' | 'interviews' | 'articles' | 'settings'

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
  children,
  headerRight,
  contentClassName,
}: {
  title: ReactNode
  active: AppSection
  accountLabel: string
  children: ReactNode
  headerRight?: ReactNode
  contentClassName?: string
}) {
  const accountInitial = getAccountInitial(accountLabel)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <aside className="border-b border-[var(--border)] bg-[var(--surface)] lg:fixed lg:inset-y-0 lg:left-0 lg:w-[236px] lg:border-b-0 lg:border-r">
        <div className="mx-auto flex max-w-6xl flex-col lg:h-full lg:max-w-none">
          <div className="border-b border-[var(--border)] px-6 py-5 lg:px-5">
            <Link
              href="/dashboard"
              className="font-serif text-[17px] font-bold text-[var(--text)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              Insight <span className="text-[var(--accent)]">Cast</span>
            </Link>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-3 lg:py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={navLinkClass(item.key === active)}
              >
                <span aria-hidden="true" className="text-base leading-none">{item.icon}</span>
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-[var(--border)] px-4 py-4 lg:px-3">
            <div className="mb-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">Account</p>
              <Link
                href="/settings"
                className="mt-2 block rounded text-sm font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                {accountLabel}
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/" className={getButtonClass('secondary', 'justify-center px-4 py-2.5 text-sm')}>
                ← 公開サイトへ
              </Link>
              <form action={signOut}>
                <LogoutButton />
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(250,246,240,0.93)] backdrop-blur-[16px]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-bold text-[var(--text)]">{title}</p>
            </div>
            <div className="flex items-center gap-3">
              {headerRight}
              <Link
                href="/settings"
                aria-label="設定"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--accent-l)] text-xs font-semibold text-[var(--accent)] transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                {accountInitial}
              </Link>
            </div>
          </div>
        </header>

        <main className={cx('mx-auto w-full max-w-6xl px-6 py-8', contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  )
}
