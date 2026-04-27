'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { getButtonClass } from '@/components/ui'

type NavLink = { href: string; label: string }

type MobileNavProps = {
  navLinks: NavLink[]
  isLoggedIn: boolean
}

export function MobileNav({ navLinks, isLoggedIn }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // スクロール防止 + 初期フォーカス
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

  // フォーカストラップ + Escape
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
      {/* ハンバーガーボタン */}
      <button
        type="button"
        aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] rounded-[var(--r-sm)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        <span
          className={`block h-[2px] w-5 rounded-full bg-[var(--text)] transition-all duration-200 origin-center ${open ? 'translate-y-[7px] rotate-45' : ''}`}
        />
        <span
          className={`block h-[2px] w-5 rounded-full bg-[var(--text)] transition-all duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`}
        />
        <span
          className={`block h-[2px] w-5 rounded-full bg-[var(--text)] transition-all duration-200 origin-center ${open ? '-translate-y-[7px] -rotate-45' : ''}`}
        />
      </button>

      {/* backdrop-blur の containing block を逃れるため portal で body 直下に描画 */}
      {mounted && createPortal(
        <>
          {/* オーバーレイ */}
          <div
            className={`fixed inset-0 z-40 bg-black/30 md:hidden transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          {/* ドロワー */}
          <div
            ref={drawerRef}
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="ナビゲーションメニュー"
            className={`fixed top-0 right-0 z-50 h-full w-[280px] bg-[var(--surface)] border-l border-[var(--border)] flex flex-col transition-transform duration-300 ease-in-out md:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* ドロワーヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <Link href="/" onClick={() => setOpen(false)}>
                <Image src="/logo.jpg" alt="Insight Cast" width={1116} height={350} className="h-[32px] w-auto object-contain" sizes="120px" />
              </Link>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text3)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* ナビリンク */}
            <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="モバイルナビゲーション">
              <ul className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center rounded-[var(--r-sm)] px-4 py-3 text-[15px] font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* CTAエリア */}
            <div className="px-4 py-5 border-t border-[var(--border)] flex flex-col gap-2.5">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={getButtonClass('primary', 'w-full justify-center px-5 py-3 text-[15px]')}
                >
                  ダッシュボード
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signup"
                    onClick={() => setOpen(false)}
                    className={getButtonClass('primary', 'w-full justify-center px-5 py-3 text-[15px]')}
                  >
                    無料で試す →
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className={getButtonClass('ghost', 'w-full justify-center px-5 py-3 text-[15px]')}
                  >
                    ログイン
                  </Link>
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
