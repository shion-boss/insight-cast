'use client'

import Link from 'next/link'
import { useState } from 'react'
import { getButtonClass } from '@/components/ui'

type FaqGroup = {
  id: string
  label: string
  items: ReadonlyArray<{ readonly q: string; readonly a: string }>
}

function FaqGroupSection({ group }: { group: FaqGroup }) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set())

  function toggle(index: number) {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index); else next.add(index)
      return next
    })
  }

  return (
    <section id={group.id} className="scroll-mt-32">
      <h2 className="border-b border-[var(--border)] pb-4 font-serif text-2xl font-bold text-[var(--text)]">
        {group.label}
      </h2>
      <div className="mt-6 overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)]">
        {group.items.map((item, index) => {
          const open = openSet.has(index)
          return (
            <div key={item.q} className={index < group.items.length - 1 ? 'border-b border-[var(--border)]' : ''}>
              <button
                type="button"
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 bg-[var(--surface)] px-6 py-5 text-left transition-colors hover:bg-[var(--surface2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
                aria-expanded={open}
                aria-controls={`${group.id}-answer-${index}`}
              >
                <span className="text-[15px] font-semibold text-[var(--text)]">{item.q}</span>
                <span className={`text-[var(--text3)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
              </button>
              {open && (
                <div id={`${group.id}-answer-${index}`} className="bg-[var(--bg2)] px-6 pb-6 pt-4 text-sm leading-8 text-[var(--text2)]">
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function FaqContent({ groups }: { groups: readonly FaqGroup[] }) {
  const [activeId, setActiveId] = useState(groups[0]?.id ?? '')

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
        <div className="space-y-1">
          {groups.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              onClick={() => setActiveId(group.id)}
              className={`block rounded-[var(--r-sm)] border-l-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                activeId === group.id
                  ? 'border-[var(--accent)] bg-[var(--accent-l)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text2)] hover:text-[var(--accent)]'
              }`}
            >
              {group.label}
            </a>
          ))}
        </div>
      </aside>

      <div className="space-y-14">
        {groups.map((group) => (
          <FaqGroupSection key={group.id} group={group} />
        ))}

        <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <div aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-l)] text-2xl text-[var(--accent)]">
            ?
          </div>
          <h2 className="mt-5 font-serif text-2xl font-bold text-[var(--text)]">解決しない質問がありますか？</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text2)]">
            お問い合わせフォームからお気軽にご連絡ください。
          </p>
          <Link
            href="/contact"
            className={getButtonClass('primary', 'mt-6 px-6 py-3 text-sm')}
          >
            お問い合わせ <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
