import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicFooter, PublicHeader, PublicPageFrame } from '@/components/public-layout'
import { EyebrowBadge, getButtonClass } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHARACTERS } from '@/lib/characters'
import type { Character } from '@/lib/characters'
import { CastTalkContent } from './CastTalkContent'

type Message = {
  castId: string
  text: string
}

async function getCastTalk(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('cast_talks')
    .select('id, title, theme, format, interviewer_id, guest_id, messages, summary, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const talk = await getCastTalk(slug)
  if (!talk) return { title: 'Cast Talk | Insight Cast' }
  return {
    title: `${talk.title} | Cast Talk | Insight Cast`,
    description: talk.summary ?? undefined,
  }
}

export default async function CastTalkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const talk = await getCastTalk(slug)
  if (!talk) notFound()

  const characterMap: Record<string, Character> = {}
  for (const c of CHARACTERS) {
    characterMap[c.id] = c
  }

  const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
  const guest = CHARACTERS.find((c) => c.id === talk.guest_id)

  const messages = (talk.messages as unknown as Message[]) ?? []

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        {/* ヒーロー */}
        <section className="bg-gradient-to-br from-[#fdf7f0] to-[#f5e8d8] px-6 pb-12 pt-12 sm:pt-16">
          <div className="mx-auto max-w-3xl">
            <EyebrowBadge>Cast Talk</EyebrowBadge>

            {/* キャストアイコン */}
            <div className="mt-6 flex items-center gap-3">
              {[interviewer, guest].map((c, i) =>
                c ? (
                  <div key={i} className="flex items-center gap-2">
                    <Image
                      src={c.icon96}
                      alt={c.name}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-white shadow-sm"
                    />
                    <span className="text-sm font-medium text-[var(--text2)]">{c.name}</span>
                  </div>
                ) : null,
              )}
              {interviewer && guest && (
                <span className="text-[var(--text3)]">×</span>
              )}
            </div>

            <h1 className="mt-4 text-balance text-3xl font-semibold leading-snug tracking-[-0.03em] text-[var(--text)] sm:text-4xl">
              {talk.title}
            </h1>

            {talk.summary && (
              <p className="mt-4 text-base leading-8 text-[var(--text2)]">{talk.summary}</p>
            )}

            {talk.published_at && (
              <p className="mt-3 text-sm text-[var(--text3)]">{formatDate(talk.published_at)}</p>
            )}
          </div>
        </section>

        {/* 会話コンテンツ */}
        <section className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
          <CastTalkContent messages={messages} characterMap={characterMap} />
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
            <div className="flex items-center gap-4">
              {interviewer && (
                <Image
                  src={interviewer.icon96}
                  alt={interviewer.name}
                  width={56}
                  height={56}
                  className="rounded-full border-2 border-[var(--border)]"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--text)]">
                  {interviewer?.name ?? 'キャスト'}に取材してもらう
                </p>
                <p className="mt-0.5 text-sm text-[var(--text2)]">
                  あなたの事業の当たり前を、{interviewer?.name ?? 'キャスト'}が引き出します。
                </p>
              </div>
              <Link href="/pricing" className={getButtonClass('primary', 'shrink-0')}>
                詳しく見る
              </Link>
            </div>
          </div>
        </section>

        {/* 記事一覧へ戻る */}
        <div className="mx-auto max-w-3xl px-6 py-6 sm:px-8">
          <Link
            href="/cast-talk"
            className="text-sm text-[var(--text3)] transition-colors hover:text-[var(--text)]"
          >
            ← Cast Talk 一覧に戻る
          </Link>
        </div>
      </main>

      <PublicFooter showPromo={false} />
    </PublicPageFrame>
  )
}
