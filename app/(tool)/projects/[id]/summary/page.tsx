'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import Link from 'next/link'
import { hasPendingInterviewSummary, trackPendingInterviewSummary } from '@/components/project-analysis-notifier'
import { Breadcrumb, CharacterAvatar, InterviewerSpeech, getButtonClass } from '@/components/ui'
import { showToast } from '@/lib/client/toast'
import { ConfirmDialog } from '@/components/confirm-dialog'

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
  source_theme: string | null
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
    timeZone: 'Asia/Tokyo',
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
  const backLabel = from === 'dashboard' ? '← ダッシュボード' : '← プロジェクトの管理'

  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingSummary, setPendingSummary] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [isCheckingNow, setIsCheckingNow] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)
  const pollCountRef = useRef(0)

  // 削除ダイアログ
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteInterview() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast({
          title: 'うまく削除できませんでした。もう一度お試しください。',
          tone: 'warning',
          characterId: 'mint',
        })
        setDeleting(false)
        setShowDeleteDialog(false)
        return
      }

      setShowDeleteDialog(false)
      router.push(backHref)
      router.refresh()

      showToast({
        title: '取材メモを削除しました。30日以内に復元できます。',
        tone: 'default',
        characterId: data?.interviewerType ?? 'mint',
        undoLabel: '元に戻す',
        onUndo: async () => {
          const restoreRes = await fetch(`/api/interviews/${interviewId}/restore`, { method: 'POST' })
          if (restoreRes.ok) {
            router.push(`/projects/${projectId}/summary?interviewId=${interviewId}`)
            router.refresh()
          } else {
            showToast({
              title: '復元できませんでした。時間をおいてお試しください。',
              tone: 'warning',
              characterId: 'mint',
            })
          }
        },
      })
    } catch {
      showToast({
        title: 'うまく削除できませんでした。もう一度お試しください。',
        tone: 'warning',
        characterId: 'mint',
      })
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  useEffect(() => {
    void (async () => {
      const supabase = supabaseRef.current
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }
    })()
  }, [router])

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
        .is('deleted_at', null)
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

        const projectName = project?.name ?? project?.hp_url ?? 'このプロジェクト'

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
            characterId: 'mint',
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
        .select('id, title, article_type, created_at, source_theme')
        .eq('interview_id', interviewId)
        .is('deleted_at', null)
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
    pollCountRef.current = 0

    const handle = { id: 0 }
    handle.id = window.setInterval(() => {
      pollCountRef.current += 1
      if (pollCountRef.current >= 60) {
        window.clearInterval(handle.id)
        setPendingSummary(false)
        setLoadError('取材メモの作成に時間がかかっています。ページを開き直すか、しばらく後にもう一度お試しください。')
        return
      }
      void loadSummary()
    }, 5000)

    return () => window.clearInterval(handle.id)
  }, [loadSummary, pendingSummary])

  const char = data ? getCharacter(data.interviewerType) : null
  if (loading) return null

  if (pendingSummary) {
    const mint = getCharacter(data?.interviewerType ?? 'mint')
    return (
      <>
        <div className="mx-auto max-w-2xl py-4">
          <InterviewerSpeech
            icon={<CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'インタビュアー'}のアイコン`} emoji={mint?.emoji} size={48} />}
            name={mint?.name ?? 'ミント'}
            title="取材メモを作っています"
            description="会話の内容をまとめています。このページから離れて大丈夫です。完了したらお知らせします。"
            tone="soft"
          />
          {lastCheckedAt && (
            <p className="mt-2 text-xs text-[var(--text3)]">最終確認: {lastCheckedAt}</p>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadSummary({ manual: true })}
              className={getButtonClass('secondary')}
            >
              {isCheckingNow ? '確認しています...' : '今すぐ確認する'}
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div>
        <Breadcrumb items={[
          { label: 'プロジェクト一覧', href: '/projects' },
          { label: 'プロジェクトの管理', href: `/projects/${projectId}` },
          { label: '取材メモ' },
        ]} />
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          {interviewId && (
            <Link
              href={`/articles?interviewId=${interviewId}&projectId=${projectId}`}
              className={getButtonClass('secondary', 'px-4 py-2 text-sm')}
            >
              この取材の記事一覧
            </Link>
          )}
          <Link href={backHref} className={getButtonClass('secondary', 'px-4 py-2 text-sm')}>
            {backLabel}
          </Link>
        </div>

        {loadError && (
          <div role="alert" className="mb-6 space-y-4">
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
            <p className="font-bold text-[var(--text)] text-sm">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--accent-l)] text-[var(--accent)] rounded-[var(--r-sm)] text-sm font-semibold border border-[rgba(194,114,42,0.2)]"
                    >
                      <span aria-hidden="true">✦</span> {v}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text3)]">この取材では価値の要点を引き出せませんでした。もう一度取材するか、取材ログを確認してみてください。</p>
              )}
            </section>

            {/* 記事テーマ候補 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <p className="font-bold text-[var(--text)] text-base">記事テーマ候補</p>
                {articles.length > 0 && (
                  <span className="text-[11px] font-semibold text-[var(--ok)] bg-[var(--ok-l)] px-2.5 py-0.5 rounded-full">
                    {articles.length}件作成済み
                  </span>
                )}
              </div>
              {data?.themes && data.themes.length > 0 ? (
                <div className="space-y-2.5">
                  {data.themes.map((t, i) => {
                    const articlesByTheme = articles.filter((a) => a.source_theme === t)
                    return (
                      <div
                        key={i}
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] px-5 py-4 flex items-start justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--text)] text-sm leading-[1.5]">{t}</p>
                          {articlesByTheme.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {articlesByTheme.map((a) => (
                                <Link
                                  key={a.id}
                                  href={`/projects/${projectId}/articles/${a.id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ok)] bg-[var(--ok-l)] px-2 py-0.5 rounded-full hover:opacity-75 transition-opacity"
                                >
                                  <span aria-hidden="true">✓</span> {a.article_type === 'interviewer' ? 'インタビュー形式' : a.article_type === 'conversation' ? '会話込み' : 'ブログ記事'} {new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric' }).format(new Date(a.created_at))}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/projects/${projectId}/article?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}&theme=${encodeURIComponent(t)}`}
                          className="flex-shrink-0 inline-flex items-center justify-center bg-[var(--accent)] text-white text-xs font-semibold px-3 min-h-[44px] rounded-[var(--r-sm)] hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors whitespace-nowrap"
                        >
                          この記事を作る <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] px-5 py-4">
                  <p className="text-sm text-[var(--text3)]">取材メモの作成が完了すると、ここにテーマが並びます。</p>
                </div>
              )}
            </div>

            {/* 取材ログ */}
            <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6">
              <div className="flex items-center justify-between mb-0">
                <p className="font-bold text-[var(--text)] text-sm">取材ログ</p>
                <button
                  type="button"
                  onClick={() => setShowMessages(!showMessages)}
                  aria-expanded={showMessages}
                  aria-controls="summary-interview-log"
                  className="text-xs font-semibold text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded transition-colors cursor-pointer"
                >
                  {showMessages ? '閉じる' : '会話を見る'}
                </button>
              </div>
              {/* tabIndex={0}: キーボードユーザーがスクロールコンテナにフォーカスしてキーで読み進められるよう WCAG 2.1 AA 準拠 */}
              <div id="summary-interview-log" hidden={!showMessages} tabIndex={showMessages ? 0 : -1} className="mt-4 space-y-0 max-h-80 overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-[var(--r-sm)]">
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
            </section>
          </div>

          {/* サイドバー */}
          <aside className="space-y-4">
            {/* 記事を受け取る */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6">
              <p className="font-bold text-[var(--text)] text-sm mb-2">記事を受け取る</p>
              <p className="text-sm text-[var(--text2)] leading-[1.75] mb-4">上のテーマから選んで記事を作ります。種類・文字量を設定できます。</p>
              <Link
                href={`/projects/${projectId}/article?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}`}
                className="flex w-full items-center justify-center bg-[var(--accent)] text-white text-sm font-semibold py-2.5 rounded-[var(--r-sm)] hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors"
              >
                記事を受け取る <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* このインタビューから作った記事 */}
            <div id="related-articles" className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 scroll-mt-24">
              <div className="flex items-center justify-between gap-2 mb-4">
                <p className="font-bold text-[var(--text)] text-sm">この取材の記事</p>
                <Link
                  href={`/articles?interviewId=${interviewId}&projectId=${projectId}`}
                  className="text-[11px] text-[var(--text3)] hover:text-[var(--text2)] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  この取材の一覧へ
                </Link>
              </div>
              {articles.length === 0 ? (
                <p className="text-sm text-[var(--text3)]">この取材から作成した記事はまだありません。</p>
              ) : (
                <div className="space-y-0">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/projects/${projectId}/articles/${article.id}`}
                      className="flex justify-between items-center py-2.5 border-b border-[var(--border)] last:border-0 text-sm text-[var(--accent)] hover:text-[var(--accent-h)] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      <span className="truncate mr-2">{article.title || '記事'}</span>
                      <span className="text-[var(--text3)] flex-shrink-0 text-[11px]">
                        {new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric' }).format(new Date(article.created_at))}
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
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-16 flex justify-end border-t border-[var(--border)] pt-6">
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          aria-label="取材メモを削除"
          className="flex min-h-[2rem] min-w-[2rem] shrink-0 items-center justify-center rounded-lg border border-[var(--err)]/20 bg-[var(--surface)] text-[var(--err)] opacity-30 transition-all hover:opacity-80 hover:bg-[var(--err-l)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

    {showDeleteDialog && (
      <ConfirmDialog
        dialogId="delete-interview"
        title="取材メモを削除しますか？"
        description="取材メモと、ひもづく記事がすべて削除されます。30日以内であれば復元できます。"
        confirmLabel="削除する"
        confirmingLabel="削除中..."
        confirming={deleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => void handleDeleteInterview()}
      />
    )}
    </>
  )
}
