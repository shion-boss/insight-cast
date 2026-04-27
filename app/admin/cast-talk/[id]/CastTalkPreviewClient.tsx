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

type Review = {
  overall_score: number
  naturalness_score: number | null
  character_score: number | null
  good_points: string | null
  improve_points: string | null
}

// ---------- Star Rating ----------

function StarRating({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string
  label: string
  value: number | null
  onChange: (v: number) => void
  required?: boolean
}) {
  return (
    <div>
      <p id={`${id}-label`} className="mb-1.5 text-xs font-semibold text-[var(--text2)]">
        {label}{required && <span className="ml-0.5 text-[var(--err)]">*</span>}
      </p>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer select-none">
            <input
              type="radio"
              name={id}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              required={required}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={`block text-2xl leading-none transition-colors ${
                value !== null && n <= value
                  ? 'text-amber-400'
                  : 'text-[var(--border2)] hover:text-amber-200'
              }`}
            >
              ★
            </span>
          </label>
        ))}
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(value)}
            aria-label="評価をリセット"
            className="ml-1 self-center text-xs text-[var(--text3)] underline hover:text-[var(--text)]"
            onDoubleClick={() => {
              // no-op placeholder — reset via separate interaction
            }}
          >
          </button>
        )}
      </div>
    </div>
  )
}

// ---------- Review Form ----------

function CastTalkReviewForm({
  castTalkId,
  initialReview,
}: {
  castTalkId: string
  initialReview: Review | null
}) {
  const [overallScore, setOverallScore] = useState<number | null>(initialReview?.overall_score ?? null)
  const [naturalnessScore, setNaturalnessScore] = useState<number | null>(initialReview?.naturalness_score ?? null)
  const [characterScore, setCharacterScore] = useState<number | null>(initialReview?.character_score ?? null)
  const [goodPoints, setGoodPoints] = useState(initialReview?.good_points ?? '')
  const [improvePoints, setImprovePoints] = useState(initialReview?.improve_points ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(initialReview !== null)
  const [error, setError] = useState<string | null>(null)

  function markDirty() {
    setSaved(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (overallScore === null) {
      setError('総合評価を選択してください')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/cast-talk/${castTalkId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overall_score: overallScore,
          naturalness_score: naturalnessScore,
          character_score: characterScore,
          good_points: goodPoints || null,
          improve_points: improvePoints || null,
        }),
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

  return (
    <form onSubmit={handleSubmit} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">品質評価</h2>
          <p className="mt-0.5 text-xs text-[var(--text3)]">評価はAIキャストの次回生成に反映されます</p>
        </div>
        {saved && (
          <span role="status" className="shrink-0 rounded-full bg-[var(--ok-l)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ok)]">
            評価済み ✓
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-[var(--err)]">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StarRating
          id={`review-overall-${castTalkId}`}
          label="総合評価"
          value={overallScore}
          onChange={(v) => { setOverallScore(v); markDirty() }}
          required
        />
        <StarRating
          id={`review-naturalness-${castTalkId}`}
          label="会話の自然さ"
          value={naturalnessScore}
          onChange={(v) => { setNaturalnessScore(v); markDirty() }}
        />
        <StarRating
          id={`review-character-${castTalkId}`}
          label="キャラらしさ"
          value={characterScore}
          onChange={(v) => { setCharacterScore(v); markDirty() }}
        />
      </div>

      {overallScore !== null && (
        <p className="text-xs text-[var(--text3)]">
          {overallScore <= 2 && '品質に問題あり — 改善してほしい点を書くと次の生成に反映されます'}
          {overallScore === 3 && 'まあまあ — 良い点・改善点を書いておくと精度が上がります'}
          {overallScore >= 4 && '良い出来 — 良かった点を書いておくと同じ方向性を維持できます'}
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label
            htmlFor={`review-good-${castTalkId}`}
            className="block text-xs font-semibold text-[var(--text2)] mb-1.5"
          >
            良かった点
          </label>
          <textarea
            id={`review-good-${castTalkId}`}
            value={goodPoints}
            onChange={(e) => { setGoodPoints(e.target.value); markDirty() }}
            rows={2}
            placeholder="テンポが良かった、具体例が分かりやすかった など"
            className="w-full resize-y rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text3)] transition-colors hover:border-[var(--border2)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          />
        </div>
        <div>
          <label
            htmlFor={`review-improve-${castTalkId}`}
            className="block text-xs font-semibold text-[var(--text2)] mb-1.5"
          >
            改善してほしい点
          </label>
          <textarea
            id={`review-improve-${castTalkId}`}
            value={improvePoints}
            onChange={(e) => { setImprovePoints(e.target.value); markDirty() }}
            rows={2}
            placeholder="会話が長すぎた、キャラの口調が似ていた など"
            className="w-full resize-y rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text3)] transition-colors hover:border-[var(--border2)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || saved || overallScore === null}
        className="inline-flex min-h-10 items-center gap-2 rounded-[var(--r-sm)] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] disabled:pointer-events-none disabled:opacity-50"
      >
        {saving ? '保存中...' : saved ? '保存済み ✓' : '評価を保存'}
      </button>
    </form>
  )
}

// ---------- Main Component ----------

export function CastTalkPreviewClient({
  talk,
  characterMap,
  existingReview,
}: {
  talk: CastTalk
  characterMap: Record<string, Character>
  existingReview: Review | null
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

      <div>
        <label htmlFor="cast-talk-title" className="block text-xs font-semibold uppercase tracking-widest text-[var(--text3)] mb-1.5">
          タイトル
        </label>
        <input
          id="cast-talk-title"
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaved(false) }}
          className="w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] transition-colors placeholder:text-[var(--text3)] hover:border-[var(--border2)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        />
      </div>

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

      <CastTalkReviewForm castTalkId={talk.id} initialReview={existingReview} />
    </div>
  )
}
