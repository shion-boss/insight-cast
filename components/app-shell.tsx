import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'

import LogoutButton from '@/app/dashboard/logout-button'
import { signOut } from '@/lib/actions/auth'
import { ToolMobileNav } from '@/components/tool-mobile-nav'

type AppSection = 'dashboard' | 'projects' | 'interviews' | 'articles' | 'settings'

export { checkIsAdmin } from '@/lib/auth-utils.server'

// SVGアイコン定義
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const IconProjects = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
)

const IconInterviews = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const IconArticles = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
)

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

type NavItem = { href: string; label: string; icon: () => React.JSX.Element; key: AppSection }

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: IconDashboard, key: 'dashboard' },
  { href: '/projects', label: '取材先一覧', icon: IconProjects, key: 'projects' },
  { href: '/interviews', label: '取材メモ一覧', icon: IconInterviews, key: 'interviews' },
  { href: '/articles', label: '記事一覧', icon: IconArticles, key: 'articles' },
  { href: '/settings', label: '設定', icon: IconSettings, key: 'settings' },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function navLinkClass(active: boolean) {
  return cx(
    'flex items-center gap-2.5 rounded-[var(--r-sm)] px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40',
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--r-sm)] focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        メインコンテンツへ
      </a>
      {/* PC サイドバー */}
      <aside aria-label="サイドバーナビゲーション" className="hidden bg-[var(--surface)] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[236px] lg:flex-col lg:border-r lg:border-[var(--border)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <Link
            href="/"
            className="block transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            <Image src="/logo.jpg" alt="Insight Cast" width={1116} height={350} className="h-8 w-auto" sizes="120px" priority />
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
              <item.icon />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] px-3 py-4 space-y-2">
          {showAdmin && (
            <Link
              href="/admin"
              className="flex items-center justify-between rounded-[var(--r-sm)] border border-stone-700/40 bg-[#1c1410] px-3 py-2.5 text-xs font-semibold text-stone-300 transition-colors hover:bg-[#2a1f18] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40"
            >
              <span className="flex items-center gap-2">
                <IconSettings /><span>管理画面</span>
              </span>
              <span className="rounded bg-stone-700/60 px-1.5 py-0.5 text-xs font-bold text-stone-400 uppercase">Admin</span>
            </Link>
          )}
          <form action={signOut} className="w-full">
            <LogoutButton />
          </form>
        </div>
      </aside>

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(250,246,240,0.93)] backdrop-blur-md">
          <div className="mx-auto flex min-h-[64px] max-w-6xl items-center px-4 py-2 sm:px-6">
            {/* モバイル: ロゴ（左）+ ハンバーガー（右） */}
            <div className="flex w-full items-center justify-between lg:hidden">
              <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                <Image src="/logo.jpg" alt="Insight Cast" width={1116} height={350} className="h-8 w-auto" sizes="120px" priority />
              </Link>
              <ToolMobileNav
                active={active}
                accountLabel={accountLabel}
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

        <main id="main-content" className={cx('mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8', contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  )
}
