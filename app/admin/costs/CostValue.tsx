'use client'

import { useState } from 'react'

const EXCHANGE_RATE = 150

export function CostValue({ usd, className }: { usd: number; className?: string }) {
  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      ${usd.toFixed(4)}
    </span>
  )
}

export function CostCard({
  label,
  usd,
  sub,
  className,
}: {
  label: string
  usd: number
  sub?: string
  className?: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 cursor-default ${className ?? ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)] tabular-nums">
        {hovered
          ? `¥${Math.round(usd * EXCHANGE_RATE).toLocaleString()}`
          : `$${usd.toFixed(4)}`}
      </p>
      <p className="mt-0.5 text-xs text-[var(--text3)]">{sub ?? 'ホバーで円換算'}</p>
    </div>
  )
}

export function CostTotal({
  usd,
  fixedUsd,
  apiUsd,
}: {
  usd: number
  fixedUsd: number
  apiUsd: number
}) {
  const [hovered, setHovered] = useState(false)

  const fmt = (v: number) => hovered
    ? `¥${Math.round(v * EXCHANGE_RATE).toLocaleString()}`
    : `$${v.toFixed(2)}`

  return (
    <section
      className="rounded-[var(--r-lg)] border-2 border-[var(--accent)]/30 bg-[var(--accent-l)] p-5 cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">今月の総コスト（概算）</p>
      <div className="mt-3 flex items-end gap-4">
        <p className="font-[family-name:var(--font-noto-serif-jp)] text-3xl font-bold text-[var(--text)] tabular-nums">
          {fmt(usd)}
        </p>
        <p className="mb-1 text-xs text-[var(--text3)]">
          固定費 {fmt(fixedUsd)} + API {fmt(apiUsd)}
        </p>
      </div>
    </section>
  )
}
