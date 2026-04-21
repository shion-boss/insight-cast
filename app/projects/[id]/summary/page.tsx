'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import Link from 'next/link'
import { hasPendingInterviewSummary, trackPendingInterviewSummary } from '@/components/project-analysis-notifier'
import { CharacterAvatar, InterviewerSpeech, PageHeader, getButtonClass } from '@/components/ui'
import { showToast } from '@/lib/client/toast'

type SummaryData = {
  values: string[]
  themes: string[]
  messages: { role: string; content: string }[]
  interviewerType: string
}

type ArticleRow = {
  id: string
  title: string | null
  article_type: string | null
  created_at: string
}

function parseSummaryValues(summary: string | null) {
  if (!summary) return []

  return summary
    .split('\n')
    .map((line) => line.trim().replace(/^・/, '').trim())
    .filter(Boolean)
}

function formatCheckTime(date: Date) {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export default function SummaryPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('interviewId') ?? ''
  const from = searchParams.get('from')
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const backHref = from === 'dashboard' ? '/dashboard' : `/projects/${projectId}`
  const backLabel = from === 'dashboard' ? '← ダッシュボード' : '← 取材先の管理'

  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingSummary, setPendingSummary] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [isCheckingNow, setIsCheckingNow] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)

  const loadSummary = useCallback(async (options?: { manual?: boolean }) => {
    if (!interviewId) {
      router.push(`/projects/${projectId}/interviewer`)
      return
    }

    const supabase = supabaseRef.current
    if (options?.manual) {
      setIsCheckingNow(true)
    }

    try {
      setLoadError(null)
      const { data: interview } = await supabase
        .from('interviews')
        .select('interviewer_type, summary, themes')
        .eq('id', interviewId)
        .single()

      setLastCheckedAt(formatCheckTime(new Date()))

      if (!interview) {
        throw new Error('interview not found')
      }

      if (!interview.summary) {
        const { data: project } = await supabase
          .from('projects')
          .select('name, hp_url')
          .eq('id', projectId)
          .maybeSingle()

        const projectName = project?.name ?? project?.hp_url ?? 'この取材先'

        if (!hasPendingInterviewSummary(interviewId)) {
          trackPendingInterviewSummary({
            interviewId,
            projectId,
            projectName,
          })
          showToast({
            id: `summary-started-${interviewId}`,
            title: '取材メモの作成を開始しました',
            description: 'このまま別の作業を進めて大丈夫です。完了したらお知らせします。',
          })
        }

        setData({
          values: [],
          themes: Array.isArray(interview.themes) ? interview.themes : [],
          messages: [],
          interviewerType: interview.interviewer_type ?? 'mint',
        })
        setArticles([])
        setPendingSummary(true)
        return
      }

      const { data: messages } = await supabase
        .from('interview_messages')
        .select('role, content')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true })

      const { data: articleRows } = await supabase
        .from('articles')
        .select('id, title, article_type, created_at')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: false })

      setData({
        values: parseSummaryValues(interview.summary),
        themes: Array.isArray(interview.themes) ? interview.themes : [],
        messages: messages ?? [],
        interviewerType: interview.interviewer_type ?? 'mint',
      })
      setArticles((articleRows ?? []) as ArticleRow[])
      setPendingSummary(false)
    } catch {
      setLoadError('取材メモをまとめられませんでした。少し待ってから、もう一度開いてください。')
    } finally {
      setLoading(false)
      if (options?.manual) {
        setIsCheckingNow(false)
      }
    }
  }, [interviewId, projectId, router])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    if (!pendingSummary) return

    const intervalId = window.setInterval(() => {
      void loadSummary()
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [loadSummary, pendingSummary])

  const char = data ? getCharacter(data.interviewerType) : null

  if (loading) {
    const mintChar = getCharacter('mint')
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
        <div className="w-full max-w-md">
          <InterviewerSpeech
            icon={<CharacterAvatar src={mintChar?.icon48} alt="ミントのアイコン" emoji={mintChar?.emoji} size={48} />}
            name="ミント"
            title="取材メモの状態を確認しています"
            description="保存済みのメモがあればすぐ開きます。"
            tone="soft"
          />
        </div>
      </div>
    )
  }

  if (pendingSummary) {
    const mint = getCharacter(data?.interviewerType ?? 'mint')
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <PageHeader title="取材メモ" backHref={backHref} backLabel={backLabel} />

        <div className="max-w-2xl mx-auto px-6 py-12">
          <InterviewerSpeech
            icon={<CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={48} />}
            name={mint?.name ?? 'ミント'}
            title="取材メモを作成しています"
            description="AIで整理しているので、このページで待たなくて大丈夫です。完了したらお知らせします。"
            tone="soft"
          />
          <div className="mt-6 space-y-4">
            <InterviewerSpeech
              icon={<CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'ミント'}のアイコン`} emoji={mint?.emoji} size={48} />}
              name={mint?.name ?? 'ミント'}
              title="バックグラウンドで処理中です"
              description={`数分かかることがあります。約5秒ごとに自動で確認しています${lastCheckedAt ? `。最終確認 ${lastCheckedAt}` : '。'}`}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => void loadSummary({ manual: true })}
                className={getButtonClass('primary')}
              >
                {isCheckingNow ? '確認しています...' : '今すぐ確認する'}
              </button>
              <Link href={backHref} className={getButtonClass('secondary')}>
                {backLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader title="取材メモ" backHref={backHref} backLabel={backLabel} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text3)] mb-6">
          <Link href="/projects" className="hover:text-[var(--text2)] transition-colors">取材先一覧</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}`} className="hover:text-[var(--text2)] transition-colors">取材先の管理</Link>
          <span>/</span>
          <span className="text-[var(--text2)]">取材メモ</span>
        </nav>

        {loadError && (
          <div className="mb-6 space-y-4">
            <InterviewerSpeech
              icon={<CharacterAvatar src={char?.icon48} alt={`${char?.name ?? 'ミント'}のアイコン`} emoji={char?.emoji ?? '📝'} size={48} />}
              name={char?.name ?? 'ミント'}
              title="取材メモをまだ開けません。"
              description={loadError ?? ''}
            />
            <button
              type="button"
              onClick={() => void loadSummary({ manual: true })}
              className={getButtonClass('primary')}
            >
              {isCheckingNow ? '確認しています...' : 'もう一度確認する'}
            </button>
          </div>
        )}

        {/* キャスト紹介パネル */}
        <div className="flex items-center gap-4 bg-[var(--accent-l)] border border-[rgba(194,114,42,0.2)] rounded-[var(--r-lg)] px-6 py-5 mb-8">
          <CharacterAvatar
            src={char?.icon48}
            alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
            emoji={char?.emoji ?? '📝'}
            size={48}
            className="border-2 border-[var(--accent)]"
          />
          <div className="flex-1 min-w-0">
            <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-sm">
              {char?.name ? `${char.name}の取材メモ` : '取材メモが届きました'}
            </p>
            <p className="text-xs text-[var(--text2)] mt-0.5">
              インタビューで引き出せた内容を、このまま記事づくりに使えます。
            </p>
          </div>
          <span className="bg-[var(--ok-l)] text-[var(--ok)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">完了</span>
        </div>

        {/* 2カラムグリッド */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7 items-start">
          {/* メインカラム */}
          <div className="space-y-5">

            {/* 引き出せた価値 */}
            <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase mb-4">引き出せた価値</p>
              {data?.values && data.values.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.values.map((v, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--accent-l)] text-[var(--accent)] rounded-full text-[13px] font-semibold border border-[rgba(194,114,42,0.2)]"
                    >
                      ✦ {v}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text3)]">もう少し話を重ねると、ここに整理した内容が並びます。</p>
              )}
            </section>

            {/* 記事テーマ候補 */}
            {data?.themes && data.themes.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-base">記事テーマ候補</p>
                  {articles.length > 0 && (
                    <span className="text-[11px] font-semibold text-[var(--ok)] bg-[var(--ok-l)] px-2.5 py-0.5 rounded-full">
                      {articles.length}件作成済み
                    </span>
                  )}
                </div>
                <div className="space-y-2.5">
                  {data.themes.map((t, i) => (
                    <div
                      key={i}
                      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] px-5 py-4 flex items-center justify-between gap-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow cursor-default"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-sm leading-[1.5]">{t}</p>
                      </div>
                      <Link
                        href={`/projects/${projectId}/article?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}&theme=${encodeURIComponent(t)}`}
                        className="flex-shrink-0 bg-[var(--accent)] text-white text-xs font-semibold px-3 py-1.5 rounded-[var(--r-sm)] hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors whitespace-nowrap"
                      >
                        この記事を作る →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 取材ログ */}
            <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6">
              <div className="flex items-center justify-between mb-0">
                <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-sm">取材ログ</p>
                <button
                  onClick={() => setShowMessages(!showMessages)}
                  className="text-xs font-semibold text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded transition-colors cursor-pointer"
                >
                  {showMessages ? 'たたむ ↑' : 'ログを見る ↓'}
                </button>
              </div>
              {showMessages && (
                <div className="mt-4 space-y-0 max-h-80 overflow-y-auto">
                  {data?.messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 py-4 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
                    >
                      <span
                        className={`text-[11px] font-semibold w-12 flex-shrink-0 pt-0.5 ${
                          m.role !== 'user' ? 'text-[var(--accent)]' : 'text-[var(--teal)]'
                        }`}
                      >
                        {m.role !== 'user' ? (char?.name ?? 'キャスト') : 'あなた'}
                      </span>
                      <p className="text-sm text-[var(--text)] leading-[1.78] flex-1 whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* サイドバー */}
          <aside className="space-y-4">
            {/* 記事素材を生成する */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6">
              <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-sm mb-2">記事素材を生成する</p>
              <p className="text-[13px] text-[var(--text2)] leading-[1.75] mb-4">上のテーマから選んで記事を生成します。種類・文字量を設定できます。</p>
              <Link
                href={`/projects/${projectId}/article?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}`}
                className="flex w-full items-center justify-center bg-[var(--accent)] text-white text-sm font-semibold py-2.5 rounded-[var(--r-sm)] hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors"
              >
                記事素材を生成する →
              </Link>
            </div>

            {/* このインタビューから作った記事 */}
            <div id="related-articles" className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 scroll-mt-24">
              <div className="flex items-center justify-between gap-2 mb-4">
                <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-sm">関連する記事素材</p>
                <Link href="/articles" className="text-[11px] text-[var(--text3)] hover:text-[var(--text2)] transition-colors">一覧へ</Link>
              </div>
              {articles.length === 0 ? (
                <p className="text-[13px] text-[var(--text3)]">まだ記事はありません。</p>
              ) : (
                <div className="space-y-0">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/projects/${projectId}/articles/${article.id}`}
                      className="flex justify-between items-center py-2.5 border-b border-[var(--border)] last:border-0 text-[13px] text-[var(--accent)] hover:text-[var(--accent-h)] transition-colors"
                    >
                      <span className="truncate mr-2">{article.title || '記事'}</span>
                      <span className="text-[var(--text3)] flex-shrink-0 text-[11px]">
                        {new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(new Date(article.created_at))}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* もう少し話す */}
            <div className="space-y-2">
              <Link
                href={`/projects/${projectId}/interview?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}`}
                className="flex w-full items-center justify-center border border-[var(--border)] text-[var(--text2)] text-sm font-semibold py-2.5 rounded-[var(--r-sm)] hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors"
              >
                もう少し話す
              </Link>
              <Link
                href={backHref}
                className="flex w-full items-center justify-center text-sm text-[var(--text3)] hover:text-[var(--text2)] py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded transition-colors"
              >
                {backLabel}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
