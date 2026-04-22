'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Character } from '@/lib/characters'

type Message = {
  castId: string
  text: string
}

type CastTalk = {
  id: string
  title: string
  theme: string
  format: 'interview' | 'dialogue'
  interviewer_id: string
  guest_id: string
  messages: Message[]
  summary: string | null
  status: 'draft' | 'published'
}

export function CastTalkPreviewClient({
  talk,
  characterMap,
}: {
  talk: CastTalk
  characterMap: Record<string, Character>
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStatusChange(newStatus: 'draft' | 'published') {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cast-talk/${talk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        throw new Error(data.message ?? '更新に失敗しました')
      }
      router.push('/admin/cast-talk')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-[var(--text3)]">プレビュー</p>
          <h1 className="mt-1 font-[family-name:var(--font-noto-serif-jp)] text-xl font-bold text-[var(--text)]">
            {talk.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--text2)]">{talk.theme}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            talk.status === 'published'
              ? 'bg-[var(--ok-l)] text-[var(--ok)]'
              : 'border border-[var(--border)] bg-[var(--bg2)] text-[var(--text3)]'
          }`}
        >
          {talk.status === 'published' ? '公開中' : '下書き'}
        </span>
      </div>

      {error && (
        <div className="rounded-[var(--r-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 会話プレビュー */}
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
        {talk.messages.map((msg, i) => {
          const char = characterMap[msg.castId]
          return (
            <div key={i} className="flex items-start gap-3">
              {char ? (
                <Image
                  src={char.icon48}
                  alt={char.name}
                  width={40}
                  height={40}
                  className="shrink-0 rounded-full border border-[var(--border)]"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center text-xs text-[var(--text3)]">
                  {msg.castId.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--text3)]">
                  {char?.name ?? msg.castId}
                </p>
                <p className="mt-1 text-sm leading-7 text-[var(--text)]">{msg.text}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* サマリー */}
      {talk.summary && (
        <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text3)]">Summary</p>
          <p className="mt-1 text-sm text-[var(--text2)]">{talk.summary}</p>
        </div>
      )}

      {/* アクション */}
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            handleStatusChange(talk.status === 'published' ? 'draft' : 'published')
          }
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--r-sm)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] disabled:pointer-events-none disabled:opacity-50"
        >
          {loading
            ? '更新中...'
            : talk.status === 'published'
            ? '下書きに戻す'
            : '公開する'}
        </button>
        <button
          onClick={() => router.push('/admin/cast-talk')}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          一覧に戻る
        </button>
      </div>
    </div>
  )
}
