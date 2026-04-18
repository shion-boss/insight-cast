'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CharacterAvatar } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { POSTS, CATEGORY_LABELS, type PostCategory } from '@/lib/blog-posts'

type FilterTab = 'all' | PostCategory

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'insight-cast', label: 'Insight Castブログ' },
  { id: 'interview', label: 'インタビュー記事' },
  { id: 'case', label: '事例' },
  { id: 'news', label: 'お知らせ' },
]

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function BlogClient() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const filteredPosts =
    activeFilter === 'all' ? POSTS : POSTS.filter((p) => p.category === activeFilter)

  return (
    <>
      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${
              activeFilter === tab.id
                ? 'bg-stone-800 text-white'
                : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 記事グリッド */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => {
          const interviewer = post.interviewer ? getCharacter(post.interviewer) : undefined
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/85 transition-colors hover:border-stone-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            >
              {/* カバー */}
              <div className={`h-36 ${post.coverColor}`} />

              {/* コンテンツ */}
              <div className="flex flex-1 flex-col gap-3 p-6">
                {/* バッジ行 */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-0.5 text-xs text-stone-500">
                    {CATEGORY_LABELS[post.category]}
                  </span>
                  {post.type === 'interview' && interviewer && (
                    <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs text-amber-700">
                      <CharacterAvatar
                        src={interviewer.icon48}
                        alt={`${interviewer.name}のアイコン`}
                        emoji={interviewer.emoji}
                        size={18}
                      />
                      {interviewer.name}取材
                    </span>
                  )}
                </div>

                {/* タイトル */}
                <h2 className="text-base font-semibold leading-snug text-stone-800">
                  {post.title}
                </h2>

                {/* 要約 */}
                <p className="flex-1 text-sm leading-relaxed text-stone-500 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* フッター */}
                <div className="flex items-center justify-between pt-2">
                  <time className="text-xs text-stone-400" dateTime={post.date}>
                    {formatDate(post.date)}
                  </time>
                  <span className="text-sm font-medium text-stone-600 transition-colors group-hover:text-stone-900">
                    読む →
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {filteredPosts.length === 0 && (
        <p className="py-12 text-center text-sm text-stone-400">該当する記事がありません</p>
      )}

      {/* フッターCTA */}
      <div className="rounded-[2rem] border border-amber-200/60 bg-amber-50/60 px-8 py-12 text-center">
        <p className="text-lg font-semibold text-stone-800">
          あなたのホームページでも試してみませんか
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          登録無料。クレジットカード不要でインタビューを体験できます。
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            無料ではじめる
          </Link>
          <Link
            href="/cast"
            className="text-sm text-stone-500 transition-colors hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 rounded"
          >
            キャストを見る →
          </Link>
        </div>
      </div>
    </>
  )
}
