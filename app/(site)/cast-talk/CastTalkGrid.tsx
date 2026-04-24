'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CHARACTERS, getCastName } from '@/lib/characters'

import mintXClaus from '@/assets/story/mint-x-claus.png'
import mintXRain from '@/assets/story/mint-x-rain.jpg'
import clausXRain from '@/assets/story/claus-x-rain.jpg'
import halXCocco from '@/assets/story/hal-x-cocco.png'
import halXMogro from '@/assets/story/hal-x-mogro.png'
import mogroXRain from '@/assets/story/mogro-x-rain.png'
import rainXCocco from '@/assets/story/rain-x-cocco.png'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STORY_IMAGE_MAP: Record<string, any> = {
  'mint-claus': mintXClaus, 'claus-mint': mintXClaus,
  'mint-rain': mintXRain,   'rain-mint': mintXRain,
  'claus-rain': clausXRain, 'rain-claus': clausXRain,
  'hal-cocco': halXCocco,   'cocco-hal': halXCocco,
  'hal-mogro': halXMogro,   'mogro-hal': halXMogro,
  'mogro-rain': mogroXRain, 'rain-mogro': mogroXRain,
  'rain-cocco': rainXCocco, 'cocco-rain': rainXCocco,
}

const THEME_PALETTE: Record<string, { color: string; label: string }> = {
  mint:  { color: '#c2722a', label: 'Customer Perspective' },
  claus: { color: '#0f766e', label: 'Industry Insight' },
  rain:  { color: '#7c3aed', label: 'Marketing Strategy' },
  hal:   { color: '#1d4ed8', label: 'Story & People' },
  mogro: { color: '#065f46', label: 'Deep Dive' },
  cocco: { color: '#be185d', label: 'Promotion' },
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

type Talk = {
  id: string
  title: string | null
  summary: string | null
  interviewer_id: string | null
  guest_id: string | null
  slug: string
  published_at: string | null
}

function TalkCard({ talk }: { talk: Talk }) {
  const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
  const guest = CHARACTERS.find((c) => c.id === talk.guest_id)
  const storyImg = STORY_IMAGE_MAP[`${talk.interviewer_id}-${talk.guest_id}`] ?? null
  const theme = THEME_PALETTE[talk.interviewer_id ?? ''] ?? { color: '#c2722a', label: 'Cast Talk' }

  return (
    <Link
      href={`/cast-talk/${talk.slug}`}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-[#e2d5c3] bg-[#fffdf9] shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(0,0,0,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
    >
      <div className="relative aspect-video overflow-hidden">
        {storyImg ? (
          <Image
            src={storyImg}
            alt={`${getCastName(talk.interviewer_id ?? '')} × ${getCastName(talk.guest_id ?? '')}`}
            fill
            className="object-cover brightness-95 saturate-90"
          />
        ) : (
          <div className="h-full bg-[var(--accent-l)]" />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#fffdf9] to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-[6px] border border-[#e2d5c3] bg-[#fffdf9] px-2.5 py-[5px]">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#1c1410]">{theme.label}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-[22px] pt-1">
        <div className="mb-3 flex items-center gap-1.5">
          {[interviewer, guest].map((c, i) =>
            c ? (
              <div key={i} className="h-6 w-6 overflow-hidden rounded-full border-[1.5px] border-[#e2d5c3] flex-shrink-0">
                <Image src={c.icon48} alt={c.name} width={24} height={24} className="h-full w-full object-cover" />
              </div>
            ) : null,
          )}
          <span className="text-[11px] font-semibold text-[#7a6555]">
            {getCastName(talk.interviewer_id ?? '')} &amp; {getCastName(talk.guest_id ?? '')}
          </span>
        </div>

        <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-[16px] font-bold leading-[1.5] text-[#1c1410] mb-2.5">
          {talk.title}
        </h2>

        <div className="h-px bg-[#e8ddd0] my-2.5" />

        {talk.summary && (
          <p className="flex-1 border-l-2 pl-3 text-[12px] italic leading-[1.75] text-[#7a6555]" style={{ borderColor: theme.color }}>
            「{talk.summary}」
          </p>
        )}

        <div className="mt-3.5 flex items-center justify-between">
          <span className="text-[11px] text-[#b8a898]">{formatDate(talk.published_at)}</span>
          <span className="text-[11px] font-bold" style={{ color: theme.color }}>続きを読む →</span>
        </div>
      </div>
    </Link>
  )
}

export function CastTalkGrid({ initialTalks, total, pageSize }: {
  initialTalks: Talk[]
  total: number
  pageSize: number
}) {
  const [talks, setTalks] = useState<Talk[]>(initialTalks)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)

  const hasMore = talks.length < total

  async function loadMore() {
    setLoading(true)
    const nextPage = page + 1
    const res = await fetch(`/api/cast-talk/list?page=${nextPage}`)
    const json = await res.json()
    setTalks((prev) => [...prev, ...json.talks])
    setPage(nextPage)
    setLoading(false)
  }

  if (talks.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[var(--text3)]">まだ公開中の記事がありません</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {talks.map((talk) => <TalkCard key={talk.id} talk={talk} />)}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-[var(--r-sm)] border-[1.5px] border-[#e2d5c3] bg-[#fffdf9] px-8 py-3 text-sm font-semibold text-[#7a6555] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
          >
            {loading ? '読み込み中...' : `もっと見る（残り ${total - talks.length} 件）`}
          </button>
        </div>
      )}
    </div>
  )
}
