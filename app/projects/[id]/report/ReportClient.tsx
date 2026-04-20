'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CharacterAvatar, InterviewerSpeech, StateCard, getButtonClass, getPanelClass } from '@/components/ui'
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

type Props = {
  projectId:          string
  initialStatus:      string
  audit:              Audit | null
  competitorAnalyses: CompetitorAnalysis[]
  interviewerPath:    string
  postFrequency:      PostFrequencyEntry[]
}

export default function ReportClient({
  projectId, initialStatus, audit, competitorAnalyses, interviewerPath, postFrequency,
}: Props) {
  const [analysisError, setAnalysisError] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    if (status !== 'analyzing') return

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}/analyze`)
      if (res.ok) {
        const json = await res.json()
        if (typeof json.status === 'string') {
          setStatus(json.status)
        }
        if (json.status === 'report_ready') {
          clearInterval(pollRef.current!)
          router.refresh()
        }
      } else {
        setAnalysisError(true)
      }
    }, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [projectId, router, status])

  if (status === 'analysis_pending') {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <StateCard
          icon={<span>📝</span>}
          title="まだ調査は始まっていません。"
          description="取材先の管理画面に戻って「調査を開始する」を押すと、バックグラウンドで進みます。"
          tone="soft"
          action={(
            <Link
              href={`/projects/${projectId}`}
              className={getButtonClass('primary')}
            >
              取材先の管理へ戻る
            </Link>
          )}
        />
      </div>
    )
  }

  if (status === 'analyzing') {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <StateCard
          icon={<span className={analysisError ? '' : 'animate-pulse'}>🦉</span>}
          title={analysisError ? 'いまは調査を続けられていません。' : 'クラウスが調査を進めています'}
          description={analysisError
            ? '少し待ってからページを開き直すと、続きから確認できることがあります。'
            : 'このページで待たなくて大丈夫です。完了したらトーストでお知らせします。'}
          tone={analysisError ? 'warning' : 'default'}
          action={analysisError ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={getButtonClass('primary')}
              >
                もう一度確認する
              </button>
              <Link
                href={`/projects/${projectId}`}
                className={getButtonClass('secondary')}
              >
                取材先の管理へ戻る
              </Link>
            </div>
          ) : (
            <div className={getPanelClass('space-y-3 rounded-xl p-4 text-left text-sm text-[var(--text3)]')}>
              <InterviewerSpeech
                icon={<span className="animate-pulse"><CharacterAvatar src={getCharacter('claus')?.icon48} alt="クラウスのアイコン" emoji={getCharacter('claus')?.emoji} size={48} /></span>}
                name="クラウス"
                title="ホームページと競合を調査しています"
                description="このページで待たなくて大丈夫です。完了したらお知らせします。"
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
          )}
        />
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <StateCard
          icon={<span>📄</span>}
          title="まだ表示できる調査結果がありません。"
          description="この取材先では、まだ確認できる調査データがありません。取材先の管理画面から必要に応じて調査を開始してください。"
          tone="soft"
          action={(
            <Link
              href={`/projects/${projectId}`}
              className={getButtonClass('primary')}
            >
              取材先の管理へ戻る
            </Link>
          )}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <InterviewerSpeech
        icon={<CharacterAvatar src={getCharacter('claus')?.icon48} alt="クラウスのアイコン" emoji={getCharacter('claus')?.emoji} size={48} />}
        name="クラウス"
        title="クラウスから調査結果が届きました"
        description="インタビュー前の準備として結果をご覧ください。"
      />

      {/* 投稿頻度グラフ */}
      {postFrequency.length >= 2 && (() => {
        const maxCount = Math.max(...postFrequency.map(e => e.count))
        const scrollable = postFrequency.length > 12
        return (
          <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-3">
            <div>
              <h2 className="text-sm font-medium text-[var(--text2)]">投稿の記録（日付が確認できた記事）</h2>
              <p className="text-xs text-[var(--text3)] mt-1">URLから確認できた投稿日を月別に集計しています。</p>
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
                        <span className="text-[10px] leading-none text-[var(--text3)]">{count}</span>
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
          {competitorAnalyses.map((ca, i) => (
            <div key={i} className="space-y-3">
              {ca.competitors?.url && (
                <p className="text-xs text-[var(--text3)] truncate">{ca.competitors.url}</p>
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
          ))}
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
