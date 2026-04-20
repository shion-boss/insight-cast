'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import CompetitorSelectionFields from '@/components/competitor-selection-fields'
import { trackPendingProjectAnalysis } from '@/components/project-analysis-notifier'
import { DevAiLabel, PrimaryButton } from '@/components/ui'
import { saveCompetitors } from '@/lib/actions/projects'
import { showToast } from '@/lib/client/toast'

type Props = {
  projectId: string
  projectName: string
  siteUrl: string
  initialCompetitorUrls: string[]
  initialIndustryMemo: string
  initialLocation: string
}

export default function CompetitorsForm({
  projectId,
  projectName,
  siteUrl,
  initialCompetitorUrls,
  initialIndustryMemo,
  initialLocation,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const urls = formData.getAll('competitor_urls').map((value) => String(value))
    const industryMemo = String(formData.get('industry_memo') ?? '')
    const location = String(formData.get('location') ?? '')

    startTransition(async () => {
      const result = await saveCompetitors(projectId, {
        urls,
        industryMemo,
        location,
      })
      if (result.error) {
        setError('うまく保存できませんでした。少し待ってから、もう一度お試しください。')
        return
      }

      trackPendingProjectAnalysis(projectId, projectName)
      showToast({
        id: `analysis-started-${projectId}`,
        title: '再調査を開始しました',
        description: '競合設定を更新したので、最新の内容で結果を作り直します。',
      })

      fetch(`/api/projects/${projectId}/analyze`, { method: 'POST' }).catch(() => {
        showToast({
          id: `analysis-error-${projectId}`,
          title: '調査を開始できませんでした',
          description: '少し待ってから、もう一度お試しください。',
          tone: 'warning',
        })
      })

      router.push(`/projects/${projectId}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 space-y-3">
        <div>
          <p className="text-xs text-[var(--text3)]">自社HP URL</p>
          <p className="mt-1 break-all text-sm font-medium text-[var(--text2)]">{siteUrl}</p>
        </div>
        <p className="text-xs leading-relaxed text-[var(--text3)]">
          いま設定している競合URLは下の入力欄に入っています。空にして保存すると、競合なしで再調査します。
        </p>
        {initialCompetitorUrls.length === 0 && (
          <p className="text-xs text-[var(--text3)]">
            まだ競合は未設定です。おすすめから選ぶか、URLを手入力して追加できます。
          </p>
        )}
      </section>

      <CompetitorSelectionFields
        siteUrl={siteUrl}
        initialUrls={initialCompetitorUrls}
        initialIndustryMemo={initialIndustryMemo}
        initialLocation={initialLocation}
        helperText="おすすめと手入力を合わせて最大3件までです。空にして保存すると、競合なしで再調査できます。"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <PrimaryButton
        type="submit"
        disabled={isPending}
        className="w-full py-3 text-sm"
      >
        {isPending ? <DevAiLabel>保存して再調査しています...</DevAiLabel> : <DevAiLabel>この内容で保存して再調査する</DevAiLabel>}
      </PrimaryButton>
    </form>
  )
}
