'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CharacterAvatar, getButtonClass } from '@/components/ui'
import StartAnalysisButton from '@/components/start-analysis-button'
import { getCharacter } from '@/lib/characters'

type Props = {
  projectId: string
  projectName: string
  initialStatus: string
  competitorCount: number
  hasAudit: boolean
  reanalysisNextAvailableAt: string | null
}

export default function AnalysisStatusPanel({
  projectId,
  projectName,
  initialStatus,
  competitorCount,
  hasAudit,
  reanalysisNextAvailableAt,
}: Props) {
  const [optimisticAnalyzing, setOptimisticAnalyzing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (initialStatus !== 'analyzing') setOptimisticAnalyzing(false)
  }, [initialStatus])

  const status = optimisticAnalyzing ? 'analyzing' : initialStatus

  useEffect(() => {
    if (status !== 'analyzing') return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [status, router])
  const nextAvailableLabel = reanalysisNextAvailableAt
    ? new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(new Date(reanalysisNextAvailableAt))
    : null

  return (
    <div className="mt-8 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-2">調査レポート</div>
          <h3 className="text-[16px] font-bold text-[var(--text)] mb-2">HP調査・競合比較</h3>
          <p className="text-sm text-[var(--text2)] leading-relaxed">
            {competitorCount > 0
              ? `${competitorCount}件の競合HPを設定中。`
              : 'まだ競合HPは設定していません。競合なしでも調査は始められます。'}
            調査結果をもとに、取材で深掘りしたい観点を整理しやすくなります。
          </p>
        </div>
        <div className="flex flex-col gap-2 lg:min-w-[240px] lg:flex-shrink-0">
          {status === 'analyzing' ? (
            <>
              <div className="flex items-start gap-3 rounded-xl bg-[var(--warn-l)] px-4 py-3">
                <CharacterAvatar src={getCharacter('claus')?.icon48} alt="クラウスのアイコン" emoji={getCharacter('claus')?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--warn)]">調査中です。数分ほどお待ちください</p>
              </div>
              <button type="button" disabled className={`${getButtonClass('secondary')} opacity-40 cursor-not-allowed`}>
                この取材先を再調査する
              </button>
            </>
          ) : status === 'fetch_failed' ? (
            <>
              <div role="alert" className="flex items-start gap-3">
                <CharacterAvatar src={getCharacter('claus')?.icon48} alt="クラウスのアイコン" emoji={getCharacter('claus')?.emoji} size={32} />
                <div className="px-1 text-sm text-[var(--err)]">ホームページを取得できませんでした。URLを確認してもう一度お試しください。</div>
              </div>
              <StartAnalysisButton projectId={projectId} projectName={projectName} className={getButtonClass('secondary')} onStarted={() => setOptimisticAnalyzing(true)} />
            </>
          ) : status === 'report_ready' ? (
            <>
              <Link href={`/projects/${projectId}/report`} prefetch={false} className={getButtonClass('secondary')}>
                調査結果を見る
              </Link>
              <StartAnalysisButton projectId={projectId} projectName={projectName} force className={getButtonClass('secondary')} nextAvailableAt={reanalysisNextAvailableAt} onStarted={() => setOptimisticAnalyzing(true)} />
            </>
          ) : hasAudit ? (
            <StartAnalysisButton projectId={projectId} projectName={projectName} force className={getButtonClass('secondary')} nextAvailableAt={reanalysisNextAvailableAt} onStarted={() => setOptimisticAnalyzing(true)} />
          ) : (
            <StartAnalysisButton projectId={projectId} projectName={projectName} className={getButtonClass('secondary')} onStarted={() => setOptimisticAnalyzing(true)} />
          )}
          <Link href={`/projects/${projectId}/competitors`} className={getButtonClass('secondary')}>
            競合設定を見直す
          </Link>
          {nextAvailableLabel && status === 'report_ready' && (
            <p className="text-xs text-[var(--text3)]">
              次回の再調査は {nextAvailableLabel} 以降に行えます。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
