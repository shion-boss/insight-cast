'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DevAiLabel, PageHeader, PrimaryButton, SecondaryButton, StateCard } from '@/components/ui'

type ArticleType = 'client' | 'interviewer' | 'conversation'
type ArticleStyle = 'desu' | 'de-aru' | 'da-na'
type ArticleVolume = 'short' | 'medium' | 'long'

const TABS: { type: ArticleType; label: string; emoji: string; desc: string }[] = [
  { type: 'client',       label: 'クライアント視点', emoji: '🏪', desc: '事業者の言葉で語る読み物記事' },
  { type: 'interviewer',  label: 'インタビュアー視点', emoji: '🎙️', desc: 'インタビュアーが伝える紹介記事' },
  { type: 'conversation', label: '会話込み',          emoji: '💬', desc: 'Q&A形式のインタビュー記事' },
]

const STYLE_OPTIONS: { value: ArticleStyle; label: string }[] = [
  { value: 'desu',   label: 'ですます体' },
  { value: 'de-aru', label: 'である体' },
  { value: 'da-na',  label: 'だ・な体' },
]

const VOLUME_OPTIONS: { value: ArticleVolume; label: string }[] = [
  { value: 'short',  label: '短め（600字）' },
  { value: 'medium', label: '普通（1200字）' },
  { value: 'long',   label: '長め（2000字）' },
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

  const currentContent = contents[tab] ?? ''
  const isGenerated = !!currentContent

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

      const nextThemes = Array.isArray(interview?.themes) ? interview.themes.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
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
        style:  tab === 'client' ? style  : undefined,
        volume: tab === 'client' ? volume : undefined,
        theme:  theme.trim() || undefined,
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

  const currentTab = TABS.find(t => t.type === tab)!

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader title="Insight Cast" backHref={`/projects/${projectId}`} backLabel="← 取材先の管理" />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* タブ */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6">
          {TABS.map((t) => (
            <button
              key={t.type}
              onClick={() => setTab(t.type)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 cursor-pointer transition-colors ${
                tab === t.type ? 'bg-white text-stone-800' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 未生成状態 */}
        {!isGenerated && generating !== tab && (
          <>
            {error && (
              <div className="mb-4">
                <StateCard
                  icon="✍️"
                  title="いまは記事を用意できません。"
                  description={error}
                  tone="warning"
                  align="left"
                />
              </div>
            )}

            <div className="mb-4 rounded-xl border border-stone-100 bg-white p-4">
              <p className="text-xs text-stone-500">記事テーマ</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-400">
                インタビュー後に整理したテーマから選べます。
              </p>

              {loadingThemes ? (
                <p className="mt-3 text-sm text-stone-400">テーマを確認しています...</p>
              ) : availableThemes.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableThemes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTheme(item)}
                      className={`rounded-full px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 cursor-pointer transition-colors ${
                        theme === item
                          ? 'bg-stone-800 text-white'
                          : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-400">
                  まだ選べるテーマがありません。取材メモを開くと、提案テーマを先に整理できます。
                </p>
              )}
            </div>

            {/* クライアント視点のみ追加オプション */}
            {tab === 'client' && (
              <div className="bg-white rounded-xl border border-stone-100 p-4 mb-4 space-y-4">
                <div>
                  <label className="block text-xs text-stone-500 mb-2">語尾スタイル</label>
                  <div className="flex gap-2">
                    {STYLE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setStyle(opt.value)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 cursor-pointer transition-colors ${
                          style === opt.value
                            ? 'bg-stone-800 text-white'
                            : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-2">ボリューム</label>
                  <div className="flex gap-2">
                    {VOLUME_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setVolume(opt.value)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 cursor-pointer transition-colors ${
                          volume === opt.value
                            ? 'bg-stone-800 text-white'
                            : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-stone-100 p-8 text-center">
              <div className="text-4xl mb-3">{currentTab.emoji}</div>
              <p className="text-stone-700 font-medium mb-1">{currentTab.desc}</p>
              <p className="text-sm text-stone-400 mb-6">インタビューの内容をもとに記事を作ります</p>
              <PrimaryButton
                onClick={generate}
                className="px-6 py-3 text-sm"
              >
                <DevAiLabel>この形で記事をまとめる</DevAiLabel>
              </PrimaryButton>
            </div>
          </>
        )}

        {/* 生成中 */}
        {generating === tab && (
          <StateCard
            icon={<span className="animate-bounce inline-block">{currentTab.emoji}</span>}
            title="記事のたたき台をまとめています"
            description="いま見えている文章から、そのまま続きを確認できます。"
            align="left"
            action={(
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700">
                {currentContent || ' '}
              </pre>
            )}
          />
        )}

        {/* 生成済み */}
        {isGenerated && generating !== tab && (
          <>
            <div className="bg-white rounded-xl border border-stone-100 p-6 mb-4">
              <pre className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed font-sans max-h-[60vh] overflow-y-auto">
                {currentContent}
              </pre>
            </div>

            <div className="flex gap-2 mb-4">
              <SecondaryButton
                onClick={handleCopy}
                className="flex-1 py-2 text-sm"
              >
                {copied ? 'コピーしました ✓' : 'コピーする'}
              </SecondaryButton>
              <SecondaryButton
                onClick={handleDownload}
                className="flex-1 py-2 text-sm"
              >
                Markdownでダウンロード
              </SecondaryButton>
            </div>

            <button
              onClick={generate}
              className="w-full py-2 text-sm text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 cursor-pointer transition-colors border border-stone-100 rounded-xl"
            >
              <DevAiLabel>もう一度まとめる</DevAiLabel>
            </button>
          </>
        )}

        <div className="mt-6">
          <Link
            href={`/projects/${projectId}/interview?interviewId=${interviewId}`}
            className="block text-center text-sm text-stone-300 hover:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 rounded-md transition-colors"
          >
            取材に戻って話を足す
          </Link>
          <Link
            href={`/projects/${projectId}`}
            className="mt-3 block text-center text-sm text-stone-300 hover:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 rounded-md transition-colors"
          >
            取材先の管理に戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
