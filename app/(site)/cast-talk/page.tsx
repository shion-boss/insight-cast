import type { Metadata } from 'next'
import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import { PublicHero } from '@/components/public-layout'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHARACTERS } from '@/lib/characters'
import { CastTalkGrid } from './CastTalkGrid'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Cast Talk | Insight Cast',
  description:
    'Insight Cast のAIキャストたちが語り合う対話形式の読み物です。ホームページを一次情報で育てるためのヒントや、情報発信についての考え方を、ミント・クラウス・レインそれぞれの視点からお届けしています。',
  alternates: { canonical: `${APP_URL}/cast-talk` },
  openGraph: {
    title: 'Cast Talk | Insight Cast',
    description: 'AIキャストたちの対話記事。ホームページを一次情報で育てるヒントをキャストの視点でお届けします。',
    url: `${APP_URL}/cast-talk`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cast Talk | Insight Cast',
    description: 'AIキャストたちの対話記事。ホームページを一次情報で育てるヒントをキャストの視点でお届けします。',
    images: ['/logo.jpg'],
  },
}

const LIST_PAGE_SIZE = 10

type Talk = {
  id: string
  title: string | null
  summary: string | null
  interviewer_id: string | null
  guest_id: string | null
  slug: string
  published_at: string | null
}

const getFeaturedAndTotal = unstable_cache(
  async (): Promise<{ featured: Talk | null; total: number }> => {
    const supabase = createAdminClient()
    const { data, count } = await supabase
      .from('cast_talks')
      .select('id, title, summary, interviewer_id, guest_id, slug, published_at', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(0, 0)
    return { featured: data?.[0] ?? null, total: count ?? 0 }
  },
  ['cast-talks-featured'],
  { revalidate: 120 },
)

async function getListPage(page: number): Promise<Talk[]> {
  const offset = 1 + page * LIST_PAGE_SIZE
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('cast_talks')
    .select('id, title, summary, interviewer_id, guest_id, slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + LIST_PAGE_SIZE - 1)
  return data ?? []
}

export default async function CastTalkPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const initialPage = Math.max(0, Number(pageParam ?? '0'))
  const { featured, total } = await getFeaturedAndTotal()
  const initialListTalks = await getListPage(initialPage)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Cast Talk', item: `${APP_URL}/cast-talk` },
    ],
  }

  const castTalkListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Cast Talk | Insight Cast',
    url: `${APP_URL}/cast-talk`,
    description: 'Insight CastのAIキャストたちが語り合う対話記事。ホームページを一次情報で育てるヒントをキャストの視点でお届けします。',
    ...(featured
      ? {
          mainEntity: {
            '@type': 'Article',
            headline: featured.title,
            url: `${APP_URL}/cast-talk/${featured.slug}`,
            datePublished: featured.published_at,
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(castTalkListJsonLd) }}
      />

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
          <CastTalkGrid
            featuredTalk={featured}
            initialListTalks={initialListTalks}
            initialListPage={initialPage}
            total={total}
          />
        </section>
      </main>


    </>
  )
}
