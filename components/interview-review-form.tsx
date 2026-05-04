'use client'

import { useEffect, useState } from 'react'
import { showToast } from '@/lib/client/toast'
import { getButtonClass } from '@/components/ui'

type ReviewState = {
  overall_score: number | null
  character_score: number | null
  question_quality_score: number | null
  enjoyment_score: number | null
  good_points: string
  improve_points: string
}

const SCORE_LABELS = ['1', '2', '3', '4', '5']

const AXES: Array<{ key: keyof Pick<ReviewState, 'overall_score' | 'character_score' | 'question_quality_score' | 'enjoyment_score'>; label: string; help: string }> = [
  { key: 'overall_score', label: '総合', help: '全体としてどう感じたか' },
  { key: 'character_score', label: 'キャラらしさ', help: '人格・口調・観点が崩れていないか' },
  { key: 'question_quality_score', label: '問いの質', help: '答えやすく、専門ラベルに沿った問いだったか' },
  { key: 'enjoyment_score', label: '楽しさ', help: 'また話したいと思える会話だったか' },
]

const initial: ReviewState = {
  overall_score: null,
  character_score: null,
  question_quality_score: null,
  enjoyment_score: null,
  good_points: '',
  improve_points: '',
}

export function InterviewReviewForm({
  projectId,
  interviewId,
}: {
  projectId: string
  interviewId: string
}) {
  const [state, setState] = useState<ReviewState>(initial)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/interviews/${interviewId}/review`)
        if (!res.ok) {
          if (res.status !== 404) {
            const json = await res.json().catch(() => ({}))
            throw new Error(json.error ?? '読み込みに失敗しました')
          }
        } else {
          const json = await res.json()
          if (!cancelled && json.review) {
            setState({
              overall_score: json.review.overall_score ?? null,
              character_score: json.review.character_score ?? null,
              question_quality_score: json.review.question_quality_score ?? null,
              enjoyment_score: json.review.enjoyment_score ?? null,
              good_points: json.review.good_points ?? '',
              improve_points: json.review.improve_points ?? '',
            })
            setSavedAt(json.review.updated_at ?? null)
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '読み込みに失敗しました')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId, interviewId])

  const setScore = (key: typeof AXES[number]['key'], score: number) => {
    setState((s) => ({ ...s, [key]: s[key] === score ? null : score }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state.overall_score === null) {
      setError('総合スコアは必須です')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/interviews/${interviewId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overall_score: state.overall_score,
          character_score: state.character_score,
          question_quality_score: state.question_quality_score,
          enjoyment_score: state.enjoyment_score,
          good_points: state.good_points || null,
          improve_points: state.improve_points || null,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? '保存に失敗しました')
      }
      const json = await res.json()
      setSavedAt(json.review?.updated_at ?? new Date().toISOString())
      showToast({ tone: 'success', title: '取材レビューを保存しました' })
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white p-4 sm:p-6">
        <p className="text-sm text-stone-500">読み込み中...</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 sm:p-6">
      <header className="mb-3">
        <h2 className="text-base font-semibold text-stone-900">この取材の振り返り</h2>
        <p className="mt-1 text-xs text-stone-500">
          AIキャストの会話品質をフィードバックしてください。蓄積されたレビューはキャラ正典の改善に使われます。
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-3">
          {AXES.map((axis) => (
            <div key={axis.key} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="sm:w-32">
                <div className="text-sm font-medium text-stone-800">{axis.label}{axis.key === 'overall_score' && <span className="ml-1 text-rose-500">*</span>}</div>
                <div className="text-xs text-stone-500">{axis.help}</div>
              </div>
              <div className="flex gap-1.5">
                {SCORE_LABELS.map((label, idx) => {
                  const score = idx + 1
                  const selected = state[axis.key] === score
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setScore(axis.key, score)}
                      className={`h-8 w-8 rounded-md border text-sm transition-colors ${
                        selected
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                      aria-label={`${axis.label} スコア ${label}`}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-800" htmlFor="good_points">良かった点</label>
          <textarea
            id="good_points"
            value={state.good_points}
            onChange={(e) => setState((s) => ({ ...s, good_points: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="例: 相槌のバリエーションが豊か、初手の質問が答えやすかった など"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-800" htmlFor="improve_points">改善してほしい点</label>
          <textarea
            id="improve_points"
            value={state.improve_points}
            onChange={(e) => setState((s) => ({ ...s, improve_points: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="例: 後半で相槌が減った、専門知識の根拠提示が薄い、キャラの守備範囲外に踏み込んだ など"
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className={getButtonClass('primary')}>
            {saving ? '保存中...' : savedAt ? '更新する' : '登録する'}
          </button>
          {savedAt ? (
            <span className="text-xs text-stone-500">最終更新: {new Date(savedAt).toLocaleString('ja-JP')}</span>
          ) : null}
        </div>
      </form>
    </section>
  )
}
