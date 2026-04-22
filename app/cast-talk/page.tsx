import type { Metadata } from 'next'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { PublicFooter, PublicHeader, PublicHero, PublicPageFrame } from '@/components/public-layout'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHARACTERS, getCastName } from '@/lib/characters'

import mintXClaus from '@/assets/story/mint-x-claus.png'
import mintXRain from '@/assets/story/mint-x-rain.jpg'
import clausXRain from '@/assets/story/claus-x-rain.jpg'
import halXCocco from '@/assets/story/hal-x-cocco.png'
import halXMogro from '@/assets/story/hal-x-mogro.png'
import mogroXRain from '@/assets/story/mogro-x-rain.png'
import rainXCocco from '@/assets/story/rain-x-cocco.png'

export const metadata: Metadata = {
  title: 'Cast Talk | Insight Cast',
  description:
    'Insight CastのAIキャストたちが語り合う対話記事。ホームページを一次情報で育てるヒントを、キャストの視点でお届けします。',
}

type StoryKey = string
const STORY_IMAGE_MAP: Record<StoryKey, StaticImageData> = {
  'mint-claus': mintXClaus, 'claus-mint': mintXClaus,
  'mint-rain': mintXRain,   'rain-mint': mintXRain,
  'claus-rain': clausXRain, 'rain-claus': clausXRain,
  'hal-cocco': halXCocco,   'cocco-hal': halXCocco,
  'hal-mogro': halXMogro,   'mogro-hal': halXMogro,
  'mogro-rain': mogroXRain, 'rain-mogro': mogroXRain,
  'rain-cocco': rainXCocco, 'cocco-rain': rainXCocco,
}

function getStoryImage(id1: string, id2: string) {
  return STORY_IMAGE_MAP[`${id1}-${id2}`] ?? null
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

async function getPublishedTalks() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('cast_talks')
    .select('id, title, summary, interviewer_id, guest_id, slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return data ?? []
}

export default async function CastTalkPage() {
  const talks = await getPublishedTalks()

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <PublicHero
          compact
          eyebrow="Cast Talk"
          title={<>キャストの対話記事</>}
          description={
            <>
              ミント、クラウス、レインたちが語り合う対話記事。
              ホームページを育てるヒントを、キャストの視点でお届けします。
            </>
          }
          aside={
            <div className="space-y-4">
              <div className="flex -space-x-3">
                {['mint', 'claus', 'rain'].map((id) => {
                  const c = CHARACTERS.find((ch) => ch.id === id)
                  if (!c) return null
                  return (
                    <Image
                      key={id}
                      src={c.icon48}
                      alt={c.name}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-white"
                    />
                  )
                })}
              </div>
              <p className="text-sm leading-7 text-[var(--text2)]">
                AIキャストたちが日々の取材や気づきを語り合います。
              </p>
            </div>
          }
        />

        <section className="mx-auto max-w-[1160px] px-6 pb-20 sm:px-8 lg:px-12 pt-12">
          {talks.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-[var(--text3)]">まだ公開中の記事がありません</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {talks.map((talk) => {
                const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
                const guest = CHARACTERS.find((c) => c.id === talk.guest_id)
                const storyImg = getStoryImage(talk.interviewer_id ?? '', talk.guest_id ?? '')
                const theme = THEME_PALETTE[talk.interviewer_id ?? ''] ?? { color: '#c2722a', label: 'Cast Talk' }

                return (
                  <Link
                    key={talk.id}
                    href={`/cast-talk/${talk.slug}`}
                    className="group flex flex-col overflow-hidden rounded-[20px] border border-[#e2d5c3] bg-[#fffdf9] shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(0,0,0,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    {/* 画像エリア */}
                    <div className="relative h-[180px] overflow-hidden">
                      {storyImg ? (
                        <Image
                          src={storyImg}
                          alt={`${getCastName(talk.interviewer_id)} × ${getCastName(talk.guest_id)}`}
                          fill
                          className="object-cover brightness-95 saturate-90 transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full bg-[var(--accent-l)]" />
                      )}
                      {/* 下フェード */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#fffdf9] to-transparent" />
                      {/* テーマタグ */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-[6px] border border-[#e2d5c3] bg-[#fffdf9] px-2.5 py-[5px]">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
                        <span className="text-[11px] font-bold tracking-[0.08em] text-[#1c1410]">{theme.label}</span>
                      </div>
                    </div>

                    {/* ボディ */}
                    <div className="flex flex-1 flex-col px-5 pb-[22px] pt-1">
                      {/* キャストアイコン＋名前 */}
                      <div className="mb-3 flex items-center gap-1.5">
                        {[interviewer, guest].map((c, i) =>
                          c ? (
                            <div key={i} className="h-6 w-6 overflow-hidden rounded-full border-[1.5px] border-[#e2d5c3] flex-shrink-0">
                              <Image src={c.icon48} alt={c.name} width={24} height={24} className="h-full w-full object-cover" />
                            </div>
                          ) : null,
                        )}
                        <span className="text-[11px] font-semibold text-[#7a6555]">
                          {getCastName(talk.interviewer_id)} &amp; {getCastName(talk.guest_id)}
                        </span>
                      </div>

                      {/* タイトル */}
                      <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-[16px] font-bold leading-[1.5] text-[#1c1410] mb-2.5">
                        {talk.title}
                      </h2>

                      {/* 区切り線 */}
                      <div className="h-px bg-[#e8ddd0] my-2.5" />

                      {/* 要約（引用スタイル） */}
                      {talk.summary && (
                        <p className="flex-1 border-l-2 pl-3 text-[12px] italic leading-[1.75] text-[#7a6555]" style={{ borderColor: theme.color }}>
                          「{talk.summary}」
                        </p>
                      )}

                      {/* フッター */}
                      <div className="mt-3.5 flex items-center justify-between">
                        <span className="text-[11px] text-[#b8a898]">{formatDate(talk.published_at)}</span>
                        <span className="text-[11px] font-bold" style={{ color: theme.color }}>続きを読む →</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <PublicFooter showPromo={false} />
    </PublicPageFrame>
  )
}
