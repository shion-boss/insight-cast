import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicHero } from '@/components/public-layout'
import { BlogClient } from './BlogClient'
import { getBlogPostsFromDB } from '@/lib/blog-posts.server'
import { Breadcrumb } from '@/components/ui'
import { CATEGORY_LABELS, CATEGORY_COLOR_MAP } from '@/lib/blog-posts'
import { getCharacter } from '@/lib/characters'

const FIRST_READ_SLUGS = [
  'insight-cast',
  'ai-interviewer-compassion-interviewing-skills',
  'low-quality-content-misconception-seo',
] as const

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
  const latestDate = posts[0]?.date ?? ''
  const firstReadPosts = FIRST_READ_SLUGS
    .map((slug) => posts.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text2)]">Categories</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text2)]">
                  AI検索時代 / 一次情報 / AIキャスト / ホームページ更新 / 運営の舞台裏 の5つのテーマで読めます。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '公開中', value: `${posts.length}本` },
                  { label: '最新更新', value: latestDate ? latestDate.replaceAll('-', '.') : '—' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text2)]">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--text)]">{item.value}</p>
                  </div>
                ))}
              </div>
              <a
                href="/blog/feed.xml"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text2)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36ZM4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44Zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z"/></svg>
                <span>RSSフィードを購読</span>
              </a>
            </div>
          )}
          asideClassName="self-stretch"
        />

        {firstReadPosts.length === 3 && (
          <section className="mx-auto max-w-[1160px] px-6 pt-2 sm:px-8 lg:px-12">
            <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--on-primary-container)]">First reads</p>
              <h2 className="mt-2 font-[family-name:var(--font-noto-serif-jp)] text-lg font-bold leading-snug text-[var(--text)] sm:text-xl">
                初めて読む方へ
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--text2)]">
                Insight Cast がなぜ生まれて、どう作られていて、自社で何を試しているか——3本でつかめます。
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {firstReadPosts.map((post) => {
                  const char = getCharacter(post.interviewer ?? 'mint') ?? getCharacter('mint')!
                  const themeColor = CATEGORY_COLOR_MAP[post.category]
                  return (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col gap-2 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--bg2)] p-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border border-[var(--border)]" style={{ background: `${themeColor}18` }}>
                          <Image src={char.icon48} alt={char.name} fill sizes="28px" className="object-cover" />
                        </div>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${themeColor}1a`, color: themeColor }}>
                          {CATEGORY_LABELS[post.category]}
                        </span>
                      </div>
                      <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-snug text-[var(--text)] line-clamp-3 transition-colors group-hover:text-[var(--accent)]">
                        {post.title}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-[1160px] px-6 pb-12 pt-8 sm:px-8 lg:px-12">
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
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-ground)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
