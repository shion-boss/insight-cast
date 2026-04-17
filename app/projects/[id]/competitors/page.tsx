'use client'

import { useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { saveCompetitors } from '@/lib/actions/projects'
import Link from 'next/link'
import { PageHeader, PrimaryButton, TextInput } from '@/components/ui'

export default function CompetitorsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
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
      <PageHeader title="Insight Cast" backHref="/dashboard" />

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
              className="text-sm text-stone-500 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 rounded-md cursor-pointer transition-colors"
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
            {isPending ? '登録中...' : '調査を始める'}
          </PrimaryButton>
        </form>

        <div className="text-center mt-4">
          <Link
            href={`/projects/${id}/report`}
            className="text-sm text-stone-500 hover:text-stone-700 underline rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            競合が分からないのでスキップする
          </Link>
        </div>
      </div>
    </div>
  )
}
