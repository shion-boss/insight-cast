'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { togglePublished, deletePost } from '@/lib/actions/admin-posts'

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
  'insight-cast': 'サービス',
  service: 'サービス',
  interview: 'インタビュー',
  case: '事例',
  philosophy: '思想',
  howto: 'ノウハウ',
  news: 'お知らせ',
}

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function ToggleSwitch({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:pointer-events-none disabled:opacity-50 ${on ? 'bg-[var(--ok)]' : 'bg-[var(--border2)]'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function PostsTableClient({ posts }: { posts: PostRow[] }) {
  const [rows, setRows] = useState(posts)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  async function handleDelete(post: PostRow) {
    if (!confirm(`「${post.title}」を削除しますか？この操作は取り消せません。`)) return
    setDeletingId(post.id)
    setErrorMsg(null)
    try {
      const result = await deletePost(post.id)
      if ('error' in result) {
        setErrorMsg(result.error)
      } else {
        setRows((prev) => prev.filter((p) => p.id !== post.id))
        router.refresh()
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {errorMsg && (
        <div className="mb-4 flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3 text-sm text-[var(--err)]">
          <span className="mt-0.5 shrink-0">⚠</span>
          <div>
            <p>{errorMsg}</p>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="mt-0.5 text-xs underline opacity-70 hover:opacity-100 transition-opacity"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border2)] bg-[var(--surface)] p-12 text-center">
          <p className="text-sm text-[var(--text3)]">記事がありません</p>
        </div>
      ) : (
      <>
        {/* モバイル: カードリスト */}
        <div className="space-y-3 sm:hidden">
          {rows.map((post) => (
            <div key={post.id} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 font-semibold text-[var(--text)]">{post.title}</p>
                  <p className="text-[11px] text-[var(--text3)]">/{post.slug}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold ${post.published ? 'text-[var(--ok)]' : 'text-[var(--text3)]'}`}>
                  {post.published ? '公開中' : '下書き'}
                </span>
              </div>
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-[var(--text3)]">
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium">
                  {CATEGORY_LABELS[post.category] ?? post.category}
                </span>
                <span>{formatDate(post.date)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ToggleSwitch
                  on={post.published}
                  onToggle={() => handleToggle(post.id, post.published)}
                  disabled={isPending}
                />
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="inline-flex min-h-[44px] items-center rounded-[var(--r-sm)] border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)]"
                >
                  編集
                </Link>
                {post.published && (
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="inline-flex min-h-[44px] items-center rounded-[var(--r-sm)] border border-[var(--accent)] px-4 py-2 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-l)] whitespace-nowrap"
                  >
                    公開ページ ↗
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(post)}
                  disabled={deletingId === post.id}
                  className="inline-flex min-h-[44px] items-center rounded-[var(--r-sm)] border border-red-200 px-4 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {deletingId === post.id ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PC: テーブル */}
        <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg2)]">
                <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-[var(--text3)] uppercase">タイトル</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-[var(--text3)] uppercase whitespace-nowrap">カテゴリ</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-[var(--text3)] uppercase whitespace-nowrap">公開日</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-[var(--text3)] uppercase whitespace-nowrap">ステータス</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-[0.12em] text-[var(--text3)] uppercase whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((post, i) => (
                <tr
                  key={post.id}
                  className={`transition-colors hover:bg-[var(--bg2)] ${i < rows.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                >
                  <td className="max-w-xs px-5 py-4">
                    <p className="font-semibold text-[var(--text)] overflow-hidden text-ellipsis whitespace-nowrap mb-0.5">{post.title}</p>
                    <p className="text-[11px] text-[var(--text3)]">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="bg-[var(--bg2)] text-[var(--text3)] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-[var(--border)]">
                      {CATEGORY_LABELS[post.category] ?? post.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[var(--text3)] whitespace-nowrap text-xs">
                    {formatDate(post.date)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        on={post.published}
                        onToggle={() => handleToggle(post.id, post.published)}
                        disabled={isPending}
                      />
                      <span className={`text-[11px] font-semibold ${post.published ? 'text-[var(--ok)]' : 'text-[var(--text3)]'}`}>
                        {post.published ? '公開中' : '下書き'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="inline-block w-24 text-center text-xs font-medium text-[var(--text2)] hover:text-[var(--text)] rounded-[var(--r-sm)] px-2.5 py-1.5 hover:bg-[var(--bg2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                      >
                        編集
                      </Link>
                      {post.published ? (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="inline-block w-24 text-center text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-l)] rounded-[var(--r-sm)] px-2.5 py-1.5 transition-colors"
                        >
                          公開ページ ↗
                        </Link>
                      ) : (
                        <span className="inline-block w-24 px-2.5 py-1.5 text-xs" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(post)}
                        disabled={deletingId === post.id}
                        className="inline-block w-16 text-center rounded-[var(--r-sm)] border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-50"
                      >
                        {deletingId === post.id ? '削除中...' : '削除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
      )}
    </div>
  )
}
