import Image from 'next/image'
import Link from 'next/link'

import { CHARACTERS } from '@/lib/characters'

// テーマカラー（11px の "続きを読む" や境界線の border-color に使用）。
// AA を満たす濃さに揃えている: mint は --on-primary-container、他は元から
// AA pass する濃色なのでそのまま。
const CAST_TALK_THEME: Record<string, { color: string; label: string }> = {
  mint:  { color: '#8a4a18', label: 'Customer Perspective' },
  claus: { color: '#0f766e', label: 'Industry Insight' },
  rain:  { color: '#7c3aed', label: 'Marketing Strategy' },
  hal:   { color: '#1d4ed8', label: 'Story & People' },
  mogro: { color: '#065f46', label: 'Deep Dive' },
  cocco: { color: '#be185d', label: 'Promotion' },
}

export type CastTalkPreviewItem = {
  id: string
  title: string | null
  summary: string | null
  interviewer_id: string | null
  guest_id: string | null
  slug: string
  published_at: string | null
}

export function CastTalkPreview({ latestTalks }: { latestTalks: CastTalkPreviewItem[] | null }) {
  if (!latestTalks || latestTalks.length === 0) return null

  return (
    <section className="py-14 sm:py-[88px] bg-[var(--bg)]">
      <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--on-primary-container)]">Cast Talk</div>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
          キャストの対話
        </h2>
        <p className="text-base text-[var(--text2)] mt-3">キャスト同士の対話で、ホームページの育て方を学ぶ。</p>
        <div className="mt-8 divide-y divide-[#e8ddd0] overflow-hidden rounded-[16px] border border-[var(--outline)] bg-[var(--surface)]">
          {latestTalks.map((talk) => {
            const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
            const guest = CHARACTERS.find((c) => c.id === talk.guest_id)
            const theme = CAST_TALK_THEME[talk.interviewer_id ?? ''] ?? { color: '#8a4a18', label: 'Cast Talk' }
            const dateStr = talk.published_at
              ? (() => { const d = new Date(talk.published_at!); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}` })()
              : ''
            return (
              <Link
                key={talk.id}
                href={`/cast-talk/${talk.slug}`}
                className="group block px-5 py-5 transition-colors duration-200 hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-[6px] border border-[var(--outline)] bg-white px-2 py-[4px]">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
                    <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--on-surface)]">{theme.label}</span>
                  </div>
                  {[interviewer, guest].map((c, i) =>
                    c ? (
                      <div key={i} className="h-7 w-7 overflow-hidden rounded-full border-[1.5px] border-[var(--outline)] flex-shrink-0">
                        <Image src={c.icon48} alt={c.name} width={28} height={28} className="h-full w-full object-cover" />
                      </div>
                    ) : null,
                  )}
                  <span className="text-[11px] font-semibold text-[var(--on-surface-variant)]">
                    {interviewer?.name ?? talk.interviewer_id} &amp; {guest?.name ?? talk.guest_id}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold leading-[1.5] text-[var(--on-surface)] mb-2 transition-colors duration-200 group-hover:text-[var(--accent)]">
                  {talk.title}
                </h3>
                <div className="h-px bg-[var(--surface-container-high)] my-2.5" />
                {talk.summary && (
                  <p className="border-l-2 pl-3 text-sm italic leading-[1.75] text-[var(--on-surface-variant)]" style={{ borderColor: theme.color }}>
                    「{talk.summary}」
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text3)]">{dateStr}</span>
                  <span className="text-[11px] font-bold transition-transform duration-200 group-hover:translate-x-1 inline-block" style={{ color: theme.color }}>続きを読む <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="text-center mt-8">
          <Link href="/cast-talk" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
            Cast Talk をもっと読む <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
