'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // クリップボードAPIが使えない場合は何もしない
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="ml-auto border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-3 py-1 text-xs font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
    >
      {copied ? 'コピーしました' : 'コピー'}
    </button>
  )
}
