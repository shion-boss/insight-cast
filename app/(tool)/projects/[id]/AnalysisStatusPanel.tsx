'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CharacterAvatar, getButtonClass } from '@/components/ui'
import StartAnalysisButton from '@/components/start-analysis-button'
import { getCharacter } from '@/lib/characters'

type GscStatus = 'loading' | 'connected' | 'disconnected'

type Props = {
  projectId: string
  projectName: string
  initialStatus: string
  competitorCount: number
  hasAudit: boolean
  reanalysisNextAvailableAt: string | null
}

function GscDisconnectModal({
  onConfirm,
  onCancel,
  isDeleting,
  claus,
}: {
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
  claus: ReturnType<typeof import('@/lib/characters').getCharacter>
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // フォーカストラップ: モーダルが開いたら最初のボタンにフォーカス
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    // 最初のフォーカス可能要素にフォーカス
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      if (e.key !== 'Tab') return

      const focusableEls = Array.from(
        dialog!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      )
      if (focusableEls.length === 0) return

      const first = focusableEls[0]
      const last = focusableEls[focusableEls.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gsc-disconnect-title"
        tabIndex={-1}
        className="w-full max-w-sm rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--border)] p-6 shadow-xl focus-visible:outline-none"
      >
        <div className="flex items-start gap-3 mb-4">
          <CharacterAvatar src={claus?.icon48} alt="クラウスのアイコン" emoji={claus?.emoji} size={40} className="flex-shrink-0 mt-0.5" />
          <div>
            <p id="gsc-disconnect-title" className="text-[15px] font-bold text-[var(--text)] mb-1">
              連携を解除しますか？
            </p>
            <p className="text-sm text-[var(--text2)] leading-relaxed">
              Google Search Console の連携を解除します。解除後は検索データが調査に使われなくなります。
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            やめておく
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--r-sm)] border border-[var(--err)] bg-[var(--err)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
          >
            {isDeleting ? '解除中...' : '解除する'}
          </button>
        </div>
      </div>
    </div>
  )
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
  const [gscStatus, setGscStatus] = useState<GscStatus>('loading')
  const [gscSiteUrl, setGscSiteUrl] = useState<string | null>(null)
  const [gscToast, setGscToast] = useState<'connected' | 'error' | 'no_property' | null>(null)
  const [gscDeleting, setGscDeleting] = useState(false)
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // GSC 接続状態を取得
  const fetchGscStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/gsc`)
      if (!res.ok) {
        setGscStatus('disconnected')
        return
      }
      const data = (await res.json()) as { connected: boolean; site_url?: string }
      setGscStatus(data.connected ? 'connected' : 'disconnected')
      setGscSiteUrl(data.site_url ?? null)
    } catch {
      setGscStatus('disconnected')
    }
  }, [projectId])

  useEffect(() => {
    void fetchGscStatus()
  }, [fetchGscStatus])

  // ?gsc= クエリでトースト表示
  useEffect(() => {
    const gscParam = searchParams.get('gsc')
    if (gscParam === 'connected') {
      setGscToast('connected')
      void fetchGscStatus()
      // クエリを除去（履歴は残さない）
      const url = new URL(window.location.href)
      url.searchParams.delete('gsc')
      window.history.replaceState(null, '', url.toString())
    } else if (gscParam === 'error') {
      setGscToast('error')
      const url = new URL(window.location.href)
      url.searchParams.delete('gsc')
      window.history.replaceState(null, '', url.toString())
    } else if (gscParam === 'no_property') {
      setGscToast('no_property')
      const url = new URL(window.location.href)
      url.searchParams.delete('gsc')
      window.history.replaceState(null, '', url.toString())
    }
  }, [searchParams, fetchGscStatus])

  // トーストを数秒後に消す
  useEffect(() => {
    if (!gscToast) return
    const timer = setTimeout(() => setGscToast(null), 5000)
    return () => clearTimeout(timer)
  }, [gscToast])

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

  const handleGscDisconnectRequest = () => {
    setShowDisconnectModal(true)
  }

  const handleGscDisconnectConfirm = async () => {
    setGscDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/gsc`, { method: 'DELETE' })
      if (res.ok) {
        setGscStatus('disconnected')
        setGscSiteUrl(null)
        setShowDisconnectModal(false)
      } else {
        setShowDisconnectModal(false)
        setGscToast('error')
      }
    } catch {
      setShowDisconnectModal(false)
      setGscToast('error')
    } finally {
      setGscDeleting(false)
    }
  }

  const handleGscDisconnectCancel = () => {
    setShowDisconnectModal(false)
  }

  const claus = getCharacter('claus')

  return (
    <>
    {showDisconnectModal && (
      <GscDisconnectModal
        onConfirm={() => void handleGscDisconnectConfirm()}
        onCancel={handleGscDisconnectCancel}
        isDeleting={gscDeleting}
        claus={claus}
      />
    )}
    <div className="mt-8 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 space-y-6">
      {/* HP調査・競合比較 セクション */}
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
              <div role="status" className="flex items-start gap-3 rounded-xl bg-[var(--warn-l)] px-4 py-3">
                <CharacterAvatar src={claus?.icon48} alt="クラウスのアイコン" emoji={claus?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--warn)]">クラウスがホームページを調べています。数分後にもう一度確認してみてください。</p>
              </div>
              <button type="button" disabled className={getButtonClass('secondary')}>
                この取材先を再調査する
              </button>
            </>
          ) : status === 'fetch_failed' ? (
            <>
              <div role="alert" className="flex items-start gap-3">
                <CharacterAvatar src={claus?.icon48} alt="クラウスのアイコン" emoji={claus?.emoji} size={32} />
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

      {/* Google Search Console 連携 セクション */}
      <div className="border-t border-[var(--border)] pt-5">
        {/* トースト */}
        {gscToast === 'connected' && (
          <div role="status" className="mb-4 flex items-center gap-3 rounded-xl bg-[var(--ok-l)] px-4 py-3 border border-[var(--ok)]/30">
            <CharacterAvatar src={claus?.icon48} alt="クラウスのアイコン" emoji={claus?.emoji} size={28} className="flex-shrink-0" />
            <p className="text-sm text-[var(--ok)] font-medium">Google Search Console と連携しました。次回の調査から検索データが分析に使われます。</p>
          </div>
        )}
        {gscToast === 'error' && (
          <div role="alert" className="mb-4 flex items-center gap-3 rounded-xl bg-[var(--err-l,#fff0f0)] px-4 py-3 border border-[var(--err)]/30">
            <CharacterAvatar src={claus?.icon48} alt="クラウスのアイコン" emoji={claus?.emoji} size={28} className="flex-shrink-0" />
            <p className="text-sm text-[var(--err)]">連携に失敗しました。もう一度お試しください。</p>
          </div>
        )}
        {gscToast === 'no_property' && (
          <div role="alert" className="mb-4 flex items-center gap-3 rounded-xl bg-[var(--warn-l)] px-4 py-3 border border-[var(--warn)]/30">
            <CharacterAvatar src={claus?.icon48} alt="クラウスのアイコン" emoji={claus?.emoji} size={28} className="flex-shrink-0" />
            <p className="text-sm text-[var(--warn)]">Google Search Console にこのサイトのプロパティが見つかりませんでした。GSCにサイトを登録してからもう一度お試しください。</p>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <CharacterAvatar
              src={claus?.icon48}
              alt="クラウスのアイコン"
              emoji={claus?.emoji}
              size={36}
              className="flex-shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-1">
                Google Search Console
              </div>
              {gscStatus === 'loading' && (
                <p className="text-sm text-[var(--text3)]">確認中...</p>
              )}
              {gscStatus === 'connected' && (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ok-l)] border border-[var(--ok)]/30 px-2.5 py-0.5 text-xs font-semibold text-[var(--ok)]">
                      連携済み
                    </span>
                    {gscSiteUrl && (
                      <span className="text-xs text-[var(--text3)] truncate max-w-[200px]" title={gscSiteUrl}>
                        {gscSiteUrl}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text2)]">
                    検索クエリ・流入ページのデータが調査分析に使われます。
                  </p>
                </div>
              )}
              {gscStatus === 'disconnected' && (
                <div className="space-y-1">
                  <p className="text-sm text-[var(--text2)]">
                    連携すると、検索データをもとにより詳しい調査ができます。
                  </p>
                  <p className="text-xs text-[var(--text3)]">
                    ホームページを登録している Google アカウントで連携してください。
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {gscStatus === 'loading' && (
              <button type="button" disabled className={getButtonClass('secondary', 'text-sm')}>
                読み込み中
              </button>
            )}
            {gscStatus === 'connected' && (
              <button
                type="button"
                onClick={handleGscDisconnectRequest}
                disabled={gscDeleting}
                className={getButtonClass('ghost', 'text-sm text-[var(--text3)] hover:text-[var(--err)]')}
              >
                {gscDeleting ? '解除中...' : '連携を解除'}
              </button>
            )}
            {gscStatus === 'disconnected' && (
              <Link
                href={`/api/auth/google?project_id=${projectId}`}
                className={getButtonClass('secondary', 'text-sm')}
              >
                Google Search Console を連携する
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
