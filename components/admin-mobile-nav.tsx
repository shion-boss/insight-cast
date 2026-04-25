'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type NavLink = { href: string; label: string }

export function AdminMobileNav({
  navLinks,
  email,
}: {
  navLinks: NavLink[]
  email: string
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
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            ref={drawerRef}
            className={`fixed top-0 left-0 z-50 h-dvh w-[260px] bg-[#1c1410] flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
            role="dialog"
            aria-modal="true"
            aria-label="管理メニュー"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="font-serif text-[17px] font-bold text-white"
              >
                Insight <span className="text-[var(--accent)]">Cast</span>{' '}
                <span className="text-[11px] text-white/50">Admin</span>
              </Link>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setOpen(false)}
                className="w-11 h-11 flex items-center justify-center rounded-[var(--r-sm)] text-white/50 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex rounded-[var(--r-sm)] px-3 py-2.5 text-sm font-medium text-white/58 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-white/8 px-4 py-4">
              <p className="truncate text-xs text-white/50">{email}</p>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex w-full items-center justify-center rounded-[var(--r-sm)] border border-white/10 px-4 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-white/6 hover:text-white"
              >
                ← 顧客画面へ
              </Link>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
