'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DevAiLabel } from '@/components/ui'
import { showToast } from '@/lib/client/toast'
import {
  clearPendingProjectAnalysis,
  trackPendingProjectAnalysis,
} from '@/components/project-analysis-notifier'

type Props = {
  projectId: string
  projectName: string
  className: string
  compact?: boolean
  force?: boolean
  nextAvailableAt?: string | null
  onStarted?: () => void
}

export default function StartAnalysisButton({
  projectId,
  projectName,
  className,
  compact = false,
  force = false,
  nextAvailableAt = null,
  onStarted,
}: Props) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)

  const isLimited = force && nextAvailableAt !== null && new Date(nextAvailableAt) > new Date()
  const nextAvailableLabel = isLimited
    ? new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(new Date(nextAvailableAt!))
    : null

  async function startAnalysis() {
    if (starting) return

    setStarting(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/analysis-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(force ? { force: true } : {}),
      })

      if (!res.ok) {
        throw new Error('failed to start')
      }

      const json = await res.json().catch(() => null)
      router.refresh()

      if (json?.status === 'report_ready') {
        clearPendingProjectAnalysis(projectId)
        showToast({
          id: `analysis-ready-${projectId}`,
          title: '調査結果をすぐ確認できます',
          description: `${projectName} の結果が用意できています。`,
          tone: 'success',
          href: `/projects/${projectId}/report`,
          hrefLabel: '調査結果を見る',
        })
        return
      }

      onStarted?.()
      trackPendingProjectAnalysis(projectId, projectName)
      showToast({
        id: `analysis-started-${projectId}`,
        title: force ? '再調査を開始しました' : '調査を開始しました',
        description: force
          ? '最新の内容で結果を作り直します。完了したらお知らせします。'
          : 'このまま別の作業を進めて大丈夫です。完了したらお知らせします。',
      })

      void fetch(`/api/projects/${projectId}/analyze`, { method: 'POST' })
        .then(async (response) => {
          if (response.status === 429) {
            const json = await response.json().catch(() => null)
            clearPendingProjectAnalysis(projectId)
            showToast({
              id: `analysis-limited-${projectId}`,
              title: '再調査は月1回までです',
              description: json?.next_available_at
                ? `次回は ${new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(new Date(json.next_available_at))} 以降に調査できます。`
                : '前回の調査から30日経過後に再調査できます。',
              tone: 'warning',
            })
            router.refresh()
            return
          }
          if (!response.ok) {
            throw new Error('failed to analyze')
          }
        })
        .catch(() => {
          clearPendingProjectAnalysis(projectId)
          showToast({
            id: `analysis-error-${projectId}`,
            title: '調査を開始できませんでした',
            description: '少し待ってから、もう一度お試しください。',
            tone: 'warning',
          })
          router.refresh()
        })
    } catch {
      clearPendingProjectAnalysis(projectId)
      showToast({
        id: `analysis-error-${projectId}`,
        title: '調査を開始できませんでした',
        description: '少し待ってから、もう一度お試しください。',
        tone: 'warning',
      })
    } finally {
      setStarting(false)
    }
  }

  if (isLimited) {
    return (
      <button
        type="button"
        disabled
        className={className}
        title={`次回の再調査は ${nextAvailableLabel} 以降に可能です`}
      >
        <span className="opacity-50">
          {compact ? '再調査する' : 'この取材先を再調査する'}
        </span>
        <span className="ml-2 text-[11px] opacity-60">{nextAvailableLabel}〜</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={startAnalysis}
      disabled={starting}
      className={className}
    >
      <DevAiLabel>
        {starting
          ? (force ? '再調査を開始しています...' : '調査を開始しています...')
          : force
            ? (compact ? '再調査する' : 'この取材先を再調査する')
            : (compact ? '調査を開始する' : 'この取材先の調査を開始する')}
      </DevAiLabel>
    </button>
  )
}
