'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WritingLoadingScene } from '@/components/loading-scenes'
import { CharacterAvatar, DevAiLabel, InterviewerSpeech, PageHeader, StateCard } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

type ArticleType = 'client' | 'interviewer' | 'conversation'
type ArticleStyle = 'desu' | 'de-aru' | 'da-na'
type ArticleVolume = 'short' | 'medium' | 'long'

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

export default function ArticlePage() {
  const { id: projectId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('interviewId') ?? ''
  const initialTheme = searchParams.get('theme') ?? ''
  const supabase = createClient()

  const [tab, setTab] = useState<ArticleType>('client')
  const [contents, setContents] = useState<Partial<Record<ArticleType, string>>>({})
  const [generating, setGenerating] = useState<ArticleType | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableThemes, setAvailableThemes] = useState<string[]>([])
  const [loadingThemes, setLoadingThemes] = useState(true)

  const [style, setStyle] = useState<ArticleStyle>('desu')
  const [volume, setVolume] = useState<ArticleVolume>('medium')
  const [theme, setTheme] = useState(initialTheme)
  const [polishAnswers, setPolishAnswers] = useState(true)

  const currentContent = contents[tab] ?? ''
  const isGenerated = !!currentContent
  const isGenerating = generating === tab

  useEffect(() => {
    if (!interviewId) {
      setAvailableThemes([])
      setLoadingThemes(false)
      return
    }

    async function loadThemes() {
      setLoadingThemes(true)
      const { data: interview } = await supabase
        .from('interviews')
        .select('themes')
        .eq('id', interviewId)
        .single()

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
  }, [initialTheme, interviewId, supabase])

  async function generate() {
    setError(null)
    setGenerating(tab)
    setContents(prev => ({ ...prev, [tab]: '' }))

    const res = await fetch(`/api/projects/${projectId}/article`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewId,
        articleType: tab,
        style:  tab === 'client' ? style : undefined,
        volume,
        theme:  theme.trim() || undefined,
        polishAnswers,
      }),
    })

    if (!res.ok || !res.body) {
      setGenerating(null)
      setError('記事をまだ用意できませんでした。少し待ってから、もう一度お試しください。')
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setContents(prev => ({ ...prev, [tab]: (prev[tab] ?? '') + decoder.decode(value) }))
    }
    setGenerating(null)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(currentContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([currentContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `article-${tab}-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
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
            <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-base mb-5">設定</p>

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
                <div className={`w-9 h-5 rounded-full flex-shrink-0 transition-colors relative ${polishAnswers ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${polishAnswers ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>

            <button
              onClick={generate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center bg-[var(--accent)] text-white text-sm font-semibold py-2.5 rounded-[var(--r-sm)] hover:bg-[var(--accent-h)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors cursor-pointer mt-2"
            >
              {isGenerating
                ? <DevAiLabel>まとめています...</DevAiLabel>
                : <DevAiLabel>記事素材を生成する →</DevAiLabel>
              }
            </button>
            {isGenerated && !isGenerating && (
              <p className="mt-2.5 text-[12px] text-[var(--teal)] text-center font-semibold">✓ 生成完了</p>
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
              {isGenerated && !isGenerating && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--bg)] rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
                  >
                    {copied ? '✓ コピー済み' : 'コピー'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-[var(--text3)] hover:text-[var(--text2)] rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
                  >
                    ↓ ダウンロード
                  </button>
                </div>
              )}
            </div>

            {/* コンテンツ */}
            {!isGenerated && !isGenerating && (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 p-8">
                {error ? (
                  <StateCard
                    icon="✍️"
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

            {isGenerating && (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 p-8">
                <WritingLoadingScene
                  title="取材メモから記事を整えています"
                  description="少しお待ちください。"
                  previewText={currentContent}
                />
              </div>
            )}

            {isGenerated && !isGenerating && (
              <div className="p-8">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-[1.9] text-[var(--text)] max-h-[60vh] overflow-y-auto">
                  {currentContent}
                </pre>
                <div className="mt-6 pt-5 border-t border-[var(--border)]">
                  <button
                    onClick={generate}
                    className="w-full py-2.5 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors border border-[var(--border)] rounded-[var(--r-sm)]"
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
    </div>
  )
}
