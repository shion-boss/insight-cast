import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicFooter, PublicHeader, PublicHero, PublicPageFrame } from '@/components/public-layout'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHARACTERS } from '@/lib/characters'

export const metadata: Metadata = {
  title: 'Cast Talk | Insight Cast',
  description:
    'Insight CastのAIキャストたちが語り合う対話記事。ホームページを一次情報で育てるヒントを、キャストの視点でお届けします。',
}

const CAST_NAMES: Record<string, string> = {
  mint: 'ミント',
  claus: 'クラウス',
  rain: 'レイン',
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

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
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
                return (
                  <Link
                    key={talk.id}
                    href={`/cast-talk/${talk.slug}`}
                    className="group flex flex-col gap-4 rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-150 hover:border-[var(--border2)] hover:shadow-[0_16px_48px_var(--shadow)] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    {/* キャストアイコン */}
                    <div className="flex items-center gap-2">
                      {[interviewer, guest].map((c, i) =>
                        c ? (
                          <Image
                            key={i}
                            src={c.icon48}
                            alt={c.name}
                            width={36}
                            height={36}
                            className="rounded-full border border-[var(--border)]"
                          />
                        ) : null,
                      )}
                      <span className="text-xs text-[var(--text3)]">
                        {CAST_NAMES[talk.interviewer_id] ?? talk.interviewer_id} &amp;{' '}
                        {CAST_NAMES[talk.guest_id] ?? talk.guest_id}
                      </span>
                    </div>

                    <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-base font-semibold leading-snug text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                      {talk.title}
                    </h2>

                    {talk.summary && (
                      <p className="line-clamp-2 text-sm leading-6 text-[var(--text2)]">
                        {talk.summary}
                      </p>
                    )}

                    {talk.published_at && (
                      <p className="mt-auto text-xs text-[var(--text3)]">
                        {formatDate(talk.published_at)}
                      </p>
                    )}
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
