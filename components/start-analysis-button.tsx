'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/client/toast'
import {
  clearPendingProjectAnalysis,
  trackPendingProjectAnalysis,
} from '@/components/project-analysis-notifier'

type StartPhase = 'idle' | 'preparing' | 'requesting'

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
  const [phase, setPhase] = useState<StartPhase>('idle')

  const isLimited = force && nextAvailableAt !== null && new Date(nextAvailableAt) > new Date()
  const nextAvailableLabel = isLimited
    ? new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(new Date(nextAvailableAt!))
    : null
  const isBusy = phase !== 'idle'

  function showReanalysisLimitToast(rawNextAvailableAt?: string | null) {
    const formatted = rawNextAvailableAt
      ? new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(new Date(rawNextAvailableAt))
      : null

    clearPendingProjectAnalysis(projectId)
    showToast({
      id: `analysis-limited-${projectId}`,
      title: '再調査は月1回までです',
      description: formatted
        ? `次回は ${formatted} 以降に再調査できます。`
        : '前回の調査から30日経過後に再調査できます。',
      tone: 'warning',
      characterId: 'claus',
    })
  }

  async function startAnalysis() {
    if (isBusy) return

    setPhase('preparing')

    try {
      const res = await fetch(`/api/projects/${projectId}/analysis-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(force ? { force: true } : {}),
      })

      if (res.status === 403) {
        clearPendingProjectAnalysis(projectId)
        showToast({
          id: `analysis-plan-locked-${projectId}`,
          title: '調査を開始できませんでした',
          description: '無料プランの上限に達しています。プランをアップグレードすると続けられます。',
          tone: 'warning',
          characterId: 'claus',
        })
        return
      }

      if (res.status === 429) {
        const json = await res.json().catch(() => null)
        showReanalysisLimitToast(json?.next_available_at)
        router.refresh()
        return
      }

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
          characterId: 'claus',
        })
        return
      }

      setPhase('requesting')

      const analyzeResponse = await fetch(`/api/projects/${projectId}/analyze`, { method: 'POST' })
      if (analyzeResponse.status === 429) {
        const analyzeJson = await analyzeResponse.json().catch(() => null)
        showReanalysisLimitToast(analyzeJson?.next_available_at)
        router.refresh()
        return
      }

      if (!analyzeResponse.ok) {
        throw new Error('failed to analyze')
      }

      onStarted?.()
      trackPendingProjectAnalysis(projectId, projectName)
      showToast({
        id: `analysis-started-${projectId}`,
        title: force ? '再調査を受け付けました' : '調査を受け付けました',
        description: force
          ? '最新の内容で結果を作り直します。完了したらお知らせします。'
          : 'バックグラウンドで進めます。完了したらお知らせします。',
        characterId: 'claus',
      })
      router.refresh()
    } catch {
      clearPendingProjectAnalysis(projectId)
      showToast({
        id: `analysis-error-${projectId}`,
        title: '調査を開始できませんでした',
        description: '少し待ってから、もう一度お試しください。',
        tone: 'warning',
        characterId: 'claus',
      })
    } finally {
      setPhase('idle')
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
      disabled={isBusy}
      className={className}
    >
      {phase === 'preparing'
        ? (force ? '再調査の準備をしています...' : '調査の準備をしています...')
        : phase === 'requesting'
          ? (force ? '再調査を依頼しています...' : '調査を依頼しています...')
        : force
          ? (compact ? '再調査する' : 'この取材先を再調査する')
          : (compact ? '調査を開始する' : 'この取材先の調査を開始する')}
    </button>
  )
}
