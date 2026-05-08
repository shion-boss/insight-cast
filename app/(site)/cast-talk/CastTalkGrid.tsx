'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CHARACTERS, getCastName } from '@/lib/characters'
import { getCastTalkStoryImage } from '@/lib/cast-talk-story-images'

const THEME_PALETTE: Record<string, { color: string; label: string }> = {
  mint:  { color: '#8a4a18', label: 'Customer Perspective' },
  claus: { color: '#0f766e', label: 'Industry Insight' },
  rain:  { color: '#7c3aed', label: 'Marketing Strategy' },
  hal:   { color: '#1d4ed8', label: 'Story & Picture' },
  mogro: { color: '#065f46', label: 'Deep Dive' },
  cocco: { color: '#be185d', label: 'Promotion' },
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  // ja-JP は "YYYY/MM/DD" 形式で返すため "." に変換
  return formatter.format(new Date(iso)).replace(/\//g, '.')
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
  const storyImg = getCastTalkStoryImage(talk.interviewer_id, talk.guest_id)
  const theme = THEME_PALETTE[talk.interviewer_id ?? ''] ?? { color: '#8a4a18', label: 'キャスト対談' }

  return (
    <Link
      href={`/cast-talk/${talk.slug}`}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-[var(--outline)] bg-[var(--surface)] shadow-[var(--elevation-3)] transition-colors duration-200 hover:bg-[#fdf6ee] sm:flex-row"
    >
      {/* 左: 画像エリア */}
      <div className="relative aspect-video overflow-hidden sm:aspect-auto sm:w-2/5">
        {storyImg ? (
          <Image
            src={storyImg}
            alt={`${getCastName(talk.interviewer_id ?? '')} × ${getCastName(talk.guest_id ?? '')}`}
            fill
            className="object-cover brightness-95 saturate-90"
            sizes="(min-width: 640px) 40vw, 100vw"
            placeholder="blur"
            priority
          />
        ) : (
          <div className="h-full bg-[var(--accent-l)]" />
        )}
        {/* LATEST バッジ */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-[6px] border border-[var(--outline)] bg-[var(--surface)] px-2.5 py-[5px]">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
          <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--on-surface)]">LATEST</span>
        </div>
      </div>

      {/* 右: コンテンツエリア */}
      <div className="flex flex-1 flex-col px-5 pb-[22px] pt-4 sm:py-6 sm:px-7">
        {/* テーマバッジ */}
        <div className="mb-3 flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-[6px] border border-[var(--outline)] bg-white px-2.5 py-[5px]">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
            <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--on-surface)]">{theme.label}</span>
          </div>
        </div>

        {/* キャラアイコン + 名前 */}
        <div className="mb-3 flex items-center gap-1.5">
          {[interviewer, guest].map((c, i) =>
            c ? (
              <div key={i} className="h-8 w-8 overflow-hidden rounded-full border-[1.5px] border-[var(--outline)] flex-shrink-0">
                <Image src={c.icon48} alt={c.name} width={32} height={32} className="h-full w-full object-cover" sizes="32px" />
              </div>
            ) : null,
          )}
          <span className="text-[11px] font-semibold text-[var(--on-surface-variant)]">
            {getCastName(talk.interviewer_id ?? '')} &amp; {getCastName(talk.guest_id ?? '')}
          </span>
        </div>

        {/* タイトル */}
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-[18px] font-bold leading-[1.5] text-[var(--on-surface)] mb-2.5 sm:text-[20px] transition-colors duration-200 group-hover:text-[var(--accent)]">
          {talk.title}
        </h2>

        {/* 区切り線 */}
        <div className="h-px bg-[var(--surface-container-high)] my-2.5" />

        {/* summary */}
        {talk.summary && (
          <p className="flex-1 border-l-2 pl-3 text-sm italic leading-[1.75] text-[var(--on-surface-variant)] line-clamp-3" style={{ borderColor: theme.color }}>
            「{talk.summary}」
          </p>
        )}

        {/* 日付 + 続きを読む */}
        <div className="mt-3.5 flex items-center justify-between">
          <span className="text-[11px] text-[var(--text2)]">{formatDate(talk.published_at)}</span>
          <span className="inline-block text-[11px] font-bold transition-transform duration-200 group-hover:translate-x-1" style={{ color: theme.color }}>続きを読む <span aria-hidden="true">→</span></span>
        </div>
      </div>
    </Link>
  )
}

const LIST_PAGE_SIZE = 10

function TalkListItem({ talk, fromPage = 0 }: { talk: Talk; fromPage?: number }) {
  const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
  const guest = CHARACTERS.find((c) => c.id === talk.guest_id)
  const theme = THEME_PALETTE[talk.interviewer_id ?? ''] ?? { color: '#8a4a18', label: 'キャスト対談' }
  const href = fromPage > 0 ? `/cast-talk/${talk.slug}?from=${fromPage}` : `/cast-talk/${talk.slug}`

  return (
    <Link
      href={href}
      className="group block min-h-[44px] px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
    >
      {/* 上段: テーマバッジ + キャラアイコン + 名前 */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {/* テーマバッジ */}
        <div className="flex items-center gap-1.5 rounded-[6px] border border-[var(--outline)] bg-white px-2 py-[4px]">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
          <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--on-surface)]">{theme.label}</span>
        </div>
        {/* キャラアイコン */}
        {[interviewer, guest].map((c, i) =>
          c ? (
            <div key={i} className="h-7 w-7 overflow-hidden rounded-full border-[1.5px] border-[var(--outline)]">
              <Image src={c.icon48} alt={c.name} width={28} height={28} className="h-full w-full object-cover" sizes="28px" />
            </div>
          ) : null,
        )}
        <span className="text-[11px] font-semibold text-[var(--on-surface-variant)]">
          {getCastName(talk.interviewer_id ?? '')} &amp; {getCastName(talk.guest_id ?? '')}
        </span>
      </div>

      {/* タイトル */}
      <h3 className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-[1.5] text-[var(--on-surface)] mb-2 transition-colors duration-200 group-hover:text-[var(--accent)]">
        {talk.title}
      </h3>

      {/* 区切り線 */}
      <div className="h-px bg-[var(--surface-container-high)] my-2.5" />

      {/* summary */}
      {talk.summary && (
        <p className="border-l-2 pl-3 text-sm italic leading-[1.75] text-[var(--on-surface-variant)] line-clamp-3" style={{ borderColor: theme.color }}>
          「{talk.summary}」
        </p>
      )}

      {/* 下段: 日付 + 続きを読む */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-[var(--text2)]">{formatDate(talk.published_at)}</span>
        <span className="text-[11px] font-bold transition-transform duration-200 group-hover:translate-x-1 inline-block" style={{ color: theme.color }}>続きを読む <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  )
}

export function CastTalkGrid({ featuredTalk, initialListTalks, initialListPage = 0, total }: {
  featuredTalk: Talk | null
  initialListTalks: Talk[]
  initialListPage?: number
  total: number
}) {
  const [listTalks, setListTalks] = useState<Talk[]>(initialListTalks)
  const [listPage, setListPage] = useState(initialListPage)
  const [loading, setLoading] = useState(false)

  // featured を除いたリスト件数
  const listTotalCount = Math.max(0, total - 1)
  const listTotalPages = Math.ceil(listTotalCount / LIST_PAGE_SIZE)

  async function goToPage(nextPage: number) {
    if (nextPage < 0 || nextPage >= listTotalPages) return
    // offset 1 は featured 分をスキップ
    const offset = 1 + nextPage * LIST_PAGE_SIZE
    setLoading(true)
    try {
      const res = await fetch(`/api/cast-talk/list?offset=${offset}&limit=${LIST_PAGE_SIZE}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { talks: Talk[] }
      setListTalks(json.talks)
      setListPage(nextPage)
      window.scrollTo({ top: 0, behavior: 'instant' })
    } catch {
      // ネットワークエラー時はページ状態を変えない
    } finally {
      setLoading(false)
    }
  }

  if (!featuredTalk && listTotalCount === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[var(--text2)]">まだ公開中の記事がありません</p>
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
              'divide-y divide-[#e8ddd0] overflow-hidden rounded-[16px] border border-[var(--outline)] bg-[var(--surface)]',
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
            <nav aria-label="ページネーション" className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goToPage(listPage - 1)}
                disabled={listPage === 0 || loading}
                aria-label="前のページへ"
                className="min-h-[44px] rounded-[var(--r-sm)] border-[1.5px] border-[var(--outline)] bg-[var(--surface)] px-5 py-2 text-sm font-semibold text-[var(--on-surface-variant)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span aria-hidden="true">←</span> 前へ
              </button>
              <span className="min-w-[80px] text-center text-sm text-[var(--on-surface-variant)]" aria-live="polite">
                {listPage + 1} / {listTotalPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(listPage + 1)}
                disabled={listPage >= listTotalPages - 1 || loading}
                aria-label="次のページへ"
                className="min-h-[44px] rounded-[var(--r-sm)] border-[1.5px] border-[var(--outline)] bg-[var(--surface)] px-5 py-2 text-sm font-semibold text-[var(--on-surface-variant)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                次へ <span aria-hidden="true">→</span>
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
