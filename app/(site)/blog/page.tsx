import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicHero } from '@/components/public-layout'
import { BlogClient } from './BlogClient'
import { getBlogPostsFromDB } from '@/lib/blog-posts.server'
import { Breadcrumb } from '@/components/ui'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'ブログ | Insight Cast',
  description:
    'Insight Cast の公式ブログです。AIキャストを使った取材の活用事例、インタビュー記事、取材の記録など、ホームページを一次情報で育てるためのヒントを定期的にお届けしています。ぜひご参考にください。',
  alternates: { canonical: `${APP_URL}/blog` },
  openGraph: {
    title: 'ブログ | Insight Cast',
    description: 'Insight Castのブログ。インタビュー記事、事例、取材の記録など、ホームページを一次情報で育てるヒントをお届けします。',
    url: `${APP_URL}/blog`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ブログ | Insight Cast',
    description: 'Insight Castのブログ。インタビュー記事、事例、取材の記録など、ホームページを一次情報で育てるヒントをお届けします。',
    images: ['/logo.jpg'],
  },
}

export default async function BlogPage() {
  const posts = await getBlogPostsFromDB()

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'ブログ', item: `${APP_URL}/blog` },
    ],
  }

  const blogListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Insight Cast ブログ',
    url: `${APP_URL}/blog`,
    description: 'Insight Castのブログ。インタビュー記事、事例、取材の記録など、ホームページを一次情報で育てるヒントをお届けします。',
    blogPost: posts.slice(0, 10).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${APP_URL}/blog/${post.slug}`,
      datePublished: post.date,
      description: post.excerpt,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListJsonLd) }}
      />

      <main id="main-content" className="relative z-10">
        <PublicHero
          compact
          eyebrow="Blog"
          title={<>取材から生まれた記事を読む</>}
          description={(
            <>
              ホームページ更新・コンテンツ制作・一次情報の活かし方など、
              事業者の発信を支えるノウハウをお届けします。
            </>
          )}
          aside={(
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text2)]">Library</p>
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text2)]">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--text)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          asideClassName="self-stretch"
        />

        <section className="mx-auto max-w-[1160px] px-6 pb-12 sm:px-8 lg:px-12">
          <Breadcrumb items={[{ label: 'ホーム', href: '/' }, { label: 'ブログ' }]} />
          <BlogClient posts={posts} />
        </section>

        {/* Philosophy / About 導線 */}
        <section className="mx-auto max-w-[1160px] px-6 pb-20 sm:px-8 lg:px-12">
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-10">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--on-primary-container)]">Behind the blog</p>
            <h2 className="mt-3 font-[family-name:var(--font-noto-serif-jp)] text-xl font-bold leading-snug text-[var(--text)] sm:text-2xl">
              なぜ Insight Cast は、こういう記事を書くのか
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text2)]">
              ブログの背景にある考え方と、運営しているチームのことをまとめています。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/philosophy"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--text)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <span>AI時代の発信について</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <span>Insight Cast について</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

      </main>


    </>
  )
}
