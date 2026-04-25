'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { signOut } from '@/lib/actions/auth'

type NavItem = { href: string; label: string; icon: string; key: string }

export function ToolMobileNav({
  navItems,
  active,
  accountLabel,
  accountInitial,
  isAdmin,
}: {
  navItems: NavItem[]
  active: string
  accountLabel: string
  accountInitial: string
  isAdmin?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center justify-center gap-[5px] rounded-[var(--r-sm)] w-9 h-9 transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        <span className={`block h-[2px] w-4 rounded-full bg-[var(--text)] transition-all duration-200 origin-center ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
        <span className={`block h-[2px] w-4 rounded-full bg-[var(--text)] transition-all duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`} />
        <span className={`block h-[2px] w-4 rounded-full bg-[var(--text)] transition-all duration-200 origin-center ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
      </button>

      {mounted && createPortal(
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            className={`fixed top-0 left-0 z-50 h-full w-[min(272px,calc(100vw-24px))] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
            role="dialog"
            aria-modal="true"
            aria-label="ナビゲーションメニュー"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                <img src="/logo.jpg" alt="Insight Cast" className="h-[32px] w-auto" />
              </Link>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text3)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* ナビ */}
            <nav aria-label="メインナビゲーション" className="flex flex-col gap-1 flex-1 overflow-y-auto px-3 py-3">
              {navItems.map((item) => {
                const isActive = item.key === active
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-[var(--r-sm)] px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--accent-l)] text-[var(--accent)]'
                        : 'text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)]'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40`}
                  >
                    <span aria-hidden="true" className="text-base leading-none">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* フッター */}
            <div className="border-t border-[var(--border)] px-4 py-4 space-y-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-[var(--r-sm)] border border-stone-700/40 bg-[#1c1410] px-3 py-2.5 text-xs font-semibold text-stone-300 transition-colors hover:bg-[#2a1f18] hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">⚙</span>管理画面
                  </span>
                  <span className="rounded bg-stone-700/60 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-stone-400 uppercase">Admin</span>
                </Link>
              )}
              <p className="truncate text-xs text-[var(--text3)] px-1">{accountLabel}</p>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)]"
              >
                ← 公開サイトへ
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full rounded-[var(--r-sm)] border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
