'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WritingLoadingScene } from '@/components/loading-scenes'
import {
  clearPendingArticleGeneration,
  findPendingArticleGeneration,
  getPendingArticleGeneration,
  trackPendingArticleGeneration,
} from '@/components/project-analysis-notifier'
import { CharacterAvatar, DevAiLabel, InterviewerSpeech, PageHeader, StateCard, getButtonClass } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { showToast } from '@/lib/client/toast'

type ArticleType = 'client' | 'interviewer' | 'conversation'
type ArticleStyle = 'desu' | 'de-aru' | 'da-na'
type ArticleVolume = 'short' | 'medium' | 'long'
type GenerationMode = 'batch' | 'instant'
type SavedArticle = {
  id: string
  title: string | null
}
type CompletionModalState = 'idle' | 'checking' | 'ready' | 'error'

const TABS: { type: ArticleType; label: string; desc: string }[] = [
  { type: 'client',       label: 'ブログ記事',       desc: '事業者の言葉で語る読み物記事' },
  { type: 'interviewer',  label: 'インタビュー形式',  desc: 'インタビュアーが伝える紹介記事' },
  { type: 'conversation', label: '会話込み',          desc: 'Q&A形式のインタビュー記事' },
]

const STYLE_OPTIONS: { value: ArticleStyle; label: string }[] = [
  { value: 'desu',   label: 'ですます体' },
  { value: 'de-aru', label: 'である体' },
  { value: 'da-na',  label: 'だ・な体' },
]

const VOLUME_OPTIONS: { value: ArticleVolume; label: string }[] = [
  { value: 'short',  label: 'コンパクト' },
  { value: 'medium', label: '標準' },
  { value: 'long',   label: '詳細' },
]

const GENERATION_MODE_OPTIONS: Array<{
  value: GenerationMode
  label: string
  description: string
}> = [
  {
    value: 'batch',
    label: 'あとで受け取る',
    description: 'バックグラウンドで作成します。完了したらお知らせします。',
  },
  {
    value: 'instant',
    label: 'いま生成して待つ',
    description: 'この場で素材をまとめます。長めの待ち時間が出ることがあります。',
  },
]

export default function ArticlePage() {
  const { id: projectId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('interviewId') ?? ''
  const initialTheme = searchParams.get('theme') ?? ''
  const projectName = searchParams.get('projectName') ?? 'この取材先'
  const supabaseRef = useRef(createClient())

  const [tab, setTab] = useState<ArticleType>('client')
  const [error, setError] = useState<string | null>(null)
  const [availableThemes, setAvailableThemes] = useState<string[]>([])
  const [loadingThemes, setLoadingThemes] = useState(true)
  const [savedArticles, setSavedArticles] = useState<Partial<Record<ArticleType, SavedArticle>>>({})
  const [instantContentByType, setInstantContentByType] = useState<Partial<Record<ArticleType, string>>>({})
  const [pendingArticleJobIdByType, setPendingArticleJobIdByType] = useState<Partial<Record<ArticleType, string>>>({})
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionModalState, setCompletionModalState] = useState<CompletionModalState>('idle')
  const [completionModalArticle, setCompletionModalArticle] = useState<SavedArticle | null>(null)
  const [generationMode, setGenerationMode] = useState<GenerationMode>('batch')
  const [instantGeneratingType, setInstantGeneratingType] = useState<ArticleType | null>(null)

  const [style, setStyle] = useState<ArticleStyle>('desu')
  const [volume, setVolume] = useState<ArticleVolume>('medium')
  const [theme, setTheme] = useState(initialTheme)
  const [polishAnswers, setPolishAnswers] = useState(true)

  const currentSavedArticle = savedArticles[tab] ?? null
  const currentInstantContent = instantContentByType[tab] ?? ''
  const pendingArticleJobId = pendingArticleJobIdByType[tab] ?? null
  const isBatchGenerating = Boolean(pendingArticleJobId)
  const isInstantGenerating = instantGeneratingType === tab
  const isGenerating = isBatchGenerating || isInstantGenerating
  const completionPollTimerRef = useRef<number | null>(null)
  const completionModalOpenRef = useRef(false)

  useEffect(() => {
    if (!interviewId) {
      setAvailableThemes([])
      setLoadingThemes(false)
      return
    }

    async function loadThemes() {
      const supabase = supabaseRef.current
      setLoadingThemes(true)
      const [{ data: interview }, { data: articleRows }] = await Promise.all([
        supabase
          .from('interviews')
          .select('themes')
          .eq('id', interviewId)
          .single(),
        supabase
          .from('articles')
          .select('id, title, article_type, created_at')
          .eq('interview_id', interviewId)
          .order('created_at', { ascending: false }),
      ])

      const nextSavedArticles: Partial<Record<ArticleType, SavedArticle>> = {}
      for (const article of (articleRows ?? []) as Array<SavedArticle & { article_type: string | null }>) {
        if (!article.article_type) continue
        if (nextSavedArticles[article.article_type as ArticleType]) continue
        nextSavedArticles[article.article_type as ArticleType] = {
          id: article.id,
          title: article.title,
        }
      }
      setSavedArticles(nextSavedArticles)

      const nextPending: Partial<Record<ArticleType, string>> = {}
      for (const articleType of ['client', 'interviewer', 'conversation'] as ArticleType[]) {
        const pending = findPendingArticleGeneration(interviewId, articleType)
        if (pending) {
          nextPending[articleType] = pending[0]
        }
      }
      setPendingArticleJobIdByType(nextPending)

      const nextThemes = Array.isArray(interview?.themes)
        ? interview.themes.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : []
      setAvailableThemes(nextThemes)

      if (nextThemes.length > 0) {
        if (initialTheme && nextThemes.includes(initialTheme)) {
          setTheme(initialTheme)
        } else if (!initialTheme) {
          setTheme(nextThemes[0])
        }
      } else {
        setTheme('')
      }

      setLoadingThemes(false)
    }

    loadThemes()
  }, [initialTheme, interviewId])

  useEffect(() => {
    return () => {
      if (completionPollTimerRef.current) {
        window.clearTimeout(completionPollTimerRef.current)
      }
    }
  }, [])

  async function startBatchGeneration() {
    setError(null)
    setInstantContentByType((prev) => ({ ...prev, [tab]: '' }))
    const jobId = `${interviewId}:${tab}:${Date.now()}`
    const articleLabel = TABS.find((item) => item.type === tab)?.label ?? '記事素材'
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
    showToast({
      id: `article-started-${jobId}`,
      title: `${articleLabel}の作成を開始しました`,
      description: 'このまま別の作業を進めて大丈夫です。完了したらお知らせします。',
    })
  }

  async function startInstantGeneration() {
    setError(null)
    setInstantGeneratingType(tab)
    setInstantContentByType((prev) => ({ ...prev, [tab]: '' }))

    try {
      const res = await fetch(`/api/projects/${projectId}/article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          articleType: tab,
          style: tab === 'client' ? style : undefined,
          volume,
          theme: theme.trim() || undefined,
          polishAnswers,
          background: false,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error('failed to generate')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value)
        setInstantContentByType((prev) => ({ ...prev, [tab]: text }))
      }

      const supabase = supabaseRef.current
      const { data: article } = await supabase
        .from('articles')
        .select('id, title')
        .eq('interview_id', interviewId)
        .eq('article_type', tab)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (article) {
        setSavedArticles((prev) => ({
          ...prev,
          [tab]: {
            id: article.id,
            title: article.title,
          },
        }))
      }
    } catch {
      setError('記事をまだ用意できませんでした。少し待ってから、もう一度お試しください。')
      setInstantContentByType((prev) => ({ ...prev, [tab]: '' }))
    } finally {
      setInstantGeneratingType(null)
    }
  }

  async function generate() {
    if (generationMode === 'instant') {
      await startInstantGeneration()
      return
    }

    await startBatchGeneration()
  }

  function closeCompletionModal() {
    if (completionPollTimerRef.current) {
      window.clearTimeout(completionPollTimerRef.current)
      completionPollTimerRef.current = null
    }
    completionModalOpenRef.current = false
    setShowCompletionModal(false)
    setCompletionModalState('idle')
    setCompletionModalArticle(null)
  }

  async function pollForCompletedArticle(jobId: string, articleType: ArticleType) {
    const supabase = supabaseRef.current
    const pendingJob = getPendingArticleGeneration(jobId)

    if (!pendingJob) {
      setCompletionModalState('error')
      return
    }

    const requestedAt = new Date(pendingJob.requestedAt).getTime() - 60_000
    let article: { id: string; title: string | null; created_at: string } | null = null
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, created_at')
        .eq('interview_id', interviewId)
        .eq('article_type', articleType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      article = data
    } catch {
      setCompletionModalState('error')
      return
    }

    if (article && new Date(article.created_at).getTime() >= requestedAt) {
      clearPendingArticleGeneration(jobId)
      setPendingArticleJobIdByType((prev) => {
        const next = { ...prev }
        delete next[articleType]
        return next
      })
      setSavedArticles((prev) => ({
        ...prev,
        [articleType]: {
          id: article.id,
          title: article.title,
        },
      }))
      setCompletionModalArticle({
        id: article.id,
        title: article.title,
      })
      setCompletionModalState('ready')
      return
    }

    if (!completionModalOpenRef.current) return

    completionPollTimerRef.current = window.setTimeout(() => {
      void pollForCompletedArticle(jobId, articleType)
    }, 2000)
  }

  function handleCheckCompletion() {
    if (!pendingArticleJobId) return

    if (completionPollTimerRef.current) {
      window.clearTimeout(completionPollTimerRef.current)
      completionPollTimerRef.current = null
    }

    setShowCompletionModal(true)
    completionModalOpenRef.current = true
    setCompletionModalState('checking')
    setCompletionModalArticle(null)
    void pollForCompletedArticle(pendingArticleJobId, tab)
  }

  const mint = getCharacter('mint')

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader title="記事を作る" backHref={`/projects/${projectId}`} backLabel="← 取材先の管理" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text3)] mb-6">
          <Link href="/projects" className="hover:text-[var(--text2)] transition-colors">取材先一覧</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}`} className="hover:text-[var(--text2)] transition-colors">取材先の管理</Link>
          <span>/</span>
          <Link
            href={`/projects/${projectId}/summary?interviewId=${interviewId}`}
            className="hover:text-[var(--text2)] transition-colors"
          >
            取材メモ
          </Link>
          <span>/</span>
          <span className="text-[var(--text2)]">記事素材を生成</span>
        </nav>

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-7 items-start">

          {/* 設定パネル */}
          <aside className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 lg:sticky lg:top-20">
            <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-base mb-5">記事の仕上げ方</p>

            {/* 記事の種類 */}
            <div className="mb-5">
              <p className="text-[11px] font-bold text-[var(--text2)] tracking-[0.08em] uppercase mb-2.5">記事の種類</p>
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => setTab(t.type)}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                      tab === t.type
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-transparent text-[var(--text2)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* テーマ */}
            <div className="mb-5">
              <p className="text-[11px] font-bold text-[var(--text2)] tracking-[0.08em] uppercase mb-2.5">テーマ</p>
              {loadingThemes ? (
                <p className="text-sm text-[var(--text3)]">テーマを確認しています...</p>
              ) : availableThemes.length > 0 ? (
                <div className="space-y-2">
                  {availableThemes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTheme(item)}
                      className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-[var(--r-sm)] text-[13px] cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                        theme === item
                          ? 'bg-[var(--accent-l)] border border-[var(--accent)] text-[var(--accent)] font-semibold'
                          : 'bg-[var(--bg2)] border border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      <span className="leading-[1.5]">{item}</span>
                      {theme === item && <span className="flex-shrink-0 ml-2">✓</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-[var(--text3)] leading-[1.7]">
                  まだ選べるテーマがありません。取材メモからテーマを整理できます。
                </p>
              )}
            </div>

            {/* ブログ記事のみ: 語尾スタイル */}
            {tab === 'client' && (
              <div className="mb-5">
                <p className="text-[11px] font-bold text-[var(--text2)] tracking-[0.08em] uppercase mb-2.5">語尾スタイル</p>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStyle(opt.value)}
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                        style === opt.value
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-transparent text-[var(--text2)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 全タイプ共通: 文字量 */}
            <div className="mb-5">
              <p className="text-[11px] font-bold text-[var(--text2)] tracking-[0.08em] uppercase mb-2.5">文字量</p>
              <div className="flex flex-wrap gap-2">
                {VOLUME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setVolume(opt.value)}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                      volume === opt.value
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-transparent text-[var(--text2)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 回答の整頓 */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setPolishAnswers(v => !v)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] hover:border-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
              >
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-[var(--text)]">回答を整える</p>
                  <p className="text-[11px] text-[var(--text3)] mt-0.5">誤字・話し言葉を自動修正する</p>
                </div>
                <div className={`w-10 h-6 rounded-full flex-shrink-0 transition-colors relative overflow-hidden ${polishAnswers ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${polishAnswers ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

            <div className="mb-5">
              <p className="text-[11px] font-bold text-[var(--text2)] tracking-[0.08em] uppercase mb-2.5">作成方法</p>
              <div className="grid gap-2">
                {GENERATION_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGenerationMode(option.value)}
                    className={`w-full rounded-[var(--r-sm)] border px-3.5 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                      generationMode === option.value
                        ? 'border-[var(--accent)] bg-[var(--accent-l)]'
                        : 'border-[var(--border)] bg-[var(--bg2)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-semibold text-[var(--text)]">{option.label}</p>
                      {generationMode === option.value && <span className="text-[var(--accent)]">✓</span>}
                    </div>
                    <p className="mt-1 text-[11px] leading-[1.6] text-[var(--text3)]">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center bg-[var(--accent)] text-white text-sm font-semibold py-2.5 rounded-[var(--r-sm)] hover:bg-[var(--accent-h)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors cursor-pointer mt-2"
            >
              {isGenerating ? (
                <DevAiLabel>{isInstantGenerating ? '生成しています...' : '作成を手配しています...'}</DevAiLabel>
              ) : generationMode === 'instant' ? (
                <DevAiLabel>その場で生成する →</DevAiLabel>
              ) : (
                <DevAiLabel>バックグラウンドで作成する →</DevAiLabel>
              )}
            </button>
            {currentSavedArticle && !isGenerating && (
              <p className="mt-2.5 text-[12px] text-[var(--teal)] text-center font-semibold">✓ 素材が届きました</p>
            )}
          </aside>

          {/* プレビューパネル */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] overflow-hidden">
            {/* プレビューヘッダー */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg2)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="bg-[var(--accent-l)] text-[var(--accent)] text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  {TABS.find(t => t.type === tab)?.label ?? tab}
                </span>
              </div>
              {currentSavedArticle && !isGenerating && (
                <Link
                  href={`/projects/${projectId}/articles/${currentSavedArticle.id}`}
                  className={getButtonClass('secondary', 'px-3 py-1.5 text-xs')}
                >
                  最新の記事を見る
                </Link>
              )}
            </div>

            {/* コンテンツ */}
            {!isGenerating && !currentSavedArticle && !currentInstantContent && (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 p-8">
                {error ? (
                  <StateCard
                    icon={<CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={48} />}
                    title="いまは記事を用意できません。"
                    description={error}
                    tone="warning"
                    align="left"
                  />
                ) : (
                  <>
                    <InterviewerSpeech
                      icon={
                        <CharacterAvatar
                          src={mint?.icon48}
                          alt="ミントのアイコン"
                          emoji={mint?.emoji}
                          size={48}
                        />
                      }
                      name="ミント"
                      title="設定を選んで「記事素材を生成する」を押してください"
                      description="取材の内容をもとに、記事の素材を整えます。"
                      tone="soft"
                    />
                  </>
                )}
              </div>
            )}

            {isBatchGenerating && (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 p-8">
                <InterviewerSpeech
                  icon={
                    <CharacterAvatar
                      src={mint?.icon48}
                      alt="ミントのアイコン"
                      emoji={mint?.emoji}
                      size={48}
                    />
                  }
                  name="ミント"
                  title="記事素材を作成しています"
                  description="このページで待たなくて大丈夫です。完了したらお知らせします。"
                  tone="soft"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={handleCheckCompletion}
                    className={getButtonClass('primary')}
                  >
                    完了を確認する
                  </button>
                  <Link href={`/projects/${projectId}`} className={getButtonClass('secondary')}>
                    取材先の管理に戻る
                  </Link>
                </div>
              </div>
            )}

            {isInstantGenerating && (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 p-8">
                <WritingLoadingScene
                  title="記事素材を整えています"
                  description="取材内容を整理しています。"
                  previewText={currentInstantContent}
                />
              </div>
            )}

            {currentInstantContent && currentSavedArticle && !isGenerating && (
              <div className="p-8">
                <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-[1.9] text-[var(--text)]">
                  {currentInstantContent}
                </pre>
                <div className="mt-6 border-t border-[var(--border)] pt-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Link
                      href={`/projects/${projectId}/articles/${currentSavedArticle.id}`}
                      className={getButtonClass('primary')}
                    >
                      保存した記事を確認する
                    </Link>
                    <Link
                      href={`/projects/${projectId}#articles`}
                      className={getButtonClass('secondary')}
                    >
                      取材先の管理で確認する
                    </Link>
                    <button
                      onClick={generate}
                      className="px-4 py-2.5 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors border border-[var(--border)] rounded-[var(--r-sm)]"
                    >
                      <DevAiLabel>もう一度まとめる</DevAiLabel>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentSavedArticle && !currentInstantContent && !isGenerating && (
              <div className="p-8">
                <InterviewerSpeech
                  icon={
                    <CharacterAvatar
                      src={mint?.icon48}
                      alt="ミントのアイコン"
                      emoji={mint?.emoji}
                      size={48}
                    />
                  }
                  name="ミント"
                  title={currentSavedArticle.title || '記事素材が用意できています'}
                  description="保存済みの記事を開くか、同じ条件でもう一度作り直せます。"
                  tone="soft"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Link
                    href={`/projects/${projectId}/articles/${currentSavedArticle.id}`}
                    className={getButtonClass('primary')}
                  >
                    保存した記事を確認する
                  </Link>
                  <Link
                    href={`/projects/${projectId}#articles`}
                    className={getButtonClass('secondary')}
                  >
                    取材先の管理で確認する
                  </Link>
                  <button
                    onClick={generate}
                    className="px-4 py-2.5 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors border border-[var(--border)] rounded-[var(--r-sm)]"
                  >
                    <DevAiLabel>もう一度まとめる</DevAiLabel>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 下部リンク */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <Link
            href={`/projects/${projectId}/interview?interviewId=${interviewId}`}
            className="text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded transition-colors"
          >
            取材に戻って話を足す
          </Link>
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded transition-colors"
          >
            取材先の管理に戻る
          </Link>
        </div>
      </div>

      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,18,15,0.55)] px-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-completion-modal-title"
            className="w-full max-w-lg rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
          >
            {completionModalState === 'ready' ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--teal)]">Ready</p>
                    <h2 id="article-completion-modal-title" className="mt-2 font-[family-name:var(--font-noto-serif-jp)] text-xl font-bold text-[var(--text)]">
                      記事素材の作成が完了しました
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeCompletionModal}
                    className="rounded-[var(--r-sm)] px-2 py-1 text-sm text-[var(--text3)] transition-colors hover:text-[var(--text2)]"
                  >
                    閉じる
                  </button>
                </div>
                <div className="rounded-[18px] border border-[var(--ok)]/20 bg-[var(--ok-l)] px-5 py-4">
                  <p className="text-sm font-semibold text-[var(--text)]">{completionModalArticle?.title || '記事素材ができました'}</p>
                  <p className="mt-1 text-sm text-[var(--text2)]">そのまま記事詳細へ進めます。</p>
                </div>
                {completionModalArticle && (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/projects/${projectId}/articles/${completionModalArticle.id}`}
                      className={getButtonClass('primary', 'flex-1 justify-center')}
                    >
                      この記事を見る
                    </Link>
                    <button
                      type="button"
                      onClick={closeCompletionModal}
                      className={getButtonClass('secondary', 'flex-1 justify-center')}
                    >
                      あとで確認する
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Checking</p>
                    <h2 id="article-completion-modal-title" className="mt-2 font-[family-name:var(--font-noto-serif-jp)] text-xl font-bold text-[var(--text)]">
                      {completionModalState === 'error' ? '完了状態を確認できませんでした' : '記事素材を確認しています'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeCompletionModal}
                    className="rounded-[var(--r-sm)] px-2 py-1 text-sm text-[var(--text3)] transition-colors hover:text-[var(--text2)]"
                  >
                    閉じる
                  </button>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg2)] px-5 py-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-l)] text-[var(--accent)]">
                      {completionModalState === 'error' ? '!' : '…'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {completionModalState === 'error' ? 'もう一度お試しください' : '素材を仕上げています'}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text2)]">
                        {completionModalState === 'error'
                          ? 'ネットワーク状況などで確認できないことがあります。'
                          : 'このモーダルを開いたままでも、完成したらそのまま記事へ進めます。'}
                      </p>
                    </div>
                  </div>
                  {completionModalState === 'checking' && (
                    <div className="mt-4 overflow-hidden rounded-full bg-[var(--border)]">
                      <div className="h-2 w-1/3 animate-pulse rounded-full bg-[var(--accent)]" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleCheckCompletion}
                    className={getButtonClass('primary', 'flex-1 justify-center')}
                  >
                    もう一度確認する
                  </button>
                  <button
                    type="button"
                    onClick={closeCompletionModal}
                    className={getButtonClass('secondary', 'flex-1 justify-center')}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
