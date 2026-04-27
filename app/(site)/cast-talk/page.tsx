import type { Metadata } from 'next'
import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import { PublicHero } from '@/components/public-layout'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHARACTERS } from '@/lib/characters'
import { CastTalkGrid } from './CastTalkGrid'

export const metadata: Metadata = {
  title: 'Cast Talk | Insight Cast',
  description:
    'Insight CastのAIキャストたちが語り合う対話記事。ホームページを一次情報で育てるヒントを、キャストの視点でお届けします。',
}

const PAGE_SIZE = 11

const getInitialTalks = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data, count } = await supabase
      .from('cast_talks')
      .select('id, title, summary, interviewer_id, guest_id, slug, published_at', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(0, PAGE_SIZE - 1)
    return { talks: data ?? [], total: count ?? 0 }
  },
  ['cast-talks-initial'],
  { revalidate: 120 },
)

export default async function CastTalkPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const initialPage = Math.max(0, Number(pageParam ?? '0'))
  const { talks, total } = await getInitialTalks()

  return (
    <>


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
          <CastTalkGrid initialTalks={talks} total={total} pageSize={PAGE_SIZE} initialPage={initialPage} />
        </section>
      </main>


    </>
  )
}
