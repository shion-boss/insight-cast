import type { Metadata } from 'next'
import { PublicHero } from '@/components/public-layout'
import { BlogClient } from './BlogClient'
import { getBlogPostsFromDB } from '@/lib/blog-posts.server'

export const metadata: Metadata = {
  title: 'ブログ | Insight Cast',
  description:
    'Insight Castのブログ。インタビュー記事、事例、取材の記録など、ホームページを一次情報で育てるヒントをお届けします。',
}

export default async function BlogPage() {
  const posts = await getBlogPostsFromDB()

  return (
    <>


      <main className="relative z-10">
        <PublicHero
          compact
          eyebrow="Blog"
          title={<>記事一覧</>}
          description={(
            <>
              ホームページ更新・コンテンツ制作・一次情報の活かし方など、
              事業者の発信を支えるノウハウをお届けします。
            </>
          )}
          aside={(
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text3)]">Library</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text2)]">
                  ノウハウ、事例、思想、サービスの考え方をテーマ別に読めます。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '公開中', value: `${posts.length}本` },
                  { label: '主なテーマ', value: '一次情報' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text3)]">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--text)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          asideClassName="self-stretch"
        />

        <section className="mx-auto max-w-[1160px] px-6 pb-20 sm:px-8 lg:px-12">
          <BlogClient posts={posts} />
        </section>

      </main>


    </>
  )
}
