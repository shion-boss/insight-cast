import type { Metadata } from 'next'
import Image from 'next/image'
import type { StaticImageData } from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumb, EyebrowBadge, getButtonClass } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHARACTERS } from '@/lib/characters'
import type { Character } from '@/lib/characters'
import { CastTalkContent } from './CastTalkContent'
import { ShareButtons } from '@/app/(site)/blog/[slug]/ShareButtons'
import mintXClaus from '@/assets/story/mint-x-claus.png'
import mintXRain from '@/assets/story/mint-x-rain.jpg'
import clausXRain from '@/assets/story/claus-x-rain.jpg'
import halXCocco from '@/assets/story/hal-x-cocco.png'
import halXMogro from '@/assets/story/hal-x-mogro.png'
import mogroXRain from '@/assets/story/mogro-x-rain.png'
import rainXCocco from '@/assets/story/rain-x-cocco.png'

const STORY_IMAGE_MAP: Record<string, StaticImageData> = {
  'mint-claus': mintXClaus, 'claus-mint': mintXClaus,
  'mint-rain': mintXRain,   'rain-mint': mintXRain,
  'claus-rain': clausXRain, 'rain-claus': clausXRain,
  'hal-cocco': halXCocco,   'cocco-hal': halXCocco,
  'hal-mogro': halXMogro,   'mogro-hal': halXMogro,
  'mogro-rain': mogroXRain, 'rain-mogro': mogroXRain,
  'rain-cocco': rainXCocco, 'cocco-rain': rainXCocco,
}

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

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const talk = await getCastTalk(slug)
  if (!talk) return { title: 'Cast Talk | Insight Cast' }
  const title = `${talk.title} | Cast Talk | Insight Cast`
  const description = talk.summary ?? 'Insight CastのAIキャストによる対話記事。'
  return {
    title,
    description,
    alternates: { canonical: `${APP_URL}/cast-talk/${slug}` },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/cast-talk/${slug}`,
      siteName: 'Insight Cast',
      locale: 'ja_JP',
      type: 'article',
      publishedTime: talk.published_at ? new Date(talk.published_at).toISOString() : undefined,
      authors: ['Insight Cast'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CastTalkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { slug } = await params
  const { from } = await searchParams
  const fromPage = Math.max(0, Number(from ?? '0'))
  const backHref = fromPage > 0 ? `/cast-talk?page=${fromPage}` : '/cast-talk'
  const talk = await getCastTalk(slug)
  if (!talk) notFound()

  const characterMap: Record<string, Character> = {}
  for (const c of CHARACTERS) {
    characterMap[c.id] = c
  }

  const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
  const guest = CHARACTERS.find((c) => c.id === talk.guest_id)
  const storyImage = STORY_IMAGE_MAP[`${talk.interviewer_id}-${talk.guest_id}`] ?? null

  const talkUrl = `${APP_URL}/cast-talk/${slug}`

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: talk.title,
    description: talk.summary ?? undefined,
    datePublished: talk.published_at ?? undefined,
    url: talkUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Insight Cast',
      url: APP_URL,
    },
    ...(interviewer && {
      author: { '@type': 'Person', name: interviewer.name },
    }),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Cast Talk', item: `${APP_URL}/cast-talk` },
      { '@type': 'ListItem', position: 3, name: talk.title, item: talkUrl },
    ],
  }

  const raw = Array.isArray(talk.messages) ? talk.messages : []
  const messages: Message[] = raw.filter(
    (m): m is Message =>
      m !== null &&
      typeof m === 'object' &&
      typeof (m as Record<string, unknown>).castId === 'string' &&
      typeof (m as Record<string, unknown>).text === 'string',
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="relative z-10">
        {/* ヒーロー */}
        <section className="bg-gradient-to-br from-[#fdf7f0] to-[#f5e8d8] px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-16">
          <div className="mx-auto max-w-3xl">
            <Breadcrumb items={[
              { label: 'Cast Talk', href: '/cast-talk' },
              { label: talk.title },
            ]} />
            <EyebrowBadge>Cast Talk</EyebrowBadge>

            <h1 className="mt-4 text-2xl font-semibold leading-snug tracking-[-0.03em] text-[var(--text)] sm:text-3xl lg:text-4xl">
              {talk.title}
            </h1>

            {talk.summary && (
              <p className="mt-3 text-sm leading-7 text-[var(--text2)] sm:mt-4 sm:text-base sm:leading-8">{talk.summary}</p>
            )}

            {talk.published_at && (
              <p className="mt-3 text-sm text-[var(--text3)]">{formatDate(talk.published_at)}</p>
            )}

            {/* ストーリー画像 */}
            {storyImage && (
              <div className="relative mt-6 aspect-video overflow-hidden rounded-xl sm:mt-8 sm:rounded-2xl">
                <Image
                  src={storyImage}
                  alt={`${interviewer?.name ?? ''}と${guest?.name ?? ''}の対話`}
                  fill
                  className="object-cover"
                  placeholder="blur"
                />
              </div>
            )}

            {/* プロフィールカード */}
            {(interviewer ?? guest) && (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                {[interviewer, guest].filter(Boolean).map((char) => (
                  <div key={char!.id} className="flex gap-3 rounded-xl border border-[var(--border)] bg-white/60 p-3 backdrop-blur-sm sm:p-4">
                    <Image
                      src={char!.icon96}
                      alt={char!.name}
                      width={96}
                      height={96}
                      className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-sm sm:h-12 sm:w-12"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-semibold text-[var(--text)]">{char!.name}</span>
                        <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--accent)]">
                          {char!.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--text2)] sm:text-[13px]">{char!.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 会話コンテンツ */}
        <section className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
          <CastTalkContent messages={messages} characterMap={characterMap} interviewerId={talk.interviewer_id} />
        </section>

        {/* シェアボタン */}
        <section className="mx-auto max-w-3xl px-6 pb-4 sm:px-8">
          <ShareButtons title={talk.title} url={talkUrl} />
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

        {/* Cast Talk 一覧へ */}
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
            <Link
              href={backHref}
              className="group flex items-center gap-2 text-sm text-[var(--text3)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded"
            >
              <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Cast Talk の記事一覧へ</span>
            </Link>
          </div>
        </section>

      </main>


    </>
  )
}
