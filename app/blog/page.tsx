import type { Metadata } from 'next'
import { PublicHeader, PublicFooter, PublicPageFrame } from '@/components/public-layout'
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
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        {/* Hero: pub-hero-sm */}
        <section className="bg-gradient-to-br from-[#fdf7f0] to-[#f5e8d8] px-12 pb-14 pt-20">
          <div className="mx-auto max-w-[1160px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Blog</p>
            <h1 className="mt-3 font-[family-name:var(--font-noto-serif-jp)] text-[clamp(32px,4vw,52px)] font-bold leading-[1.18] text-[var(--text)]">
              記事一覧
            </h1>
            <p className="mt-3 text-[16px] leading-[1.85] text-[var(--text2)]">
              ホームページ更新・コンテンツ制作・一次情報の活かし方など、事業者の発信を支えるノウハウをお届けします。
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1160px] px-12 pb-20">
          <BlogClient posts={posts} />
        </section>

      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
