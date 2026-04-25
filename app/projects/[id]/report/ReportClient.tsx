'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnalysisLoadingScene } from '@/components/loading-scenes'
import { CharacterAvatar, InterviewerSpeech, getButtonClass, getPanelClass } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

type Audit = {
  current_content:  string[] | null
  strengths:        string[] | null
  gaps:             string[] | null
  suggested_themes: string[] | null
}

type CompetitorAnalysis = {
  gaps:          string[] | null
  advantages:    string[] | null
  influentialTopics: { theme: string; summary: string }[]
  competitor_id: string
  competitors:   { url: string } | null
}

type PostFrequencyEntry = { month: string; count: number }
type SiteEvaluationEntry = { key: string; label: string; score: number; summary: string }
type BlogMetrics = {
  trackedPostCount: number
  datedPostCount: number
  latestPublishedAt: string | null
  daysSinceLatestPost: number | null
  postsLast30Days: number
  postsLast90Days: number
  averagePostsPerMonth: number | null
  freshnessStatus: 'fresh' | 'watch' | 'stale' | 'unknown'
}
type ClassificationSummaryEntry = { label: string; count: number }

type Props = {
  projectId:          string
  initialStatus:      string
  audit:              Audit | null
  competitorAnalyses: CompetitorAnalysis[]
  interviewerPath:    string
  postFrequency:      PostFrequencyEntry[]
  blogMetrics:        BlogMetrics | null
  siteEvaluation:     SiteEvaluationEntry[]
  trustSignals:       string[]
  conversionObstacles:string[]
  priorityActions:    string[]
  classificationSummary: { byEffect?: Array<{ label: string; count: number }> } | null
}

function formatCheckTime(date: Date) {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export default function ReportClient({
  projectId,
  initialStatus,
  audit,
  competitorAnalyses,
  interviewerPath,
  postFrequency,
  blogMetrics,
  siteEvaluation,
  trustSignals,
  conversionObstacles,
  priorityActions,
  classificationSummary,
}: Props) {
  const [analysisError, setAnalysisError] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)
  const [isCheckingNow, setIsCheckingNow] = useState(false)
  const effectSummary: ClassificationSummaryEntry[] = classificationSummary?.byEffect ?? []

  function getFreshnessBadge() {
    if (!blogMetrics) return null
    switch (blogMetrics.freshnessStatus) {
      case 'fresh':
        return { label: '更新感あり', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
      case 'watch':
        return { label: '少し静か', className: 'border-amber-200 bg-amber-50 text-amber-700' }
      case 'stale':
        return { label: '更新停滞', className: 'border-rose-200 bg-rose-50 text-rose-700' }
      default:
        return { label: '日付推定中', className: 'border-slate-200 bg-slate-50 text-slate-700' }
    }
  }

  const checkStatus = useCallback(async (options?: { manual?: boolean }) => {
    if (options?.manual) {
      setIsCheckingNow(true)
    }

    const res = await fetch(`/api/projects/${projectId}/analyze`).catch(() => null)
    setLastCheckedAt(formatCheckTime(new Date()))

    if (res?.ok) {
      const json = await res.json()
      setAnalysisError(false)
      if (typeof json.status === 'string') {
        setStatus(json.status)
      }
      if (json.status === 'report_ready') {
        if (pollRef.current) clearInterval(pollRef.current)
        router.refresh()
      }
    } else {
      setAnalysisError(true)
    }

    if (options?.manual) {
      setIsCheckingNow(false)
    }
  }, [projectId, router])

  useEffect(() => {
    if (status !== 'analyzing') return

    void checkStatus()
    pollRef.current = setInterval(() => {
      void checkStatus()
    }, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [checkStatus, status])

  if (status === 'analysis_pending') {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 space-y-5">
        <InterviewerSpeech
          icon={<CharacterAvatar src={getCharacter('claus')?.icon48} alt="クラウスのアイコン" emoji={getCharacter('claus')?.emoji} size={48} />}
          name="クラウス"
          title="まだ調査は始まっていません。"
          description="取材先の管理画面に戻って「調査を開始する」を押すと、バックグラウンドで進みます。"
          tone="soft"
        />
        <div className="flex justify-center">
          <Link
            href={`/projects/${projectId}`}
            className={getButtonClass('primary')}
          >
            取材先の管理へ戻る
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'analyzing') {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-16">
        {analysisError ? (
          <div className="space-y-4">
            <InterviewerSpeech
              icon={<CharacterAvatar src={getCharacter('claus')?.icon48} alt="クラウスのアイコン" emoji={getCharacter('claus')?.emoji} size={48} />}
              name="クラウス"
              title="いまは調査を続けられていません。"
              description={`接続が少し不安定です。約5秒ごとに自動で再確認しています${lastCheckedAt ? `。最終確認 ${lastCheckedAt}` : '。'}`}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => void checkStatus({ manual: true })}
                className={getButtonClass('primary')}
              >
                {isCheckingNow ? '確認しています...' : '今すぐ再確認する'}
              </button>
              <Link
                href={`/projects/${projectId}`}
                className={getButtonClass('secondary')}
              >
                取材先の管理へ戻る
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnalysisLoadingScene projectName="ホームページと競合を調査中" />
            <div className={getPanelClass('space-y-3 rounded-xl p-4 text-left text-sm text-[var(--text3)]')}>
              <InterviewerSpeech
                icon={<CharacterAvatar src={getCharacter('claus')?.icon48} alt="クラウスのアイコン" emoji={getCharacter('claus')?.emoji} size={48} />}
                name="クラウス"
                title="このページで待たなくて大丈夫です"
                description={`完了したらトーストでお知らせします。約5秒ごとに状態を確認しています${lastCheckedAt ? `。最終確認 ${lastCheckedAt}` : '。'}`}
              />
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Link
                  href={`/projects/${projectId}`}
                  className={getButtonClass('secondary')}
                >
                  取材先の管理へ戻る
                </Link>
                <Link
                  href="/dashboard"
                  className={getButtonClass('secondary')}
                >
                  ダッシュボードへ戻る
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 space-y-5">
        <InterviewerSpeech
          icon={<CharacterAvatar src={getCharacter('claus')?.icon48} alt="クラウスのアイコン" emoji={getCharacter('claus')?.emoji} size={48} />}
          name="クラウス"
          title="まだ表示できる調査結果がありません。"
          description="この取材先では、まだ確認できる調査データがありません。取材先の管理画面から必要に応じて調査を開始してください。"
          tone="soft"
        />
        <div className="flex justify-center">
          <Link
            href={`/projects/${projectId}`}
            className={getButtonClass('primary')}
          >
            取材先の管理へ戻る
          </Link>
        </div>
      </div>
    )
  }

  const freshnessBadge = getFreshnessBadge()

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <InterviewerSpeech
        icon={<CharacterAvatar src={getCharacter('claus')?.icon48} alt="クラウスのアイコン" emoji={getCharacter('claus')?.emoji} size={48} />}
        name="クラウス"
        title="クラウスから調査結果が届きました"
        description="インタビュー前の準備として結果をご覧ください。"
      />

      {(siteEvaluation.length > 0 || blogMetrics) && (
        <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-[var(--text2)]">HPの評価サマリー</h2>
              <p className="mt-1 text-xs text-[var(--text3)]">深掘り分析と、ホームページ上の更新傾向をまとめて確認できます。</p>
            </div>
            {freshnessBadge && (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${freshnessBadge.className}`}>
                {freshnessBadge.label}
              </span>
            )}
          </div>

          {siteEvaluation.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {siteEvaluation.map((entry) => (
                <div key={entry.key} className="rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--text2)]">{entry.label}</p>
                    <p className="text-lg font-semibold text-[var(--accent)]">{entry.score}<span className="text-xs text-[var(--text3)]">/10</span></p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text3)]">{entry.summary}</p>
                </div>
              ))}
            </div>
          )}

          {blogMetrics && (
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: '直近30日', value: `${blogMetrics.postsLast30Days}件` },
                { label: '直近90日', value: `${blogMetrics.postsLast90Days}件` },
                { label: '平均更新', value: blogMetrics.averagePostsPerMonth !== null ? `${blogMetrics.averagePostsPerMonth}/月` : '不明' },
                { label: '最終更新', value: blogMetrics.daysSinceLatestPost !== null ? `${blogMetrics.daysSinceLatestPost}日前` : '不明' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-4 py-3">
                  <p className="text-xs text-[var(--text3)]">{item.label}</p>
                  <p className="mt-1 text-base font-semibold text-[var(--text)]">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 投稿頻度グラフ */}
      {postFrequency.length >= 2 && (() => {
        const maxCount = Math.max(...postFrequency.map(e => e.count))
        const scrollable = postFrequency.length > 12
        return (
          <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-3">
            <div>
              <h2 className="text-sm font-medium text-[var(--text2)]">投稿の記録（日付が確認できた記事）</h2>
              <p className="text-xs text-[var(--text3)] mt-1">URLやタイトルから推定できた投稿日を月別に集計しています。</p>
            </div>
            <div className={scrollable ? 'overflow-x-auto' : ''}>
              <div
                className="flex items-end gap-1"
                style={{
                  height: '160px',
                  minWidth: scrollable ? `${postFrequency.length * 36}px` : undefined,
                }}
              >
                {postFrequency.map(({ month, count }) => {
                  const heightPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
                  const label = month.slice(2).replace('-', '/')
                  return (
                    <div
                      key={month}
                      className="flex flex-col items-center justify-end flex-1 min-w-0 h-full gap-1"
                    >
                      {count > 0 && (
                        <span className="text-xs leading-none text-[var(--text3)]">{count}</span>
                      )}
                      <div
                        className="w-full rounded-t-sm bg-[var(--accent)]"
                        style={{ height: `${heightPct}%` }}
                        aria-label={`${month}: ${count}件`}
                      />
                      <span
                        className="text-[9px] leading-none text-[var(--text3)] truncate w-full text-center"
                        title={month}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })()}

      {(effectSummary.length > 0 || trustSignals.length > 0 || conversionObstacles.length > 0 || priorityActions.length > 0) && (
        <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4">
          <h2 className="text-sm font-medium text-[var(--text2)]">改善とコンテンツの観点</h2>

          {effectSummary.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-[var(--text3)]">既存ブログが担っている効果</p>
              <div className="flex flex-wrap gap-2">
                {effectSummary.map((entry) => (
                  <span
                    key={entry.label}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-3 py-1 text-xs font-medium text-[var(--text2)]"
                  >
                    {entry.label} {entry.count}件
                  </span>
                ))}
              </div>
            </div>
          )}

          {trustSignals.length > 0 && (
            <div>
              <p className="text-xs text-[var(--text3)] mb-2">信頼材料として使えている要素</p>
              <ul className="space-y-1">
                {trustSignals.map((item, i) => (
                  <li key={i} className="text-sm text-[var(--text2)] flex gap-2">
                    <span className="text-emerald-500 flex-shrink-0">●</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {conversionObstacles.length > 0 && (
            <div>
              <p className="text-xs text-[var(--text3)] mb-2">問い合わせを止めていそうな要因</p>
              <ul className="space-y-1">
                {conversionObstacles.map((item, i) => (
                  <li key={i} className="text-sm text-[var(--text2)] flex gap-2">
                    <span className="text-amber-500 flex-shrink-0">▲</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {priorityActions.length > 0 && (
            <div>
              <p className="text-xs text-[var(--text3)] mb-2">次回改善で優先したいこと</p>
              <ul className="space-y-1">
                {priorityActions.map((item, i) => (
                  <li key={i} className="text-sm text-[var(--text2)] flex gap-2">
                    <span className="text-[var(--accent)] flex-shrink-0">{i + 1}.</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 自社HP現状 */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4">
        <h2 className="text-sm font-medium text-[var(--text2)]">あなたのHPの現状</h2>

        {audit.current_content && audit.current_content.length > 0 && (
          <div>
            <p className="text-xs text-[var(--text3)] mb-2">現在伝えていること</p>
            <ul className="space-y-1">
              {audit.current_content.map((item, i) => (
                <li key={i} className="text-sm text-[var(--text2)] flex gap-2">
                  <span className="text-[rgba(255,255,255,0.56)] flex-shrink-0">・</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {audit.strengths && audit.strengths.length > 0 && (
          <div>
            <p className="text-xs text-[var(--text3)] mb-2">強みとして見えるもの</p>
            <ul className="space-y-1">
              {audit.strengths.map((item, i) => (
                <li key={i} className="text-sm text-[var(--text2)] flex gap-2">
                  <span className="text-green-400 flex-shrink-0">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {audit.gaps && audit.gaps.length > 0 && (
          <div>
            <p className="text-xs text-[var(--text3)] mb-2">伝えきれていないこと</p>
            <ul className="space-y-1">
              {audit.gaps.map((item, i) => (
                <li key={i} className="text-sm text-[var(--text2)] flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">△</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 競合比較 */}
      {competitorAnalyses.length > 0 && (
        <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4">
          <h2 className="text-sm font-medium text-[var(--text2)]">競合との比較</h2>
          {competitorAnalyses.map((ca, i) => {
            const hasData = (ca.gaps?.length ?? 0) > 0 || (ca.advantages?.length ?? 0) > 0 || ca.influentialTopics.length > 0
            return (
            <div key={i} className="space-y-3">
              {ca.competitors?.url && (
                <p className="text-xs text-[var(--text3)] truncate">{ca.competitors.url}</p>
              )}
              {!hasData && (
                <p className="text-sm text-[var(--text3)]">このサイトのコンテンツを取得できませんでした。</p>
              )}
              {ca.gaps && ca.gaps.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text3)] mb-1">競合が伝えていてあなたのHPにないこと</p>
                  <ul className="space-y-1">
                    {ca.gaps.map((item, j) => (
                      <li key={j} className="text-sm text-[var(--text2)] flex gap-2">
                        <span className="text-red-300 flex-shrink-0">▲</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ca.advantages && ca.advantages.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text3)] mb-1">あなたのHPが競合より詳しいこと</p>
                  <ul className="space-y-1">
                    {ca.advantages.map((item, j) => (
                      <li key={j} className="text-sm text-[var(--text2)] flex gap-2">
                        <span className="text-green-400 flex-shrink-0">◎</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ca.influentialTopics.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text3)] mb-1">競合が前面に出しているテーマ</p>
                  <ul className="space-y-2">
                    {ca.influentialTopics.map((topic, j) => (
                      <li key={`${topic.theme}-${j}`} className="rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2">
                        <p className="text-sm text-[var(--text2)]">{topic.theme}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--text3)]">{topic.summary}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )})}
        </section>
      )}

      {/* インタビューテーマ */}
      {audit.suggested_themes && audit.suggested_themes.length > 0 && (
        <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-3">
          <h2 className="text-sm font-medium text-[var(--text2)]">インタビューで深めたいテーマ</h2>
          <ul className="space-y-2">
            {audit.suggested_themes.map((theme, i) => (
              <li key={i} className="text-sm text-[var(--text2)] flex gap-2">
                <span className="text-[rgba(255,255,255,0.56)] flex-shrink-0">💬</span>{theme}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href={interviewerPath}
        className="block w-full py-4 bg-[var(--text)] text-white rounded-xl hover:bg-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors text-sm text-center"
      >
        この内容をもとにインタビューを始める →
      </Link>
    </div>
  )
}
