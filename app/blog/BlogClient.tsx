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
  const gridPosts = activeFilter === 'all'
    ? filtered.filter((p) => p.slug !== featured?.slug)
    : filtered

  return (
    <>
      {/* カテゴリフィルター */}
      <div className="mt-8 mb-10 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
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

      {/* 注目記事 */}
      {activeFilter === 'all' && featured && (() => {
        const char = resolveChar(featured)
        const themeColor = CATEGORY_COLOR_MAP[featured.category]
        return (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-10 flex flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(0,0,0,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 sm:flex-row"
          >
            {/* キャラパネル */}
            <div
              className="relative flex w-full flex-shrink-0 items-center justify-center py-8 sm:w-[200px] sm:py-0"
              style={{ background: `${themeColor}18` }}
            >
              <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 60% 40%, ${themeColor}, transparent 70%)` }} />
              <Image
                src={char.icon96}
                alt={char.name}
                width={96}
                height={96}
                className="relative z-10 drop-shadow-[0_12px_20px_rgba(60,44,28,0.18)]"
              />
            </div>

            {/* テキスト */}
            <div className="flex flex-1 flex-col justify-center px-8 py-7">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: `${themeColor}1a`, color: themeColor }}>
                  {CATEGORY_LABELS[featured.category]}
                </span>
                {featured.type === 'interview' && (
                  <span className="rounded-full bg-[var(--teal-l)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--teal)]">
                    インタビュー
                  </span>
                )}
                <span className="rounded-full bg-[var(--bg2)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--text3)]">
                  注目記事
                </span>
              </div>
              <h2 className="mb-2.5 font-[family-name:var(--font-noto-serif-jp)] text-[20px] font-bold leading-snug text-[var(--text)] sm:text-[22px]">
                {featured.title}
              </h2>
              <p className="mb-4 text-[13px] leading-relaxed text-[var(--text2)] line-clamp-2">{featured.excerpt}</p>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 overflow-hidden rounded-full border border-[var(--border)] flex-shrink-0">
                  <Image src={char.icon48} alt={char.name} width={24} height={24} className="h-full w-full object-cover" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--text2)]">{char.name}</span>
                <span className="ml-auto text-[11px] text-[var(--text3)]">{formatDate(featured.date)}</span>
                <span className="text-[11px] font-bold" style={{ color: themeColor }}>続きを読む →</span>
              </div>
            </div>
          </Link>
        )
      })()}

      {/* 記事グリッド */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gridPosts.map((post) => {
          const char = resolveChar(post)
          const themeColor = CATEGORY_COLOR_MAP[post.category]
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(0,0,0,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {/* カテゴリカラーバー */}
              <div className="h-[3px] w-full flex-shrink-0" style={{ background: themeColor }} />

              <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                {/* キャラ＋カテゴリ */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-7 w-7 overflow-hidden rounded-full border border-[var(--border)] flex-shrink-0">
                    <Image src={char.icon48} alt={char.name} width={28} height={28} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text2)]">{char.name}</span>
                  <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${themeColor}1a`, color: themeColor }}>
                    {CATEGORY_LABELS[post.category]}
                  </span>
                </div>

                {/* タイトル */}
                <h2 className="mb-2.5 font-[family-name:var(--font-noto-serif-jp)] text-[16px] font-bold leading-[1.5] text-[var(--text)]">
                  {post.title}
                </h2>

                {/* excerpt */}
                <p className="flex-1 text-[12px] leading-[1.75] text-[var(--text2)] line-clamp-3">
                  {post.excerpt}
                </p>

                {/* フッター */}
                <div className="mt-3.5 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
                  <span className="text-[11px] text-[var(--text3)]">{formatDate(post.date)}</span>
                  <span className="text-[11px] font-bold" style={{ color: themeColor }}>続きを読む →</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {gridPosts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-[var(--text3)]">
            このカテゴリの記事はまだありません
          </p>
          <button
            onClick={() => setActiveFilter('all')}
            className="text-sm font-semibold text-[var(--accent)] underline underline-offset-2"
          >
            すべての記事を見る
          </button>
        </div>
      )}
    </>
  )
}
