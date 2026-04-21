'use client'

import { useEffect, useState } from 'react'
import {
  getPendingArticleGenerationCount,
  TASK_QUEUE_EVENT,
} from '@/components/project-analysis-notifier'
import { StatusPill } from '@/components/ui'

type Props = {
  interviewId: string
  hasSummary: boolean
  hasArticle: boolean
  hasUncreatedThemes: boolean
  articleStatus?: string | null
  summaryLabel?: string
  articleLabel?: string
  creatingLabel?: string
  uncreatedLabel?: string
}

export default function InterviewStatusPills({
  interviewId,
  hasSummary,
  hasArticle,
  hasUncreatedThemes,
  articleStatus = null,
  summaryLabel = 'メモ',
  articleLabel = '記事',
  creatingLabel = '作成中',
  uncreatedLabel = '未作成',
}: Props) {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    function syncPendingCount() {
      setPendingCount(getPendingArticleGenerationCount(interviewId))
    }

    syncPendingCount()
    window.addEventListener(TASK_QUEUE_EVENT, syncPendingCount)
    window.addEventListener('storage', syncPendingCount)

    return () => {
      window.removeEventListener(TASK_QUEUE_EVENT, syncPendingCount)
      window.removeEventListener('storage', syncPendingCount)
    }
  }, [interviewId])

  const hasTerminalServerStatus = articleStatus === 'ready' || articleStatus === 'failed'
  const isCreating = articleStatus === 'generating' || (!hasTerminalServerStatus && pendingCount > 0)

  return (
    <>
      {hasSummary && <StatusPill tone="neutral">{summaryLabel}</StatusPill>}
      {hasArticle && <StatusPill tone="success">{articleLabel}</StatusPill>}
      {isCreating && <StatusPill tone="info">{creatingLabel}</StatusPill>}
      {hasUncreatedThemes && !isCreating && <StatusPill tone="warning">{uncreatedLabel}</StatusPill>}
    </>
  )
}
