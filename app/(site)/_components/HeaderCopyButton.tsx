'use client'

import { useState } from 'react'

/**
 * 記事エクスポートパネルのブロックカード見出し右に置く
 * クリップボードアイコン型のコピーボタン。
 * LP の Output Example で実物のデザインを再現するために使う。
 */
export function HeaderCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? 'コピーしました' : 'コピー'}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
        copied ? 'text-[var(--accent)]' : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--accent-l)]'
      }`}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="whitespace-nowrap">コピーしました</span>
        </>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}
