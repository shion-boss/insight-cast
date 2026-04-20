'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { togglePublished } from '@/lib/actions/admin-posts'

type PostRow = {
  id: string
  slug: string
  title: string
  category: string
  published: boolean
  date: string
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  'insight-cast': 'ブログ',
  interview: 'インタビュー',
  case: '事例',
  news: 'お知らせ',
}

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export function PostsTableClient({ posts }: { posts: PostRow[] }) {
  const [rows, setRows] = useState(posts)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  function handleToggle(id: string, current: boolean) {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await togglePublished(id, !current)
      if ('error' in result) {
        setErrorMsg(result.error)
        return
      }
      setRows((prev) =>
        prev.map((p) => (p.id === id ? { ...p, published: !current } : p))
      )
      router.refresh()
    })
  }

  return (
    <div>
      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {/* テーブルヘッダー */}
        <div className="grid grid-cols-[1fr_100px_90px_90px_80px] gap-4 border-b border-stone-100 bg-stone-50 px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">
          <span>タイトル</span>
          <span>カテゴリ</span>
          <span>公開日</span>
          <span>状態</span>
          <span />
        </div>

        {rows.map((post, i) => (
          <div
            key={post.id}
            className={`grid grid-cols-[1fr_100px_90px_90px_80px] items-center gap-4 px-5 py-4 ${
              i < rows.length - 1 ? 'border-b border-stone-100' : ''
            }`}
          >
            {/* タイトル */}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-800">{post.title}</p>
              <p className="mt-0.5 truncate text-xs text-stone-400">/{post.slug}</p>
            </div>

            {/* カテゴリ */}
            <span className="text-xs text-stone-500">
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>

            {/* 日付 */}
            <span className="text-xs text-stone-400">{formatDate(post.date)}</span>

            {/* 公開切替 */}
            <button
              onClick={() => handleToggle(post.id, post.published)}
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 disabled:pointer-events-none disabled:opacity-50 ${
                post.published
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {post.published ? '公開中' : '下書き'}
            </button>

            {/* 編集ボタン */}
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
            >
              編集
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
