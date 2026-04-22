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
      className="w-9 h-5 rounded-full relative transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50 disabled:pointer-events-none flex-shrink-0 cursor-pointer"
      style={{ background: on ? 'var(--teal)' : 'var(--border)' }}
    >
      <span
        className="block w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-[left] duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
        style={{ left: on ? '19px' : '3px' }}
      />
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
    const result = await deletePost(post.id)
    if ('error' in result) {
      setErrorMsg(result.error)
    } else {
      setRows((prev) => prev.filter((p) => p.id !== post.id))
      router.refresh()
    }
    setDeletingId(null)
  }

  return (
    <div>
      {errorMsg && (
        <div className="mb-4 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3 text-sm text-[var(--err)]">
          {errorMsg}
        </div>
      )}
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg2)]">
                <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase">タイトル</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">カテゴリ</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">公開日</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">公開</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">操作</th>
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
                  <td className="px-4 py-4 text-center">
                    <ToggleSwitch
                      on={post.published}
                      onToggle={() => handleToggle(post.id, post.published)}
                      disabled={isPending}
                    />
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
      </div>
    </div>
  )
}
