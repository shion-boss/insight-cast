import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumb, getButtonClass } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHARACTERS } from '@/lib/characters'
import type { Character } from '@/lib/characters'
import { CastTalkContent } from './CastTalkContent'
import { ShareButtons } from '@/app/(site)/blog/[slug]/ShareButtons'
import { getCastTalkStoryImage } from '@/lib/cast-talk-story-images'

type Message = {
  castId: string
  text: string
}

async function getCastTalk(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('cast_talks')
    .select('id, title, theme, format, interviewer_id, guest_id, messages, summary, published_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso))
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
      images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo.jpg'],
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
  const storyImage = getCastTalkStoryImage(talk.interviewer_id, talk.guest_id)

  const talkUrl = `${APP_URL}/cast-talk/${slug}`

  // 会話メッセージの合計文字数を wordCount として渡す（記事ボリュームの信頼シグナル）
  const conversationWordCount = (() => {
    const messages = Array.isArray(talk.messages) ? talk.messages : []
    return messages.reduce((acc: number, m: { text?: string }) => acc + (m?.text?.replace(/\s+/g, '').length ?? 0), 0)
  })()

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: talk.title,
    description: talk.summary ?? undefined,
    datePublished: talk.published_at ?? undefined,
    dateModified: talk.updated_at ?? talk.published_at ?? undefined,
    url: talkUrl,
    image: `${APP_URL}/cast-talk/${slug}/opengraph-image`,
    publisher: {
      '@type': 'Organization',
      name: 'Insight Cast',
      url: APP_URL,
    },
    ...(interviewer && {
      author: {
        '@type': 'Person',
        name: `${interviewer.name}（Insight Cast AIキャスト）`,
        knowsAbout: interviewer.specialty ? [interviewer.specialty] : undefined,
      },
    }),
    articleSection: 'Cast Talk',
    keywords: ['Cast Talk', 'AIキャスト対話', 'Insight Cast', interviewer?.name, guest?.name].filter(Boolean).join(', '),
    wordCount: conversationWordCount,
    inLanguage: 'ja',
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

      <main id="main-content" className="relative z-10">
        {/* ヒーロー */}
        <section aria-label="記事タイトルと登場キャスト" className="bg-gradient-to-br from-[#fdf7f0] to-[#f5e8d8] px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-16">
          <div className="mx-auto max-w-3xl">
            <Breadcrumb items={[
              { label: 'Cast Talk', href: '/cast-talk' },
              { label: talk.title },
            ]} />
            <p className="mt-2 text-[13px] font-semibold tracking-[0.18em] uppercase text-[var(--accent)]">Cast Talk</p>

            <h1 className="mt-4 text-2xl font-semibold leading-snug tracking-[-0.03em] text-[var(--text)] sm:text-3xl lg:text-4xl">
              {talk.title}
            </h1>

            {talk.summary && (
              <p className="mt-3 text-sm leading-7 text-[var(--text2)] sm:mt-4 sm:text-base sm:leading-8">{talk.summary}</p>
            )}

            {talk.published_at && (
              <p className="mt-3 text-sm text-[var(--text2)]">{formatDate(talk.published_at)}</p>
            )}

            {/* ストーリー画像 */}
            {storyImage && (
              <div className="relative mt-6 aspect-video overflow-hidden rounded-xl sm:mt-8 sm:rounded-2xl">
                <Image
                  src={storyImage}
                  alt={`${interviewer?.name ?? ''}と${guest?.name ?? ''}の対話`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 720px, 100vw"
                  placeholder="blur"
                  priority
                />
              </div>
            )}

            {/* プロフィールカード */}
            {(interviewer ?? guest) && (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                {([interviewer, guest] as Array<Character | undefined>).filter((c): c is Character => Boolean(c)).map((char) => (
                  <div key={char.id} className="flex gap-3 rounded-xl border border-[var(--border)] bg-white/60 p-3 backdrop-blur-sm sm:p-4">
                    <Image
                      src={char.icon96}
                      alt={char.name}
                      width={96}
                      height={96}
                      className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-[var(--elevation-1)] sm:h-12 sm:w-12"
                      sizes="48px"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-semibold text-[var(--text)]">{char.name}</span>
                        <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--on-primary-container)]">
                          {char.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--text2)] sm:text-[13px]">{char.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 会話コンテンツ */}
        <section aria-label="会話コンテンツ" className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
          <CastTalkContent messages={messages} characterMap={characterMap} interviewerId={talk.interviewer_id} />
        </section>

        {/* シェアボタン */}
        <section aria-label="記事をシェアする" className="mx-auto max-w-3xl px-6 pb-4 sm:px-8">
          <ShareButtons title={talk.title} url={talkUrl} />
        </section>

        {/* CTA */}
        <section aria-label="取材を始めるご案内" className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
            <div className="flex items-center gap-4">
              {interviewer && (
                <Image
                  src={interviewer.icon96}
                  alt={interviewer.name}
                  width={56}
                  height={56}
                  className="rounded-full border-2 border-[var(--border)]"
                  sizes="56px"
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
        <section aria-label="記事一覧へ戻る" className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
            <Link
              href={backHref}
              className="group flex items-center gap-2 text-sm text-[var(--text2)] transition-colors hover:text-[var(--text)] rounded"
            >
              <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Cast Talk の記事一覧へ</span>
            </Link>
          </div>
        </section>

      </main>


    </>
  )
}
