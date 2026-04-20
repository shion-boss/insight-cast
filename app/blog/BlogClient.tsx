'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { getCharacter, type Character } from '@/lib/characters'
import { CATEGORY_LABELS, type PostCategory, type Post } from '@/lib/blog-posts'

type FilterTab = 'all' | PostCategory

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'howto', label: 'ノウハウ' },
  { id: 'service', label: 'サービス' },
  { id: 'case', label: '事例' },
  { id: 'philosophy', label: '思想' },
]

const CATEGORY_CHARACTER: Record<PostCategory, string> = {
  howto: 'mint',
  service: 'claus',
  case: 'rain',
  philosophy: 'claus',
  news: 'mint',
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${y}.${m}.${d}`
}

function CoverChar({ char, size = 64 }: { char: Character; size?: number }) {
  return (
    <Image
      src={char.icon96}
      alt={char.name}
      width={size}
      height={size}
      className="object-contain drop-shadow-md"
    />
  )
}

function resolveChar(post: Post): Character {
  const id = post.interviewer ?? CATEGORY_CHARACTER[post.category]
  return getCharacter(id) ?? getCharacter('mint')!
}

export function BlogClient({ posts }: { posts: Post[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const featured = posts.find((p) => p.featured)
  const filtered = activeFilter === 'all' ? posts : posts.filter((p) => p.category === activeFilter)
  const gridPosts = activeFilter === 'all' ? filtered.filter((p) => !p.featured) : filtered
  const ctaChar = getCharacter('mint')!

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
            <div
              className={`flex min-h-[220px] items-center justify-center ${featured.coverColor}`}
            >
              <CoverChar char={char} size={96} />
            </div>
            <div className="p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Image
                  src={char.icon48}
                  alt={char.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
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
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] transition-[transform,box-shadow] duration-[220ms] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {/* カバー */}
              <div className={`relative flex h-[180px] items-center justify-center ${post.coverColor}`}>
                <CoverChar char={char} size={64} />
                {post.type === 'interview' && (
                  <span className="absolute right-3.5 top-3.5 rounded-full bg-[var(--teal-l)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--teal)]">
                    インタビュー
                  </span>
                )}
              </div>

              {/* コンテンツ */}
              <div className="flex flex-1 flex-col px-6 py-[22px]">
                <div className="mb-2 flex items-center gap-2">
                  <Image
                    src={char.icon48}
                    alt={char.name}
                    width={18}
                    height={18}
                    className="rounded-full"
                  />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">
                    {CATEGORY_LABELS[post.category]}
                  </p>
                </div>
                <h2 className="mb-2.5 font-[family-name:var(--font-noto-serif-jp)] text-[17px] font-bold leading-[1.5] text-[var(--text)]">
                  {post.title}
                </h2>
                <p className="mb-3.5 flex-1 text-[13px] leading-[1.75] text-[var(--text2)] line-clamp-3">
                  {post.excerpt}
                </p>
                <p className="text-[12px] text-[var(--text3)]">{formatDate(post.date)}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {gridPosts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Image
            src={ctaChar.icon48}
            alt={ctaChar.name}
            width={40}
            height={40}
            className="opacity-60"
          />
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
