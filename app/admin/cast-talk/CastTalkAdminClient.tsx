'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { DevAiLabel } from '@/components/ui'

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

const CAST_NAMES: Record<string, string> = {
  mint: 'ミント',
  claus: 'クラウス',
  rain: 'レイン',
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
  const router = useRouter()
  const [items, setItems] = useState<CastTalk[]>(initialItems)
  const [generating, setGenerating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/cast-talk/generate', {
        method: 'POST',
      })
      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        throw new Error(data.message ?? '生成に失敗しました')
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]">
            Cast Talk 管理
          </h1>
          <p className="mt-1 text-sm text-[var(--text2)]">
            AIキャスト対話記事の一覧・公開管理
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--r-sm)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] disabled:pointer-events-none disabled:opacity-50"
        >
          <DevAiLabel>{generating ? '生成中...' : '今すぐ生成'}</DevAiLabel>
        </button>
      </div>

      {error && (
        <div className="rounded-[var(--r-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border2)] bg-[var(--surface)] p-10 text-center">
          <p className="text-sm text-[var(--text3)]">まだcast-talkがありません</p>
          <p className="mt-1 text-xs text-[var(--text3)]">「今すぐ生成」を押して最初の記事を作成してください</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg2)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--text3)]">
                  タイトル
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--text3)] sm:table-cell">
                  形式
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--text3)] md:table-cell">
                  キャスト
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--text3)] lg:table-cell">
                  作成日
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--text3)]">
                  ステータス
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--text3)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--bg2)] transition-colors">
                  <td className="px-4 py-4">
                    <p className="line-clamp-1 font-medium text-[var(--text)]">{item.title}</p>
                  </td>
                  <td className="hidden px-4 py-4 sm:table-cell">
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text3)]">
                      {FORMAT_LABELS[item.format] ?? item.format}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 text-[var(--text2)] md:table-cell">
                    {CAST_NAMES[item.interviewer_id] ?? item.interviewer_id} ×{' '}
                    {CAST_NAMES[item.guest_id] ?? item.guest_id}
                  </td>
                  <td className="hidden px-4 py-4 text-[var(--text3)] lg:table-cell">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        item.status === 'published'
                          ? 'bg-[var(--ok-l)] text-[var(--ok)]'
                          : 'border border-[var(--border)] bg-[var(--bg2)] text-[var(--text3)]'
                      }`}
                    >
                      {item.status === 'published' ? '公開中' : '下書き'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/cast-talk/${item.id}`}
                        className="rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)]"
                      >
                        プレビュー
                      </Link>
                      {item.status === 'published' && (
                        <Link
                          href={`/cast-talk/${item.slug}`}
                          target="_blank"
                          className="rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-l)]"
                        >
                          公開ページ ↗
                        </Link>
                      )}
                      <button
                        onClick={() => handleToggleStatus(item)}
                        disabled={togglingId === item.id}
                        className="rounded-[var(--r-sm)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-50"
                      >
                        {togglingId === item.id
                          ? '更新中...'
                          : item.status === 'published'
                          ? '下書きに戻す'
                          : '公開する'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
