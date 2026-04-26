'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DevAiLabel } from '@/components/ui'
import { getCastName } from '@/lib/characters'

type CastTalk = {
  id: string
  title: string
  slug: string
  format: 'interview' | 'dialogue'
  interviewer_id: string
  guest_id: string
  status: 'draft' | 'published'
  created_at: string
}

const FORMAT_LABELS: Record<string, string> = {
  interview: '取材',
  dialogue: '対話',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function CastTalkAdminClient({ initialItems }: { initialItems: CastTalk[] }) {
  const [items, setItems] = useState<CastTalk[]>(initialItems)
  const [generating, setGenerating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [themeInput, setThemeInput] = useState('')

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/cast-talk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeInput.trim() ? { theme: themeInput.trim() } : {}),
      })
      const json = await res.json() as {
        id: string; title: string; slug: string
        format: 'interview' | 'dialogue'
        interviewer_id: string; guest_id: string
        status: 'draft' | 'published'; created_at: string
        message?: string; traceId?: string
      }
      if (!res.ok) {
        throw new Error(json.message ?? '生成に失敗しました')
      }
      const { traceId: _, message: __, ...newItem } = json
      setItems((prev) => [newItem, ...prev])
    } catch {
      setError('生成できませんでした。しばらく待ってから再試行してください。')
    } finally {
      setGenerating(false)
    }
  }

  async function handleToggleStatus(item: CastTalk) {
    setTogglingId(item.id)
    setError(null)
    const newStatus = item.status === 'published' ? 'draft' : 'published'
    try {
      const res = await fetch(`/api/cast-talk/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        throw new Error(data.message ?? '更新に失敗しました')
      }
      setItems((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, status: newStatus } : t)),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(item: CastTalk) {
    if (!confirm(`「${item.title}」を削除しますか？この操作は取り消せません。`)) return
    setDeletingId(item.id)
    setError(null)
    try {
      const res = await fetch(`/api/cast-talk/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        throw new Error(data.message ?? '削除に失敗しました')
      }
      setItems((prev) => prev.filter((t) => t.id !== item.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Cast Talk 管理
          </h1>
          <p className="mt-1 text-sm text-[var(--text2)]">
            AIキャスト対話記事の一覧・公開管理
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            aria-label="生成テーマ（省略可）"
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            placeholder="テーマを指定（省略可）"
            disabled={generating}
            className="min-h-11 w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text3)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50 sm:w-64"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--r-sm)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
          >
            {generating ? '生成中...' : '今すぐ生成'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-[var(--r-sm)] border border-[var(--err-l)] bg-[var(--err-l)] px-4 py-3 text-sm text-[var(--err)]">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border2)] bg-[var(--surface)] p-10 text-center">
          <p className="text-sm text-[var(--text3)]">まだcast-talkがありません</p>
          <p className="mt-1 text-xs text-[var(--text3)]">「今すぐ生成」を押して最初の記事を作成してください</p>
        </div>
      ) : (
        <>
          {/* モバイル: カードリスト */}
          <div className="space-y-3 sm:hidden">
            {items.map((item) => (
              <div key={item.id} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="font-medium text-[var(--text)] leading-snug">{item.title}</p>
                  <span className={`shrink-0 text-xs font-semibold ${item.status === 'published' ? 'text-[var(--ok)]' : 'text-[var(--text3)]'}`}>
                    {item.status === 'published' ? '公開中' : '下書き'}
                  </span>
                </div>
                <div className="mb-4 flex flex-wrap gap-2 text-xs text-[var(--text3)]">
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
                    {FORMAT_LABELS[item.format] ?? item.format}
                  </span>
                  <span>{getCastName(item.interviewer_id)} × {getCastName(item.guest_id)}</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    disabled={togglingId === item.id || deletingId === item.id}
                    role="switch"
                    aria-checked={item.status === 'published'}
                    aria-label={item.status === 'published' ? '下書きに戻す' : '公開する'}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:pointer-events-none disabled:opacity-50 ${item.status === 'published' ? 'bg-[var(--ok)]' : 'bg-[var(--border2)]'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${item.status === 'published' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <Link
                    href={`/admin/cast-talk/${item.id}`}
                    className="min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)] inline-flex items-center"
                  >
                    編集
                  </Link>
                  {item.status === 'published' && (
                    <Link
                      href={`/cast-talk/${item.slug}`}
                      target="_blank"
                      className="min-h-[44px] rounded-[var(--r-sm)] border border-[var(--accent)] px-4 py-2 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-l)] inline-flex items-center whitespace-nowrap"
                    >
                      公開ページ ↗
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="min-h-[44px] rounded-[var(--r-sm)] border border-red-200 px-4 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {deletingId === item.id ? '削除中...' : '削除'}
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
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text3)]">タイトル</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text3)]">形式</th>
                  <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text3)] md:table-cell">キャスト</th>
                  <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text3)] lg:table-cell">作成日</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text3)]">ステータス</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--text3)]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-[var(--bg2)]">
                    <td className="px-4 py-4">
                      <p className="line-clamp-1 font-medium text-[var(--text)]">{item.title}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text3)]">
                        {FORMAT_LABELS[item.format] ?? item.format}
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 text-[var(--text2)] md:table-cell">
                      {getCastName(item.interviewer_id)} × {getCastName(item.guest_id)}
                    </td>
                    <td className="hidden px-4 py-4 text-[var(--text3)] lg:table-cell">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingId === item.id || deletingId === item.id}
                          role="switch"
                          aria-checked={item.status === 'published'}
                          aria-label={item.status === 'published' ? '下書きに戻す' : '公開する'}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:pointer-events-none disabled:opacity-50 ${item.status === 'published' ? 'bg-[var(--ok)]' : 'bg-[var(--border2)]'}`}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${item.status === 'published' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                        <span className={`text-[11px] font-semibold ${item.status === 'published' ? 'text-[var(--ok)]' : 'text-[var(--text3)]'}`}>
                          {item.status === 'published' ? '公開中' : '下書き'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/admin/cast-talk/${item.id}`}
                          className="inline-block rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)]"
                        >
                          編集
                        </Link>
                        {item.status === 'published' ? (
                          <Link
                            href={`/cast-talk/${item.slug}`}
                            target="_blank"
                            className="inline-block rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-l)] whitespace-nowrap"
                          >
                            公開ページ ↗
                          </Link>
                        ) : (
                          <span className="inline-block px-3 py-1.5 text-xs" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="rounded-[var(--r-sm)] border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-50"
                        >
                          {deletingId === item.id ? '削除中...' : '削除'}
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
