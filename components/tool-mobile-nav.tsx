'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { signOut } from '@/lib/actions/auth'

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

type NavItem = { href: string; label: string; icon: () => React.JSX.Element; key: string }

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: IconDashboard, key: 'dashboard' },
  { href: '/projects', label: '取材先一覧', icon: IconProjects, key: 'projects' },
  { href: '/interviews', label: '取材メモ一覧', icon: IconInterviews, key: 'interviews' },
  { href: '/articles', label: '記事一覧', icon: IconArticles, key: 'articles' },
  { href: '/settings', label: '設定', icon: IconSettings, key: 'settings' },
]

export function ToolMobileNav({
  active,
  accountLabel,
  isAdmin,
}: {
  active: string
  accountLabel: string
  isAdmin?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const el = drawerRef.current?.querySelector<HTMLElement>('a,button,[tabindex]:not([tabindex="-1"])')
      el?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab') return
      const drawer = drawerRef.current
      if (!drawer) return
      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
      ))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center justify-center gap-[5px] rounded-[var(--r-sm)] w-11 h-11 transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        <span className={`block h-[2px] w-4 rounded-full bg-[var(--text)] transition-[transform,opacity] duration-200 origin-center ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
        <span className={`block h-[2px] w-4 rounded-full bg-[var(--text)] transition-[transform,opacity] duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`} />
        <span className={`block h-[2px] w-4 rounded-full bg-[var(--text)] transition-[transform,opacity] duration-200 origin-center ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
      </button>

      {mounted && createPortal(
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            ref={drawerRef}
            className={`fixed top-0 right-0 z-50 h-dvh w-[min(272px,calc(100vw-24px))] bg-[var(--surface)] border-l border-[var(--border)] flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
            role="dialog"
            aria-modal="true"
            aria-label="ナビゲーションメニュー"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                <Image src="/logo.jpg" alt="Insight Cast" width={1116} height={350} className="h-[32px] w-auto" priority />
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

            <nav aria-label="メインナビゲーション" className="flex flex-col gap-1 flex-1 overflow-y-auto px-3 py-3">
              {NAV_ITEMS.map((item) => {
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
                    <item.icon />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-[var(--border)] px-4 py-4 space-y-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-[var(--r-sm)] border border-stone-700/40 bg-[#1c1410] px-3 py-2.5 text-xs font-semibold text-stone-300 transition-colors hover:bg-[#2a1f18] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40"
                >
                  <span className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    管理画面
                  </span>
                  <span className="rounded bg-stone-700/60 px-1.5 py-0.5 text-xs font-bold text-stone-400 uppercase">Admin</span>
                </Link>
              )}
              <p className="truncate text-xs text-[var(--text3)] px-1">{accountLabel}</p>
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
