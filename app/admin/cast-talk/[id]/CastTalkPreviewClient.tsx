'use client'

import Image from 'next/image'
import Link from 'next/link'
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
  const [title, setTitle] = useState(talk.title)
  const [summary, setSummary] = useState(talk.summary ?? '')
  const [messages, setMessages] = useState<Message[]>(talk.messages)
  const [status, setStatus] = useState(talk.status)
  const [saving, setSaving] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [saved, setSaved] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function updateMessage(index: number, text: string) {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, text } : m)))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/cast-talk/${talk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary: summary || null, messages }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        throw new Error(data.message ?? '保存に失敗しました')
      }
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(newStatus: 'draft' | 'published') {
    setStatusChanging(true)
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
      setStatus(newStatus)
      if (newStatus === 'published') router.push('/admin/cast-talk')
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー')
    } finally {
      setStatusChanging(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="space-y-1">
        <Link
          href="/admin/cast-talk"
          className="text-sm text-[var(--text3)] transition-colors hover:text-[var(--text)]"
        >
          ← Cast Talk 一覧
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl font-bold text-[var(--text)]">Cast Talk 編集</h1>
            <p className="mt-0.5 text-xs text-[var(--text3)]">{talk.theme}</p>
          </div>
          <span
            className={`mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              status === 'published'
                ? 'bg-[var(--ok-l)] text-[var(--ok)]'
                : 'border border-[var(--border)] bg-[var(--bg2)] text-[var(--text3)]'
            }`}
          >
            {status === 'published' ? '公開中' : '下書き'}
          </span>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-[var(--r-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* タイトル */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text3)] mb-1.5">
          タイトル
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaved(false) }}
          className="w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] transition-colors placeholder:text-[var(--text3)] hover:border-[var(--border2)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        />
      </div>

      {/* 会話メッセージ */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text3)] mb-3">会話</p>
        <div className="space-y-4">
          {messages.map((msg, i) => {
            const char = characterMap[msg.castId]
            return (
              <div key={i} className="flex items-start gap-3">
                {char ? (
                  <Image
                    src={char.icon48}
                    alt={char.name}
                    width={36}
                    height={36}
                    className="mt-1 shrink-0 rounded-full border border-[var(--border)]"
                  />
                ) : (
                  <div className="mt-1 h-9 w-9 shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center text-xs text-[var(--text3)]">
                    {msg.castId.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-semibold text-[var(--text3)]">
                    {char?.name ?? msg.castId}
                  </p>
                  <textarea
                    aria-label={`${char?.name ?? msg.castId}のセリフ`}
                    value={msg.text}
                    onChange={(e) => updateMessage(i, e.target.value)}
                    rows={3}
                    className="w-full resize-y rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-relaxed text-[var(--text)] transition-colors hover:border-[var(--border2)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* サマリー */}
      <div>
        <label htmlFor="cast-talk-summary" className="block text-xs font-semibold uppercase tracking-widest text-[var(--text3)] mb-1.5">
          サマリー
        </label>
        <textarea
          id="cast-talk-summary"
          value={summary}
          onChange={(e) => { setSummary(e.target.value); setSaved(false) }}
          rows={3}
          className="w-full resize-y rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm leading-relaxed text-[var(--text)] transition-colors placeholder:text-[var(--text3)] hover:border-[var(--border2)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        />
      </div>

      {/* アクション */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || saved}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--r-sm)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? '保存中...' : saved ? '保存済み ✓' : '保存する'}
        </button>
        <button
          type="button"
          onClick={() => handleStatusChange(status === 'published' ? 'draft' : 'published')}
          disabled={statusChanging}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:pointer-events-none disabled:opacity-50"
        >
          {statusChanging ? '更新中...' : status === 'published' ? '下書きに戻す' : '公開する'}
        </button>
      </div>
    </div>
  )
}
