import Image from 'next/image'
import Link from 'next/link'

import { CATEGORY_LABELS, type PostCategory, type Post } from '@/lib/blog-posts'
import { getCharacter } from '@/lib/characters'

const BLOG_CATEGORY_COLOR: Record<PostCategory, string> = {
  howto:      '#c2722a',
  service:    '#0f766e',
  interview:  '#7c3aed',
  case:       '#1d4ed8',
  philosophy: '#065f46',
  news:       '#be185d',
}

const BLOG_PREVIEW_CHARACTER: Record<PostCategory, string> = {
  howto: 'mint',
  service: 'claus',
  interview: 'rain',
  case: 'rain',
  philosophy: 'claus',
  news: 'mint',
}

export function BlogPreview({ latestPosts }: { latestPosts: Post[] }) {
  return (
    <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
      <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--on-primary-container)]">Blog</div>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
          最新の記事
        </h2>
        <p className="text-base text-[var(--text2)] mt-3">Insight Cast の考え方や、発信にまつわる話を長文の記事で読む。</p>
        <div className="mt-11 flex flex-col divide-y divide-[var(--border)] rounded-[20px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {latestPosts.map((post) => {
            const char = getCharacter(post.interviewer ?? BLOG_PREVIEW_CHARACTER[post.category]) ?? getCharacter('mint')!
            const themeColor = BLOG_CATEGORY_COLOR[post.category]
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex items-start gap-4 px-5 py-5 transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
              >
                <div className="relative mt-0.5 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[var(--border)]" style={{ background: `${themeColor}18` }}>
                  <Image src={char.icon48} alt={char.name} fill sizes="40px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${themeColor}1a`, color: themeColor }}>
                      {CATEGORY_LABELS[post.category]}
                    </span>
                    <span className="text-[11px] text-[var(--text3)]">{post.date}</span>
                  </div>
                  <p className="text-[15px] font-bold leading-snug text-[var(--text)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text3)] line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <span aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[11px] font-bold text-[var(--text3)] group-hover:text-[var(--accent)] transition-colors">→</span>
              </Link>
            )
          })}
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <span className="self-center text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--text3)] mr-1">テーマで探す</span>
          {([
            { category: 'service' as const, label: 'サービス紹介', href: '/blog?category=service' },
            { category: 'interview' as const, label: 'インタビュー', href: '/blog?category=interview' },
            { category: 'case' as const, label: '事例', href: '/blog?category=case' },
            { category: 'howto' as const, label: 'ノウハウ', href: '/blog?category=howto' },
            { category: 'news' as const, label: 'お知らせ', href: '/blog?category=news' },
          ]).map(({ category, label, href }) => (
            <Link
              key={category}
              href={href}
              className="rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[12px] font-semibold text-[var(--text2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ color: BLOG_CATEGORY_COLOR[category] }}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/blog" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
            記事をもっと読む <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
