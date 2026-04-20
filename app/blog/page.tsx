import type { Metadata } from 'next'
import { PublicHeader, PublicFooter, PublicHero, PublicPageFrame } from '@/components/public-layout'
import { BlogClient } from './BlogClient'
import { getBlogPostsFromDB } from '@/lib/blog-posts'

export const metadata: Metadata = {
  title: 'ブログ | Insight Cast',
  description:
    'Insight Castのブログ。インタビュー記事、事例、取材の記録など、ホームページを一次情報で育てるヒントをお届けします。',
}

export default async function BlogPage() {
  const posts = await getBlogPostsFromDB()

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <PublicHero
          eyebrow="Blog"
          title={<>Insight Cast ブログ</>}
          description={<>取材の記録、事例、ホームページを育てるヒントをお届けします。</>}
        />

        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-16">
          <BlogClient posts={posts} />
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
