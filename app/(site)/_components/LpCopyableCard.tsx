'use client'

import { useState, type ReactNode } from 'react'

/**
 * LP の Output Example で使う、丸ごとクリックできるカード。
 * カード全体の click / Enter / Space でテキストをクリップボードにコピーする。
 * 右肩のアイコンはコピー状態の表示専用（独立したフォーカスは持たない）。
 *
 * variant:
 *  - 'card'     : 角丸＋枠線つきの単独カード（タイトル / 概要）
 *  - 'segment'  : 親カード内のセクション（小見出し / 本文）。枠線なし
 */
export function LpCopyableCard({
  text,
  label,
  variant = 'card',
  children,
}: {
  text: string
  label: string
  variant?: 'card' | 'segment'
  children: ReactNode
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const wrapperClass =
    variant === 'card'
      ? 'rounded-[14px] border border-[var(--border)] bg-[var(--surface)]'
      : ''

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={copy}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          copy()
        }
      }}
      aria-label={copied ? `${label}をコピーしました` : `${label}をコピーする`}
      className={`group cursor-pointer transition-colors hover:bg-[var(--accent-l)] select-none focus-visible:ring-inset ${wrapperClass}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text2)]">{label}</div>
        <span
          aria-hidden="true"
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold leading-none min-h-[26px] transition-colors ${
            copied ? 'text-[var(--accent)]' : 'text-[var(--text2)] group-hover:text-[var(--text)]'
          }`}
        >
          {copied && <span className="whitespace-nowrap">コピーしました</span>}
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </span>
      </div>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</div>
    </div>
  )
}
