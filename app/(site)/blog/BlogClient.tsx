'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { getCharacter } from '@/lib/characters'
import { CATEGORY_LABELS, CATEGORY_COLOR_MAP, CATEGORY_CHARACTER_MAP, type PostCategory, type Post } from '@/lib/blog-posts'

type FilterTab = 'all' | PostCategory

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'howto', label: 'ノウハウ' },
  { id: 'service', label: 'サービス' },
  { id: 'interview', label: 'インタビュー' },
  { id: 'case', label: '事例' },
  { id: 'philosophy', label: '思想' },
  { id: 'news', label: 'お知らせ' },
]

function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${y}.${m}.${d}`
}

function resolveChar(post: Post) {
  const id = post.interviewer ?? CATEGORY_CHARACTER_MAP[post.category]
  return getCharacter(id) ?? getCharacter('mint')!
}

export function BlogClient({ posts }: { posts: Post[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const featured = posts.find((p) => p.featured) ?? posts[0]
  const filtered = activeFilter === 'all' ? posts : posts.filter((p) => p.category === activeFilter)
  const listPosts = activeFilter === 'all'
    ? [featured, ...filtered.filter((p) => p.slug !== featured?.slug)].filter(Boolean) as Post[]
    : filtered

  return (
    <>
      {/* カテゴリフィルター */}
      <div className="mt-8 mb-8 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            aria-pressed={activeFilter === tab.id}
            className={`rounded-full border-[1.5px] px-4 py-[7px] text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
              activeFilter === tab.id
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-transparent text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 記事リスト */}
      {listPosts.length > 0 ? (
        <div className="flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)]">
          {listPosts.map((post, i) => {
            const char = resolveChar(post)
            const themeColor = CATEGORY_COLOR_MAP[post.category]
            const isFeatured = activeFilter === 'all' && i === 0
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
              >
                <div
                  className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-[var(--border)] sm:h-10 sm:w-10"
                  style={{ background: `${themeColor}18` }}
                >
                  <Image src={char.icon48} alt={char.name} fill sizes="40px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${themeColor}1a`, color: themeColor }}>
                      {CATEGORY_LABELS[post.category]}
                    </span>
                    {post.type === 'interview' && (
                      <span className="rounded-full bg-[var(--teal-l)] px-2 py-0.5 text-[10px] font-bold text-[var(--teal)]">
                        インタビュー
                      </span>
                    )}
                    {isFeatured && (
                      <span className="rounded-full bg-[var(--warn-l)] px-2 py-0.5 text-[10px] font-bold text-[var(--warn)]">
                        注目
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--text3)]">{formatDate(post.date)}</span>
                  </div>
                  <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-snug text-[var(--text)] line-clamp-2 transition-colors group-hover:text-[var(--accent)]">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text2)] line-clamp-1">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 text-[12px] font-bold text-[var(--text3)] transition-colors group-hover:text-[var(--accent)]">→</span>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-[var(--text3)]">このカテゴリの記事はまだありません</p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="text-sm font-semibold text-[var(--accent)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded"
          >
            すべての記事を見る
          </button>
        </div>
      )}
    </>
  )
}
