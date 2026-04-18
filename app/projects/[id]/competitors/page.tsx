'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { saveCompetitors } from '@/lib/actions/projects'
import { showToast } from '@/lib/client/toast'
import { getCharacter } from '@/lib/characters'
import { trackPendingProjectAnalysis } from '@/components/project-analysis-notifier'
import { CharacterAvatar, DevAiLabel, InterviewerSpeech, PageHeader, PrimaryButton, TextInput } from '@/components/ui'

export default function CompetitorsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const interviewer = getCharacter('claus')
  const [urls, setUrls] = useState([''])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const hasAnyUrl = urls.some((url) => url.trim())

  function updateUrl(i: number, val: string) {
    const next = [...urls]
    next[i] = val
    setUrls(next)
  }

  function removeUrl(i: number) {
    setUrls(urls.filter((_, idx) => idx !== i))
  }

  function addUrl() {
    if (urls.length < 3) setUrls([...urls, ''])
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await saveCompetitors(id, urls)
      if (result.error) {
        setError('うまく保存できませんでした。もう一度お試しください')
        return
      }
      trackPendingProjectAnalysis(id, 'この取材先')
      showToast({
        id: `analysis-started-${id}`,
        title: '調査を開始しました',
        description: 'このまま別の作業を進めて大丈夫です。完了したらお知らせします。',
      })
      fetch(`/api/projects/${id}/analyze`, { method: 'POST' }).catch(() => {
        showToast({
          id: `analysis-error-${id}`,
          title: '調査を開始できませんでした',
          description: '少し待ってから、もう一度お試しください。',
          tone: 'warning',
        })
      })
      router.push(`/projects/${id}`)
    })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader title="Insight Cast" backHref="/dashboard" />

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={interviewer?.icon48}
                alt={`${interviewer?.name ?? 'インタビュアー'}のアイコン`}
                emoji={interviewer?.emoji}
                size={48}
              />
            )}
            name={interviewer?.name ?? 'インタビュアー'}
            title="比べたいホームページがあれば教えてください。"
            description="分かる相手だけで大丈夫です。見比べることで、まだ伝え切れていない部分が見えやすくなります。"
            tone="soft"
          />
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
          <div className="space-y-3">
            {urls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <TextInput
                  type="text"
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                  placeholder="https://competitor.com"
                  className="flex-1"
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrl(i)}
                    className="px-3 text-stone-300 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 rounded-md cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {urls.length < 3 && (
            <button
              type="button"
              onClick={addUrl}
              className="text-sm text-stone-500 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 rounded-md cursor-pointer transition-colors"
            >
              + もう1件追加する
            </button>
          )}

          <p className="text-xs text-stone-400">
            分からなければスキップしても大丈夫です。あなたのHPの調査だけ行います。
          </p>

          {!error && hasAnyUrl && (
            <p className="text-xs text-stone-500">
              入れたURLだけ保存されます。空欄はそのままで大丈夫です。
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <PrimaryButton
            type="submit"
            disabled={isPending}
            className="w-full py-3 text-sm"
          >
            {isPending ? <DevAiLabel>登録中...</DevAiLabel> : <DevAiLabel>この内容で調査を進める</DevAiLabel>}
          </PrimaryButton>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              trackPendingProjectAnalysis(id, 'この取材先')
              showToast({
                id: `analysis-started-${id}`,
                title: '調査を開始しました',
                description: 'このまま別の作業を進めて大丈夫です。完了したらお知らせします。',
              })
              fetch(`/api/projects/${id}/analyze`, { method: 'POST' }).catch(() => {
                showToast({
                  id: `analysis-error-${id}`,
                  title: '調査を開始できませんでした',
                  description: '少し待ってから、もう一度お試しください。',
                  tone: 'warning',
                })
              })
              router.push(`/projects/${id}`)
            }}
            className="text-sm text-stone-500 hover:text-stone-700 underline rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
          >
            <DevAiLabel>競合が分からないのでスキップする</DevAiLabel>
          </button>
        </div>
      </div>
    </div>
  )
}
