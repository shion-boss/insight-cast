'use client'

import { useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { saveCompetitors } from '@/lib/actions/projects'
import Link from 'next/link'

export default function CompetitorsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [urls, setUrls] = useState([''])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await saveCompetitors(id, urls)
      if (result.error) {
        setError('うまく保存できませんでした。もう一度お試しください')
        return
      }
      router.push(`/projects/${id}/report`)
    })
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-stone-800">Insight Cast</span>
        <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-600">← 戻る</Link>
      </header>

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="flex items-start gap-3 mb-8">
          <span className="text-3xl">🦉</span>
          <div>
            <p className="text-stone-700 font-medium">
              同業他社のホームページがあれば教えてください。
            </p>
            <p className="text-sm text-stone-400 mt-1">
              比較することで、あなたのHPに何が足りないかが見えてきます。
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
          <div className="space-y-3">
            {urls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                  placeholder="https://competitor.com"
                  className="flex-1 px-4 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrl(i)}
                    className="px-3 text-stone-300 hover:text-red-400 cursor-pointer transition-colors"
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
              className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer transition-colors"
            >
              + もう1件追加する
            </button>
          )}

          <p className="text-xs text-stone-400">
            分からなければスキップしても大丈夫です。あなたのHPの調査だけ行います。
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm"
          >
            {isPending ? '登録中...' : '調査を始める'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link
            href={`/projects/${id}/report`}
            className="text-sm text-stone-400 hover:text-stone-600 underline"
          >
            競合が分からないのでスキップする
          </Link>
        </div>
      </div>
    </div>
  )
}
