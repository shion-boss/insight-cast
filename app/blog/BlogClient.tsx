'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ButtonLink, CharacterAvatar } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { CATEGORY_LABELS, type PostCategory, type Post } from '@/lib/blog-posts'

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

export function BlogClient({ posts }: { posts: Post[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const filteredPosts =
    activeFilter === 'all' ? posts : posts.filter((p) => p.category === activeFilter)

  return (
    <>
      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 ${
              activeFilter === tab.id
                ? 'border-stone-950 bg-stone-950 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-700 hover:bg-stone-50 hover:text-stone-950'
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
              className="card-interactive group flex flex-col overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
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
      <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,_#1f2937_0%,_#292524_58%,_#7c5a31_100%)] px-7 py-10 text-center text-white">
        <p className="text-xs font-medium tracking-[0.22em] text-amber-200 uppercase">Start Free</p>
        <p className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
          あなたのホームページでも試してみませんか
        </p>
        <p className="mt-3 text-sm leading-7 text-stone-200">
          登録無料。クレジットカード不要でインタビューを体験できます。
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/auth/signup" className="bg-white text-stone-900 hover:bg-stone-100">
            無料で取材を始める
          </ButtonLink>
          <ButtonLink href="/cast" tone="ghost" className="border-white/70 text-white hover:border-white/40 hover:bg-white/10">
            キャストを見る
          </ButtonLink>
        </div>
      </div>
    </>
  )
}
