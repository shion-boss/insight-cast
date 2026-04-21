'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
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
  const [error, setError] = useState<string | null>(null)
  const [competitorIssue, setCompetitorIssue] = useState<string | null>(null)
  const [canSubmit, setCanSubmit] = useState(true)
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'requesting'>('idle')

  const isBusy = submitState !== 'idle'

  function getLimitMessage(rawNextAvailableAt?: string | null) {
    if (!rawNextAvailableAt) {
      return '前回の調査から30日経過後に再調査できます。'
    }

    const label = new Intl.DateTimeFormat('ja-JP', {
      month: 'long',
      day: 'numeric',
    }).format(new Date(rawNextAvailableAt))

    return `次回は ${label} 以降に再調査できます。`
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError(competitorIssue ?? '参考HPの入力内容を確認してから保存してください。')
      return
    }

    const formData = new FormData(event.currentTarget)
    const urls = formData.getAll('competitor_urls').map((value) => String(value))
    const industryMemo = String(formData.get('industry_memo') ?? '')
    const location = String(formData.get('location') ?? '')

    setSubmitState('saving')

    const result = await saveCompetitors(projectId, {
      urls,
      industryMemo,
      location,
    })
    if (result.error) {
      setSubmitState('idle')
      if (result.error === 'competitor_limit') {
        setError('参考HPは最大3件までです。1件以上外してから保存してください。')
        return
      }
      if (result.error === 'competitor_self') {
        setError('自社HPと同じURLは参考HPに入れられません。別のHPに差し替えてください。')
        return
      }
      setError('うまく保存できませんでした。少し待ってから、もう一度お試しください。')
      return
    }

    setSubmitState('requesting')

    try {
      const response = await fetch(`/api/projects/${projectId}/analyze`, { method: 'POST' })

      if (response.status === 429) {
        const json = await response.json().catch(() => null)
        const message = getLimitMessage(json?.next_available_at)
        setError(`保存は完了しましたが、${message}`)
        showToast({
          id: `analysis-limited-${projectId}`,
          title: '再調査は月1回までです',
          description: message,
          tone: 'warning',
        })
        return
      }

      if (!response.ok) {
        throw new Error('failed to analyze')
      }

      trackPendingProjectAnalysis(projectId, projectName)
      showToast({
        id: `analysis-started-${projectId}`,
        title: '再調査を受け付けました',
        description: '競合設定を反映して、バックグラウンドで結果を作り直します。',
      })
      router.push(`/projects/${projectId}`)
    } catch {
      setError('保存は完了しましたが、再調査を受け付けられませんでした。少し待ってから、もう一度お試しください。')
      showToast({
        id: `analysis-error-${projectId}`,
        title: '再調査を開始できませんでした',
        description: '保存内容は反映されています。少し待ってから、もう一度お試しください。',
        tone: 'warning',
      })
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 space-y-3">
        <div>
          <p className="text-xs text-[var(--text3)]">自社HP URL</p>
          <p className="mt-1 break-all text-sm font-medium text-[var(--text2)]">{siteUrl}</p>
        </div>
        <p className="text-xs leading-relaxed text-[var(--text3)]">
          いま設定している参考HPは下の入力欄に入っています。空にして保存すると、比較なしで再調査します。
        </p>
        {initialCompetitorUrls.length === 0 && (
          <p className="text-xs text-[var(--text3)]">
            まだ参考HPは登録されていません。おすすめから選ぶか、URLを入力して追加できます。
          </p>
        )}
      </section>

      <CompetitorSelectionFields
        siteUrl={siteUrl}
        initialUrls={initialCompetitorUrls}
        initialIndustryMemo={initialIndustryMemo}
        initialLocation={initialLocation}
        helperText="おすすめと手入力を合わせて最大3件までです。空にして保存すると、競合なしで再調査できます。"
        onSelectionStateChange={(state) => {
          setCanSubmit(state.canSubmit)
          setCompetitorIssue(state.issue)
        }}
      />

      {competitorIssue && !error && (
        <p className="text-sm text-[var(--err)]">{competitorIssue}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <PrimaryButton
        type="submit"
        disabled={isBusy || !canSubmit}
        className="w-full py-3 text-sm"
      >
        {submitState === 'saving' ? (
          <DevAiLabel>保存しています...</DevAiLabel>
        ) : submitState === 'requesting' ? (
          <DevAiLabel>再調査を依頼しています...</DevAiLabel>
        ) : (
          <DevAiLabel>この内容で保存して再調査する</DevAiLabel>
        )}
      </PrimaryButton>
    </form>
  )
}
