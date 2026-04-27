'use client'

import { useState, useEffect } from 'react'
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

function FeaturedTalkCard({ talk }: { talk: Talk }) {
  const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
  const guest = CHARACTERS.find((c) => c.id === talk.guest_id)
  const storyImg = STORY_IMAGE_MAP[`${talk.interviewer_id}-${talk.guest_id}`] ?? null
  const theme = THEME_PALETTE[talk.interviewer_id ?? ''] ?? { color: '#c2722a', label: 'Cast Talk' }

  return (
    <Link
      href={`/cast-talk/${talk.slug}`}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-[#e2d5c3] bg-[#fffdf9] shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-colors duration-200 hover:bg-[#fdf6ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 sm:flex-row"
    >
      {/* 左: 画像エリア */}
      <div className="relative aspect-video overflow-hidden sm:aspect-auto sm:w-2/5">
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
        {/* LATEST バッジ */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-[6px] border border-[#e2d5c3] bg-[#fffdf9] px-2.5 py-[5px]">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#1c1410]">LATEST</span>
        </div>
      </div>

      {/* 右: コンテンツエリア */}
      <div className="flex flex-1 flex-col px-5 pb-[22px] pt-4 sm:py-6 sm:px-7">
        {/* テーマバッジ */}
        <div className="mb-3 flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-[6px] border border-[#e2d5c3] bg-white px-2.5 py-[5px]">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
            <span className="text-[11px] font-bold tracking-[0.08em] text-[#1c1410]">{theme.label}</span>
          </div>
        </div>

        {/* キャラアイコン + 名前 */}
        <div className="mb-3 flex items-center gap-1.5">
          {[interviewer, guest].map((c, i) =>
            c ? (
              <div key={i} className="h-8 w-8 overflow-hidden rounded-full border-[1.5px] border-[#e2d5c3] flex-shrink-0">
                <Image src={c.icon48} alt={c.name} width={32} height={32} className="h-full w-full object-cover" />
              </div>
            ) : null,
          )}
          <span className="text-[11px] font-semibold text-[#7a6555]">
            {getCastName(talk.interviewer_id ?? '')} &amp; {getCastName(talk.guest_id ?? '')}
          </span>
        </div>

        {/* タイトル */}
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-[18px] font-bold leading-[1.5] text-[#1c1410] mb-2.5 sm:text-[20px] transition-colors duration-200 group-hover:text-[var(--accent)]">
          {talk.title}
        </h2>

        {/* 区切り線 */}
        <div className="h-px bg-[#e8ddd0] my-2.5" />

        {/* summary */}
        {talk.summary && (
          <p className="flex-1 border-l-2 pl-3 text-sm italic leading-[1.75] text-[#7a6555]" style={{ borderColor: theme.color }}>
            「{talk.summary}」
          </p>
        )}

        {/* 日付 + 続きを読む */}
        <div className="mt-3.5 flex items-center justify-between">
          <span className="text-[11px] text-[#b8a898]">{formatDate(talk.published_at)}</span>
          <span className="inline-block text-[11px] font-bold transition-transform duration-200 group-hover:translate-x-1" style={{ color: theme.color }}>続きを読む →</span>
        </div>
      </div>
    </Link>
  )
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
              <div key={i} className="h-8 w-8 overflow-hidden rounded-full border-[1.5px] border-[#e2d5c3] flex-shrink-0">
                <Image src={c.icon48} alt={c.name} width={32} height={32} className="h-full w-full object-cover" />
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
          <p className="flex-1 border-l-2 pl-3 text-sm italic leading-[1.75] text-[#7a6555]" style={{ borderColor: theme.color }}>
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

const LIST_PAGE_SIZE = 10

function TalkListItem({ talk, fromPage = 0 }: { talk: Talk; fromPage?: number }) {
  const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
  const guest = CHARACTERS.find((c) => c.id === talk.guest_id)
  const theme = THEME_PALETTE[talk.interviewer_id ?? ''] ?? { color: '#c2722a', label: 'Cast Talk' }
  const href = fromPage > 0 ? `/cast-talk/${talk.slug}?from=${fromPage}` : `/cast-talk/${talk.slug}`

  return (
    <Link
      href={href}
      className="group block min-h-[44px] px-5 py-5 transition-colors duration-200 hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
    >
      {/* 上段: テーマバッジ + キャラアイコン + 名前 */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {/* テーマバッジ */}
        <div className="flex items-center gap-1.5 rounded-[6px] border border-[#e2d5c3] bg-white px-2 py-[4px]">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#1c1410]">{theme.label}</span>
        </div>
        {/* キャラアイコン */}
        {[interviewer, guest].map((c, i) =>
          c ? (
            <div key={i} className="h-7 w-7 overflow-hidden rounded-full border-[1.5px] border-[#e2d5c3]">
              <Image src={c.icon48} alt={c.name} width={28} height={28} className="h-full w-full object-cover" />
            </div>
          ) : null,
        )}
        <span className="text-[11px] font-semibold text-[#7a6555]">
          {getCastName(talk.interviewer_id ?? '')} &amp; {getCastName(talk.guest_id ?? '')}
        </span>
      </div>

      {/* タイトル */}
      <h3 className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-[1.5] text-[#1c1410] mb-2 transition-colors duration-200 group-hover:text-[var(--accent)]">
        {talk.title}
      </h3>

      {/* 区切り線 */}
      <div className="h-px bg-[#e8ddd0] my-2.5" />

      {/* summary */}
      {talk.summary && (
        <p className="border-l-2 pl-3 text-sm italic leading-[1.75] text-[#7a6555]" style={{ borderColor: theme.color }}>
          「{talk.summary}」
        </p>
      )}

      {/* 下段: 日付 + 続きを読む */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-[#b8a898]">{formatDate(talk.published_at)}</span>
        <span className="text-[11px] font-bold transition-transform duration-200 group-hover:translate-x-1 inline-block" style={{ color: theme.color }}>続きを読む →</span>
      </div>
    </Link>
  )
}

export function CastTalkGrid({ initialTalks, total, initialPage = 0 }: {
  initialTalks: Talk[]
  total: number
  pageSize?: number
  initialPage?: number
}) {
  const [featuredTalk] = useState<Talk | null>(initialTalks[0] ?? null)
  const [listTalks, setListTalks] = useState<Talk[]>(initialTalks.slice(1))
  const [listPage, setListPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)

  // featured を除いたリスト件数
  const listTotalCount = Math.max(0, total - 1)
  const listTotalPages = Math.ceil(listTotalCount / LIST_PAGE_SIZE)

  async function goToPage(nextPage: number) {
    if (nextPage < 0 || nextPage >= listTotalPages) return
    // offset 1 は featured 分をスキップ
    const offset = 1 + nextPage * LIST_PAGE_SIZE
    setLoading(true)
    const res = await fetch(`/api/cast-talk/list?offset=${offset}&limit=${LIST_PAGE_SIZE}`)
    const json = (await res.json()) as { talks: Talk[] }
    setListTalks(json.talks)
    setListPage(nextPage)
    setLoading(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  // initialPage > 0 の場合、サーバーから渡された initialTalks は page 0 のデータなので
  // マウント時に正しいページのデータを取得する
  useEffect(() => {
    if (initialPage > 0) {
      void goToPage(initialPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!featuredTalk && listTotalCount === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[var(--text3)]">まだ公開中の記事がありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* featured card */}
      {featuredTalk && listPage === 0 && (
        <FeaturedTalkCard talk={featuredTalk} />
      )}

      {/* リストセクション */}
      {listTotalCount > 0 && (
        <div>
          <div
            className={[
              'divide-y divide-[#e8ddd0] overflow-hidden rounded-[16px] border border-[#e2d5c3] bg-[#fffdf9]',
              'transition-opacity duration-300',
              loading ? 'opacity-40' : 'opacity-100',
            ].join(' ')}
          >
            {listTalks.map((talk) => (
              <TalkListItem key={talk.id} talk={talk} fromPage={listPage} />
            ))}
          </div>

          {/* ページネーション */}
          {listTotalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goToPage(listPage - 1)}
                disabled={listPage === 0 || loading}
                className="min-h-[44px] rounded-[var(--r-sm)] border-[1.5px] border-[#e2d5c3] bg-[#fffdf9] px-5 py-2 text-sm font-semibold text-[#7a6555] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                ← 前へ
              </button>
              <span className="min-w-[80px] text-center text-sm text-[#7a6555]">
                {listPage + 1} / {listTotalPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(listPage + 1)}
                disabled={listPage >= listTotalPages - 1 || loading}
                className="min-h-[44px] rounded-[var(--r-sm)] border-[1.5px] border-[#e2d5c3] bg-[#fffdf9] px-5 py-2 text-sm font-semibold text-[#7a6555] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                次へ →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
