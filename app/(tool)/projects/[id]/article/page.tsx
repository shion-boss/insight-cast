'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WritingLoadingScene } from '@/components/loading-scenes'
import {
  clearPendingArticleGeneration,
  findPendingArticleGeneration,
  trackPendingArticleGeneration,
} from '@/components/project-analysis-notifier'
import {
  Breadcrumb,
  CharacterAvatar,
  DevAiLabel,
  InterviewerSpeech,
  PageHeader,
  StateCard,
  getButtonClass,
} from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { showToast } from '@/lib/client/toast'

type ArticleType = 'client' | 'interviewer' | 'conversation'
type ArticleStyle = 'desu' | 'de-aru' | 'da-na'
type ArticleVolume = 'short' | 'medium' | 'long'
type ArticleGenerationStatus = 'idle' | 'generating' | 'ready' | 'failed'
type SavedArticle = {
  id: string
  title: string | null
}
type SavedArticleRow = SavedArticle & {
  article_type: string | null
  created_at: string
  source_theme: string | null
}

type ArticleFailureMap = Partial<Record<ArticleType, string>>

type ArticleGroupItem = { type: ArticleType; label: string; desc: string }
const ARTICLE_GROUPS: { label: string; items: ArticleGroupItem[] }[] = [
  {
    label: 'ユーザー視点',
    items: [
      { type: 'client', label: 'ブログ記事', desc: '事業者の言葉で語る読み物記事' },
    ],
  },
  {
    label: 'AIキャスト視点',
    items: [
      { type: 'conversation', label: '会話込み記事', desc: 'Q&A形式のインタビュー記事' },
      { type: 'interviewer', label: 'レポート記事', desc: 'AIキャストが伝える紹介記事' },
    ],
  },
]
const ARTICLE_ITEMS = ARTICLE_GROUPS.flatMap((g) => g.items)

const STYLE_OPTIONS: { value: ArticleStyle; label: string }[] = [
  { value: 'desu', label: 'ですます体' },
  { value: 'de-aru', label: 'である体' },
  { value: 'da-na', label: 'だ・な体' },
]

const VOLUME_OPTIONS: { value: ArticleVolume; label: string }[] = [
  { value: 'short', label: 'コンパクト' },
  { value: 'medium', label: '標準' },
  { value: 'long', label: '詳細' },
]

function isFreshEnough(createdAt: string, requestedAt: string) {
  return new Date(createdAt).getTime() >= new Date(requestedAt).getTime() - 60_000
}

export default function ArticlePage() {
  const { id: projectId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('interviewId') ?? ''
  const initialTheme = searchParams.get('theme') ?? ''
  const projectName = searchParams.get('projectName') ?? 'このプロジェクト'
  const from = searchParams.get('from') ?? ''
  const supabaseRef = useRef(createClient())

  const [tab, setTab] = useState<ArticleType>('client')
  const [error, setError] = useState<string | null>(null)
  const [availableThemes, setAvailableThemes] = useState<string[]>([])
  const [loadingThemes, setLoadingThemes] = useState(true)
  const [pendingArticleJobIdByType, setPendingArticleJobIdByType] = useState<Partial<Record<ArticleType, string>>>({})
  const [articleStatus, setArticleStatus] = useState<ArticleGenerationStatus>('idle')
  const [articleErrorMessage, setArticleErrorMessage] = useState<string | null>(null)
  const [failedArticleMessages, setFailedArticleMessages] = useState<ArticleFailureMap>({})

  const [style, setStyle] = useState<ArticleStyle>('desu')
  const [volume, setVolume] = useState<ArticleVolume>('medium')
  const [theme, setTheme] = useState(initialTheme)
  const [polishAnswers, setPolishAnswers] = useState(true)

  const [allArticles, setAllArticles] = useState<SavedArticleRow[]>([])
  const [startingArticleType, setStartingArticleType] = useState<ArticleType | null>(null)
  const currentPendingJobId = pendingArticleJobIdByType[tab] ?? null
  const pendingArticleTypes = Object.keys(pendingArticleJobIdByType) as ArticleType[]
  const activeGenerationType = startingArticleType ?? pendingArticleTypes[0] ?? null
  const activeGenerationLabel = activeGenerationType
    ? (ARTICLE_ITEMS.find((item) => item.type === activeGenerationType)?.label ?? '別の形式')
    : null
  const currentFailureMessage = failedArticleMessages[tab] ?? null

  // 選択中のテーマ全体の作成済み記事（種類問わず）
  const themeArticles = theme ? allArticles.filter((a) => a.source_theme === theme) : []
  // 記事の種類 × テーマの組み合わせで絞り込んだ記事
  const comboArticles = allArticles.filter((a) => {
    if (a.article_type !== tab) return false
    if (theme) return a.source_theme === theme
    return !a.source_theme
  })
  const latestComboArticle = comboArticles[0] ?? null

  const currentTabStatus: ArticleGenerationStatus = (() => {
    if (startingArticleType === tab || currentPendingJobId) return 'generating'
    if (currentFailureMessage) return 'failed'
    if (latestComboArticle) return 'ready'
    return 'idle'
  })()
  const isCurrentTabGenerating = currentTabStatus === 'generating'
  const isGenerating = articleStatus === 'generating' || pendingArticleTypes.length > 0 || startingArticleType !== null
  const isBusyWithAnotherTab = isGenerating && !isCurrentTabGenerating
  const mint = getCharacter('mint')

  const loadPageState = useCallback(async (showLoading = false, initTheme = false) => {
    if (!interviewId) {
      setAvailableThemes([])
      setLoadingThemes(false)
      setArticleStatus('idle')
      return
    }

    const supabase = supabaseRef.current
    if (showLoading) {
      setLoadingThemes(true)
    }

    const [{ data: interview }, { data: articleRows }] = await Promise.all([
      supabase
        .from('interviews')
        .select('themes, article_status, article_error')
        .eq('id', interviewId)
        .is('deleted_at', null)
        .single(),
      supabase
        .from('articles')
        .select('id, title, article_type, created_at, source_theme')
        .eq('interview_id', interviewId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
    ])

    const nextSavedArticles: Partial<Record<ArticleType, SavedArticle>> = {}
    const latestArticleByType = new Map<ArticleType, SavedArticleRow>()
    const failedMessages: ArticleFailureMap = {}

    for (const article of (articleRows ?? []) as SavedArticleRow[]) {
      if (!article.article_type) continue
      const typedArticle = article.article_type as ArticleType
      if (latestArticleByType.has(typedArticle)) continue

      latestArticleByType.set(typedArticle, article)
      nextSavedArticles[typedArticle] = {
        id: article.id,
        title: article.title,
      }
    }

    const nextPending: Partial<Record<ArticleType, string>> = {}
    for (const articleType of ['client', 'interviewer', 'conversation'] as ArticleType[]) {
      const pending = findPendingArticleGeneration(interviewId, articleType)
      if (!pending) continue

      const [jobId, job] = pending
      const matchedSavedArticle = latestArticleByType.get(articleType)
      const jobTheme = (job.theme ?? null) as string | null
      const isCompleted = matchedSavedArticle
        && isFreshEnough(matchedSavedArticle.created_at, job.requestedAt)
        && matchedSavedArticle.source_theme === jobTheme

      if (interview?.article_status === 'failed') {
        failedMessages[articleType] = typeof interview.article_error === 'string'
          ? interview.article_error
          : '記事を仕上げきれませんでした。少し待ってから、もう一度お試しください。'
        clearPendingArticleGeneration(jobId)
        continue
      }

      if (isCompleted) {
        clearPendingArticleGeneration(jobId)
        continue
      }

      nextPending[articleType] = jobId
    }

    const nextThemes = Array.isArray(interview?.themes)
      ? interview.themes.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []

    setAllArticles((articleRows ?? []) as SavedArticleRow[])
    setPendingArticleJobIdByType(nextPending)
    setFailedArticleMessages((prev) => {
      const next = { ...prev }

      for (const articleType of ['client', 'interviewer', 'conversation'] as ArticleType[]) {
        if (nextSavedArticles[articleType]) {
          delete next[articleType]
        }
      }

      for (const [articleType, message] of Object.entries(failedMessages) as [ArticleType, string][]) {
        next[articleType] = message
      }

      return next
    })
    setAvailableThemes(nextThemes)
    setArticleStatus((interview?.article_status as ArticleGenerationStatus | null) ?? (articleRows?.length ? 'ready' : 'idle'))
    setArticleErrorMessage(typeof interview?.article_error === 'string' ? interview.article_error : null)
    setError(null)
    if (initTheme) {
      setTheme((current) => {
        if (nextThemes.length === 0) return ''
        if (current && nextThemes.includes(current)) return current
        if (initialTheme && nextThemes.includes(initialTheme)) return initialTheme
        return nextThemes[0]
      })
    }

    if (showLoading) {
      setLoadingThemes(false)
    }
  }, [initialTheme, interviewId])

  useEffect(() => {
    void loadPageState(true, true).catch(() => {
      setError('記事の状態を確認できませんでした。少し待ってから、もう一度開いてください。')
      setLoadingThemes(false)
      setAvailableThemes([])
      setPendingArticleJobIdByType({})
    })
  }, [loadPageState])

  useEffect(() => {
    if (!interviewId) return
    if (articleStatus !== 'generating' && Object.keys(pendingArticleJobIdByType).length === 0 && !startingArticleType) return

    const intervalId = window.setInterval(() => {
      void loadPageState().catch(() => null)
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [articleStatus, interviewId, loadPageState, pendingArticleJobIdByType, startingArticleType])

  async function startBatchGeneration() {
    setStartingArticleType(tab)
    setError(null)
    setFailedArticleMessages((prev) => {
      const next = { ...prev }
      delete next[tab]
      return next
    })
    const jobId = `${interviewId}:${tab}:${Date.now()}`
    const articleLabel = ARTICLE_ITEMS.find((item) => item.type === tab)?.label ?? '記事'
    const requestedAt = new Date().toISOString()

    trackPendingArticleGeneration({
      jobId,
      projectId,
      projectName,
      interviewId,
      articleType: tab,
      articleLabel,
      style: tab === 'client' ? style : undefined,
      volume,
      theme: theme.trim() || undefined,
      polishAnswers,
      requestedAt,
    })
    setPendingArticleJobIdByType((prev) => ({ ...prev, [tab]: jobId }))

    try {
      const response = await fetch(`/api/projects/${projectId}/article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          articleType: tab,
          style: tab === 'client' ? style : undefined,
          volume,
          theme: theme.trim() || undefined,
          polishAnswers,
          background: true,
        }),
      })

      if (response.status === 403) {
        const body = await response.json().catch(() => ({}))
        if (body.error === 'lifetime_article_limit' || body.error === 'free_plan_locked') {
          clearPendingArticleGeneration(jobId)
          setPendingArticleJobIdByType((prev) => {
            const next = { ...prev }
            delete next[tab]
            return next
          })
          setStartingArticleType(null)
          window.location.href = '/pricing?reason=free_plan_locked'
          return
        }
        if (body.error === 'monthly_article_limit_reached') {
          clearPendingArticleGeneration(jobId)
          setPendingArticleJobIdByType((prev) => {
            const next = { ...prev }
            delete next[tab]
            return next
          })
          setStartingArticleType(null)
          window.location.href = '/pricing?reason=monthly_article_limit'
          return
        }
        throw new Error('failed to start article generation')
      }
      if (!response.ok) {
        throw new Error('failed to start article generation')
      }

      setStartingArticleType(null)
      setArticleStatus('generating')
      setArticleErrorMessage(null)
      showToast({
        id: `article-started-${jobId}`,
        title: `${articleLabel}の作成を開始しました`,
        description: '記事を作成中です。別の作業を進めながら待てます。',
        characterId: 'mint',
      })
      void loadPageState().catch(() => null)
    } catch {
      clearPendingArticleGeneration(jobId)
      setPendingArticleJobIdByType((prev) => {
        const next = { ...prev }
        delete next[tab]
        return next
      })
      setStartingArticleType(null)
      setArticleStatus('failed')
      const failureMessage = '記事の作成を開始できませんでした。少し待ってから、もう一度お試しください。'
      setArticleErrorMessage(failureMessage)
      setFailedArticleMessages((prev) => ({ ...prev, [tab]: failureMessage }))
      showToast({
        id: `article-error-${jobId}`,
        title: '記事の作成を開始できませんでした',
        description: '少し待ってから、もう一度お試しください。',
        tone: 'warning',
        characterId: 'mint',
      })
    }
  }

  const statusDescription = (() => {
    if (currentTabStatus === 'generating') {
      return 'この形式の記事を作成中です。しばらくお待ちください。'
    }
    if (currentTabStatus === 'ready') {
      return 'このテーマとこの形式の組み合わせで作成済みです。条件を変えて作り直すこともできます。'
    }
    if (currentTabStatus === 'failed') {
      return currentFailureMessage ?? articleErrorMessage ?? '記事を仕上げきれませんでした。条件を変えずにもう一度お試しください。'
    }
    if (isBusyWithAnotherTab && activeGenerationLabel) {
      return `いまは「${activeGenerationLabel}」を作成中です。完了したらこの形式も続けて作れます。`
    }
    return 'この形式はまだ作っていません。作成を始めるとバックグラウンドで進みます。このページを閉じても処理は続きます。'
  })()

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <PageHeader title="記事を作る" backHref={`/projects/${projectId}/summary?interviewId=${interviewId}${from ? `&from=${from}` : ''}`} backLabel="← 取材メモ" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <Breadcrumb items={[
          { label: 'プロジェクト一覧', href: '/projects' },
          { label: projectName, href: `/projects/${projectId}` },
          { label: '取材メモ', href: `/projects/${projectId}/summary?interviewId=${interviewId}${from ? `&from=${from}` : ''}` },
          { label: '記事を作成' },
        ]} />

        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 lg:sticky lg:top-20">
            <p className="mb-5 text-base font-bold text-[var(--text)]">記事の仕上げ方</p>

            <div className="mb-5">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text2)]">記事の種類</p>
              <div className="space-y-3">
                {ARTICLE_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1.5 text-[11px] text-[var(--text3)]">◇ {group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((t) => (
                        <button
                          key={t.type}
                          type="button"
                          onClick={() => setTab(t.type)}
                          aria-pressed={tab === t.type}
                          className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                            tab === t.type
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                              : 'border-[var(--border)] bg-transparent text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[12px] leading-[1.6] text-[var(--text3)]">
                {ARTICLE_ITEMS.find((item) => item.type === tab)?.desc}
              </p>
            </div>

            <div className="mb-5">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text2)]">テーマ</p>
              {loadingThemes ? (
                <p className="text-sm text-[var(--text3)]">テーマを確認しています...</p>
              ) : availableThemes.length > 0 ? (
                <div className="space-y-2">
                  {availableThemes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTheme(item)}
                      aria-pressed={theme === item}
                      className={`w-full cursor-pointer rounded-[var(--r-sm)] px-3.5 py-2.5 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                        theme === item
                          ? 'border border-[var(--accent)] bg-[var(--accent-l)] font-semibold text-[var(--accent)]'
                          : 'border border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="leading-[1.5]">{item}</span>
                        {theme === item && <span aria-hidden="true" className="ml-2 flex-shrink-0">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-4">
                  <p className="text-sm leading-[1.7] text-[var(--text3)]">
                    まだ選べるテーマがありません。先に取材メモを確認するか、取材に戻って話を足すと作りやすくなります。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${projectId}/summary?interviewId=${interviewId}`}
                      className={getButtonClass('secondary', 'px-3 py-2 text-xs')}
                    >
                      取材メモを開く
                    </Link>
                    <Link
                      href={`/projects/${projectId}/interview?interviewId=${interviewId}`}
                      className={getButtonClass('secondary', 'px-3 py-2 text-xs')}
                    >
                      取材に戻る
                    </Link>
                  </div>
                </div>
              )}
            </div>


            {tab === 'client' && (
              <div className="mb-5">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text2)]">語尾スタイル</p>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStyle(opt.value)}
                      aria-pressed={style === opt.value}
                      className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                        style === opt.value
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                          : 'border-[var(--border)] bg-transparent text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-5">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text2)]">文字量</p>
              <div className="flex flex-wrap gap-2">
                {VOLUME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVolume(opt.value)}
                    aria-pressed={volume === opt.value}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                      volume === opt.value
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                        : 'border-[var(--border)] bg-transparent text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <button
                type="button"
                onClick={() => setPolishAnswers((value) => !value)}
                aria-pressed={polishAnswers}
                className="flex w-full cursor-pointer items-center justify-between rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3.5 py-2.5 transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-[var(--text)]">回答を整える</p>
                  <p className="mt-0.5 text-[11px] text-[var(--text3)]">誤字や話し言葉を自然に整えます</p>
                </div>
                <div className={`relative h-6 w-10 flex-shrink-0 overflow-hidden rounded-full transition-colors ${polishAnswers ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                  <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${polishAnswers ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

            <div className="mb-5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-4">
              <p className="text-[11px] leading-[1.7] text-[var(--text3)]">
                作成を始めるとバックグラウンドで進みます。このページを閉じても作成は続きます。
              </p>
            </div>

            <div className="mb-5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text2)]">進行状況</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${currentTabStatus === 'generating' || currentTabStatus === 'ready' || currentTabStatus === 'failed' ? 'bg-[var(--accent-l)] text-[var(--accent)]' : 'bg-[var(--border)] text-[var(--text3)]'}`}>
                  受付済み
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${currentTabStatus === 'generating' ? 'bg-[var(--warn-l)] text-[var(--warn)]' : currentTabStatus === 'ready' ? 'bg-[var(--accent-l)] text-[var(--accent)]' : currentTabStatus === 'failed' ? 'bg-[var(--err-l)] text-[var(--err)]' : 'bg-[var(--border)] text-[var(--text3)]'}`}>
                  {currentTabStatus === 'failed' ? '要確認' : '作成中'}
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${currentTabStatus === 'ready' ? 'bg-[var(--ok-l)] text-[var(--ok)]' : 'bg-[var(--border)] text-[var(--text3)]'}`}>
                  作成済み
                </span>
              </div>
              <p className="mt-3 text-[12px] leading-[1.7] text-[var(--text3)]">{statusDescription}</p>
            </div>

            <DevAiLabel className="justify-center mb-1 text-xs opacity-60">記事生成</DevAiLabel>
            <button
              type="button"
              onClick={() => void startBatchGeneration()}
              disabled={isGenerating || availableThemes.length === 0}
              className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {isCurrentTabGenerating ? (
                <>この形式を作成中...</>
              ) : isBusyWithAnotherTab && activeGenerationLabel ? (
                <>{activeGenerationLabel}を作成中...</>
              ) : (
                <>記事を作成する <span aria-hidden="true">→</span></>
              )}
            </button>
            {availableThemes.length === 0 && !isGenerating && (
              <p className="mt-2 text-center text-[12px] leading-[1.6] text-[var(--text3)]">
                先に取材メモでテーマを確認してください
              </p>
            )}
            <p className="mt-2.5 text-center text-[12px] leading-[1.6] text-[var(--text3)]">
              完了すると通知が届きます。{currentPendingJobId ? 'このタブでも自動で状態を更新しています。' : isBusyWithAnotherTab ? 'いまは別の形式を作成中です。完了後にこの形式も始められます。' : '別の作業へ移って大丈夫です。'}
            </p>
          </aside>

          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg2)] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-[var(--accent-l)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
                  {ARTICLE_ITEMS.find((item) => item.type === tab)?.label ?? tab}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  currentTabStatus === 'generating'
                    ? 'bg-[var(--warn-l)] text-[var(--warn)]'
                    : currentTabStatus === 'ready'
                      ? 'bg-[var(--ok-l)] text-[var(--ok)]'
                      : currentTabStatus === 'failed'
                        ? 'bg-[var(--err-l)] text-[var(--err)]'
                        : 'bg-[var(--border)] text-[var(--text3)]'
                }`}>
                  {currentTabStatus === 'generating' ? '作成中' : currentTabStatus === 'ready' ? '作成済み' : currentTabStatus === 'failed' ? '要確認' : '未作成'}
                </span>
              </div>
              {latestComboArticle && !isCurrentTabGenerating && (
                <Link
                  href={`/projects/${projectId}/articles/${latestComboArticle.id}`}
                  className={getButtonClass('secondary', 'px-3 py-1.5 text-xs')}
                >
                  {tab === 'conversation' ? '記事を確認・書き出す' : '最新の記事を見る'}
                </Link>
              )}
            </div>

            {themeArticles.length > 0 && (
              <div className="border-b border-[var(--border)] bg-[var(--bg2)] px-6 py-4">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text2)]">
                  このテーマの作成済み記事（{themeArticles.length}件）
                </p>
                <div className="flex flex-wrap gap-2">
                  {themeArticles.map((a) => {
                    const typeLabel = a.article_type === 'interviewer' ? 'レポート記事' : a.article_type === 'conversation' ? '会話込み記事' : 'ブログ記事'
                    const dateLabel = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric' }).format(new Date(a.created_at))
                    return (
                      <Link
                        key={a.id}
                        href={`/projects/${projectId}/articles/${a.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                      >
                        <span>{typeLabel}</span>
                        <span aria-hidden="true" className="text-[var(--text3)]">·</span>
                        <span className="text-[var(--text3)]">{dateLabel}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {!isCurrentTabGenerating && comboArticles.length === 0 && currentTabStatus !== 'failed' && (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 p-8">
                {error ? (
                  <div role="alert">
                    <StateCard
                      icon={<CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={48} />}
                      title="いまは記事の状態を確認できません。"
                      description={error}
                      tone="warning"
                      align="left"
                    />
                  </div>
                ) : availableThemes.length === 0 ? (
                  <>
                    <InterviewerSpeech
                      icon={<CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={48} />}
                      name="ミント"
                      title="先にテーマを整えると記事を作りやすくなります"
                      description="取材メモのテーマ候補を確認するか、取材に戻って話を足すと、この形式の記事を始めやすくなります。"
                      tone="soft"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <Link
                        href={`/projects/${projectId}/summary?interviewId=${interviewId}`}
                        className={getButtonClass('primary')}
                      >
                        取材メモを開く
                      </Link>
                      <Link
                        href={`/projects/${projectId}/interview?interviewId=${interviewId}`}
                        className={getButtonClass('secondary')}
                      >
                        取材に戻る
                      </Link>
                    </div>
                  </>
                ) : isBusyWithAnotherTab && activeGenerationLabel ? (
                  <InterviewerSpeech
                    icon={<CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={48} />}
                    name="ミント"
                    title={`いまは「${activeGenerationLabel}」を作成しています`}
                    description="完了したら、この形式も続けて作れます。通知とこの画面の両方で状態を確認できます。"
                    tone="soft"
                  />
                ) : (
                  <InterviewerSpeech
                    icon={<CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={48} />}
                    name="ミント"
                    title="現在の設定を選んで記事を作成してください"
                    description="記事の種類とテーマの組み合わせで、まだこのパターンは作成されていません。左の設定を確認して作成を始めてください。"
                    tone="soft"
                  />
                )}
              </div>
            )}

            {isCurrentTabGenerating && (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 p-8">
                <WritingLoadingScene
                  title="記事を作成しています"
                  description="作成中です。そのまま待っても、別の画面に移っても大丈夫です。"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Link href={`/projects/${projectId}`} className={getButtonClass('secondary')}>
                    プロジェクトの管理に戻る
                  </Link>
                  <Link
                    href={`/projects/${projectId}/summary?interviewId=${interviewId}`}
                    className={getButtonClass('secondary')}
                  >
                    取材メモに戻る
                  </Link>
                </div>
              </div>
            )}

            {currentTabStatus === 'failed' && !isCurrentTabGenerating && (
              <div role="alert" className="flex min-h-[420px] flex-col items-center justify-center gap-5 p-8">
                <StateCard
                  icon={<CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={48} />}
                  title="記事を仕上げきれませんでした"
                  description={currentFailureMessage ?? articleErrorMessage ?? '少し時間をおいて、もう一度お試しください。'}
                  tone="warning"
                  align="left"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => void startBatchGeneration()}
                    className={getButtonClass('primary')}
                  >
                    もう一度作成する
                  </button>
                  <Link href={`/projects/${projectId}`} className={getButtonClass('secondary')}>
                    プロジェクトの管理に戻る
                  </Link>
                </div>
              </div>
            )}

            {comboArticles.length > 0 && !isCurrentTabGenerating && currentTabStatus !== 'failed' && (
              <div className="p-6 space-y-3">
                {comboArticles.map((a) => {
                  const dateLabel = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date(a.created_at))
                  return (
                    <Link
                      key={a.id}
                      href={`/projects/${projectId}/articles/${a.id}`}
                      className="flex items-center justify-between gap-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] px-5 py-4 transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      <p className="truncate text-sm font-medium text-[var(--text)]">{a.title ?? '記事'}</p>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <span className="text-xs text-[var(--text3)]">{dateLabel}</span>
                        <span className="text-xs font-medium text-[var(--accent)]">確認する <span aria-hidden="true">→</span></span>
                      </div>
                    </Link>
                  )
                })}
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <Link
                    href={`/projects/${projectId}#articles`}
                    className={getButtonClass('secondary', 'px-3 py-2 text-xs')}
                  >
                    プロジェクトの管理で確認する
                  </Link>
                  <button
                    type="button"
                    onClick={() => void startBatchGeneration()}
                    disabled={isGenerating}
                    className="cursor-pointer rounded-[var(--r-sm)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text3)] transition-colors hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    もう一度作成する
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href={`/projects/${projectId}/interview?interviewId=${interviewId}`}
            className="rounded text-sm text-[var(--text3)] transition-colors hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            取材に戻って話を足す
          </Link>
          <Link
            href={`/projects/${projectId}`}
            className="rounded text-sm text-[var(--text3)] transition-colors hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            プロジェクトの管理に戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
