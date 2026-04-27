'use client'

import { useState } from 'react'

type FaqItem = { readonly q: string; readonly a: string }

export function LpFaq({ faqs }: { faqs: readonly FaqItem[] }) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set())

  function toggle(i: number) {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  return (
    <div className="divide-y divide-[var(--border)] rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {faqs.map((faq, i) => {
        const open = openSet.has(i)
        const answerId = `lp-faq-answer-${i}`
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 cursor-pointer text-left text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
              aria-expanded={open}
              aria-controls={answerId}
            >
              <span>{faq.q}</span>
              <span className={`text-[var(--text3)] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
            </button>
            {open && (
              <div id={answerId} className="px-6 pb-5 text-sm text-[var(--text2)] leading-[1.85]">{faq.a}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
