'use client'

const EXCHANGE_RATE = 150

export function CostValue({ usd, className }: { usd: number; className?: string }) {
  const jpy = `¥${Math.round(usd * EXCHANGE_RATE).toLocaleString()}`
  const usdStr = `$${usd.toFixed(4)}`

  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      <span className="group-hover:hidden">{usdStr}</span>
      <span className="hidden group-hover:inline">{jpy}</span>
    </span>
  )
}

export function CostCard({
  label,
  usd,
  sub,
}: {
  label: string
  usd: number
  sub?: string
}) {
  return (
    <div className="group rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 cursor-default">
      <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">{label}</p>
      <CostValue usd={usd} className="mt-2 block font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]" />
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
  return (
    <section className="group rounded-[var(--r-lg)] border-2 border-[var(--accent)]/30 bg-[var(--accent-l)] p-5 cursor-default">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">今月の総コスト（概算）</p>
      <div className="mt-3 flex items-end gap-4">
        <CostValue usd={usd} className="font-[family-name:var(--font-noto-serif-jp)] text-3xl font-bold text-[var(--text)]" />
        <p className="mb-1 text-xs text-[var(--text3)]">
          固定費 <CostValue usd={fixedUsd} /> + API <CostValue usd={apiUsd} />
        </p>
      </div>
    </section>
  )
}
