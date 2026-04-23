'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { getCharacter } from '@/lib/characters'
import { CATEGORY_LABELS, type PostCategory, type Post } from '@/lib/blog-posts'
import { BlogCoverArt } from '@/components/blog-cover-art'

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

const CATEGORY_CHARACTER: Record<PostCategory, string> = {
  howto: 'mint',
  service: 'claus',
  interview: 'rain',
  case: 'rain',
  philosophy: 'claus',
  news: 'mint',
}

const CATEGORY_COLOR: Record<PostCategory, string> = {
  howto:       '#c2722a',
  service:     '#0f766e',
  interview:   '#7c3aed',
  case:        '#1d4ed8',
  philosophy:  '#065f46',
  news:        '#be185d',
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${y}.${m}.${d}`
}

function resolveChar(post: Post) {
  const id = post.interviewer ?? CATEGORY_CHARACTER[post.category]
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
        return (
          <Link
            href={`/blog/${featured.slug}`}
            className="mb-10 grid overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] transition-shadow duration-200 hover:shadow-[0_16px_48px_rgba(0,0,0,0.09)] sm:grid-cols-2"
          >
            <BlogCoverArt post={featured} char={char} variant="featured" />
            <div className="p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[var(--warn-l)] px-3 py-0.5 text-xs font-semibold text-[var(--warn)]">
                  {CATEGORY_LABELS[featured.category]}
                </span>
                {featured.type === 'interview' && (
                  <span className="rounded-full bg-[var(--teal-l)] px-3 py-0.5 text-xs font-semibold text-[var(--teal)]">
                    インタビュー
                  </span>
                )}
                <span className="rounded-full bg-[var(--bg2)] px-3 py-0.5 text-xs font-semibold text-[var(--text3)]">
                  注目記事
                </span>
              </div>
              <h2 className="mb-3 font-[family-name:var(--font-noto-serif-jp)] text-[22px] font-bold leading-snug text-[var(--text)]">
                {featured.title}
              </h2>
              <p className="text-[15px] leading-relaxed text-[var(--text2)]">{featured.excerpt}</p>
              <p className="mt-4 text-xs text-[var(--text3)]">{formatDate(featured.date)}</p>
            </div>
          </Link>
        )
      })()}

      {/* 記事グリッド */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gridPosts.map((post) => {
          const char = resolveChar(post)
          const themeColor = CATEGORY_COLOR[post.category]
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.13)] transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-[6px] hover:shadow-[0_24px_60px_rgba(0,0,0,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {/* 画像エリア */}
              <div className="relative h-[200px] overflow-hidden">
                <BlogCoverArt post={post} char={char} variant="card" />
                {/* テーマカラーバー */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: themeColor }} />
                {/* フロストキャストバッジ */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-white/30 bg-white/18 px-3 py-1 backdrop-blur-[10px]">
                  <div className="h-[22px] w-[22px] overflow-hidden rounded-full border-[1.5px] border-white/60 flex-shrink-0">
                    {/* 仮置き: キャラアイコンで代用 */}
                    <Image src={char.icon48} alt={char.name} width={22} height={22} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-[11px] font-bold tracking-[0.04em] text-white">{char.name}</span>
                </div>
              </div>

              {/* コンテンツ */}
              <div className="flex flex-1 flex-col px-5 py-[18px] bg-white">
                <div className="mb-2.5 flex items-center gap-1.5">
                  <span className="h-[6px] w-[6px] rounded-full flex-shrink-0" style={{ background: themeColor }} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: themeColor }}>
                    {CATEGORY_LABELS[post.category]}
                  </p>
                </div>
                <h2 className="mb-3 font-[family-name:var(--font-noto-serif-jp)] text-[16px] font-bold leading-[1.5] text-[#1c1410]">
                  {post.title}
                </h2>
                <p className="mb-3 flex-1 text-[12px] leading-[1.75] text-[#7a6555] line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between border-t border-[#e8ddd0] pt-2.5">
                  <span className="text-[11px] text-[#b8a898]">{formatDate(post.date)}</span>
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
