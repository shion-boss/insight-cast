import Image from 'next/image'
import Link from 'next/link'

import { CATEGORY_LABELS, CATEGORY_COLOR_MAP, CATEGORY_CHARACTER_MAP, type Post } from '@/lib/blog-posts'
import { getCharacter } from '@/lib/characters'

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
            const char = getCharacter(post.interviewer ?? CATEGORY_CHARACTER_MAP[post.category]) ?? getCharacter('mint')!
            const themeColor = CATEGORY_COLOR_MAP[post.category]
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
                    <span className="text-[11px] text-[var(--text2)]">{post.date}</span>
                  </div>
                  <p className="text-[15px] font-bold leading-snug text-[var(--text)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text2)] line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <span aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[11px] font-bold text-[var(--text2)] group-hover:text-[var(--accent)] transition-colors">→</span>
              </Link>
            )
          })}
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <span className="self-center text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--text2)] mr-1">テーマで探す</span>
          {(['ai-search', 'primary-info', 'casts', 'hp-update', 'meta'] as const).map((category) => (
            <Link
              key={category}
              href={`/blog?category=${category}`}
              className="rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[12px] font-semibold text-[var(--text2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ color: CATEGORY_COLOR_MAP[category] }}
            >
              {CATEGORY_LABELS[category]}
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
