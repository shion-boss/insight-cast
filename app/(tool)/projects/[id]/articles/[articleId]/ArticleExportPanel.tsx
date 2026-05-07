'use client'

import { useState, useCallback, useTransition, useMemo, useRef, Fragment } from 'react'
import Image from 'next/image'

import { getCharacter, getPublicCastIconUrl } from '@/lib/characters'
import { buildArticleHtml, buildIntroHtml } from '@/lib/conversation-bubble-html'
import type { ArticleSuggestions } from '@/lib/article-suggestions'

import { saveArticleContent } from './actions'
import { BlockCopyCard, SectionGroupCard, SuggestionCard } from './_components/article-export/BlockCopyCard'
import { InterviewerIntroPanelCard } from './_components/article-export/InterviewerIntroPanelCard'
import {
  applyBlockEdit,
  applyConvEdit,
  detectRespondentName,
  initial,
  toPlainText,
} from './_components/article-export/helpers'
import {
  buildConversationRenderGroups,
  groupArticleBlocks,
  splitIntoArticleBlocks,
} from './_components/article-export/markdown-blocks'
import { DEFAULT_THEME_COLOR, type ConvRenderGroup } from './_components/article-export/types'

export function ArticleExportPanel({
  content,
  title,
  articleType,
  interviewerId,
  interviewerName,
  interviewerLabel,
  clientName,
  userAvatarUrl,
  articleId,
  projectId,
  suggestions,
  canEdit,
}: {
  content: string
  title: string
  articleType: string
  interviewerId: string | null
  interviewerName: string | null
  interviewerLabel: string | null
  clientName: string | null
  userAvatarUrl: string | null
  articleId: string
  projectId: string
  suggestions?: ArticleSuggestions | null
  canEdit?: boolean
}) {
  const [copiedText, setCopiedText] = useState(false)
  const [copiedMd, setCopiedMd] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR)
  const [editedContent, setEditedContent] = useState(content)
  const savedContentRef = useRef(content)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isEditing, setIsEditing] = useState(false)
  const [, startTransition] = useTransition()
  const [globalMode, setGlobalMode] = useState<'text' | 'markdown'>('text')

  const [showSuggestions, setShowSuggestions] = useState(false)
  const hasSuggestions = (suggestions?.items.length ?? 0) > 0

  const char = getCharacter(interviewerId ?? 'mint')
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  // 埋め込みHTML用のアイコンURLは安定した /public/characters/{id}-48.png を使う。
  // Next.js StaticImageData (`char.icon48.src`) はビルドで変わる可能性があるため不可。
  const defaultInterviewerAvatarUrl = char ? getPublicCastIconUrl(char.id, appUrl) : null

  // コンテンツ内の実際の respondent 名を検出。旧フォーマット（bizName）の記事にも対応。
  const detectedClientName = detectRespondentName(content, interviewerName)
  // マッチングには検出名を優先。表示名は profile.name を優先。
  const effectiveClientName = detectedClientName ?? clientName ?? '事業者'

  const [interviewerAvatarUrl, setInterviewerAvatarUrl] = useState<string>(defaultInterviewerAvatarUrl ?? '')
  const [interviewerDisplayName, setInterviewerDisplayName] = useState<string>(interviewerName ?? '')
  const [clientDisplayName, setClientDisplayName] = useState<string>(clientName ?? detectedClientName ?? '')
  const [clientAvatarUrl, setClientAvatarUrl] = useState<string>(userAvatarUrl ?? '')
  const [showInterviewerIcon, setShowInterviewerIcon] = useState(true)
  const [showInterviewerName, setShowInterviewerName] = useState(true)
  const [showClientIcon, setShowClientIcon] = useState(true)
  const [showClientName, setShowClientName] = useState(true)
  const [showIntro, setShowIntro] = useState(true)

  const makeConvOnlyHtml = useCallback((text: string) =>
    buildArticleHtml({
      content: text,
      interviewerName: interviewerName ?? 'インタビュアー',
      interviewerDisplayName: interviewerDisplayName || interviewerName || 'インタビュアー',
      interviewerLabel,
      interviewerAvatarUrl: interviewerAvatarUrl || null,
      clientName: effectiveClientName,
      clientDisplayName: clientDisplayName || clientName || effectiveClientName,
      clientInitial: initial(clientDisplayName || clientName || effectiveClientName),
      userAvatarUrl: clientAvatarUrl || userAvatarUrl || null,
      themeColor,
      showIcon: showInterviewerIcon,
      showName: showInterviewerName,
      showClientIcon,
      showClientName,
      showIntro: false,
    }),
    [themeColor, interviewerName, interviewerLabel, interviewerDisplayName, interviewerAvatarUrl, clientName, clientDisplayName, clientAvatarUrl, userAvatarUrl, showInterviewerIcon, showInterviewerName, showClientIcon, showClientName, effectiveClientName]
  )

  const makeIntroHtml = useCallback(() =>
    buildIntroHtml({
      interviewerDisplayName: interviewerDisplayName || interviewerName || 'インタビュアー',
      interviewerLabel,
      interviewerAvatarUrl: interviewerAvatarUrl || null,
      themeColor,
    }),
    [themeColor, interviewerName, interviewerLabel, interviewerDisplayName, interviewerAvatarUrl]
  )

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(editedContent))
      setCopiedText(true)
      setCopyError(false)
      setTimeout(() => setCopiedText(false), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 3000)
    }
  }, [editedContent])

  const handleCopyMd = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      setCopiedMd(true)
      setCopyError(false)
      setTimeout(() => setCopiedMd(false), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 3000)
    }
  }, [editedContent])

  const handleDownload = useCallback((fmt: 'text' | 'markdown') => {
    const blob = new Blob(
      [fmt === 'text' ? toPlainText(editedContent) : editedContent],
      { type: fmt === 'text' ? 'text/plain' : 'text/markdown' }
    )
    const ext = fmt === 'text' ? 'txt' : 'md'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.slice(0, 40).replace(/[^\w぀-ゟ゠-ヿ一-鿿]/g, '_')}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [editedContent, title])

  function handleStartEdit() {
    setIsEditing(true)
  }

  function handleSaveAndExit() {
    setSaveState('saving')
    startTransition(async () => {
      try {
        await saveArticleContent(articleId, projectId, content, editedContent)
        savedContentRef.current = editedContent
        setSaveState('saved')
        setTimeout(() => { setIsEditing(false); setSaveState('idle') }, 800)
      } catch {
        setSaveState('error')
        setTimeout(() => setSaveState('idle'), 3000)
      }
    })
  }

  function handleCancel() {
    setEditedContent(savedContentRef.current)
    setIsEditing(false)
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {/* キャラ吹き出しヘッダー */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div className="relative flex-shrink-0">
          {char?.icon48 ? (
            <Image
              src={char.icon48}
              alt={`${char.name ?? 'インタビュアー'}のアイコン`}
              width={40}
              height={40}
              className="rounded-full border border-[var(--border)] object-cover"
            />
          ) : (
            <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg">
              {char?.emoji ?? '🐱'}
            </div>
          )}
        </div>
        <div className="relative rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--text2)]">
          記事をまとめました。好きな形式でお使いください。
        </div>
      </div>

      {/* アクションボタン行 */}
      <div className="border-b border-[var(--border)] px-4 pt-2 pb-2 flex flex-col gap-1.5">

        {/* コピー・書き出し行（非編集時） */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--text2)] whitespace-nowrap">全文コピー</span>
              <button type="button" onClick={handleCopyText}
                className="relative min-h-[36px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)]">
                <span className={copiedText ? 'opacity-0' : ''}>テキスト</span>
                <span className={`absolute inset-0 flex items-center justify-center ${copiedText ? '' : 'opacity-0'}`}>✓ コピー</span>
              </button>
              <button type="button" onClick={handleCopyMd}
                className="relative min-h-[36px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)]">
                <span className={copiedMd ? 'opacity-0' : ''}>Markdown</span>
                <span className={`absolute inset-0 flex items-center justify-center ${copiedMd ? '' : 'opacity-0'}`}>✓ コピー</span>
              </button>
            </div>
            <span aria-hidden="true" className="h-4 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--text2)] whitespace-nowrap">書き出し</span>
              <button type="button" onClick={() => handleDownload('text')}
                className="min-h-[36px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)]">
                .txt
              </button>
              <button type="button" onClick={() => handleDownload('markdown')}
                className="min-h-[36px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)]">
                .md
              </button>
            </div>
          </div>
        )}

        {/* 編集・提案・テーマカラー行 */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit !== false && (isEditing ? (
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveAndExit} disabled={saveState === 'saving'}
                className="min-h-[44px] rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                {saveState === 'saving' ? '保存中...' : saveState === 'saved' ? <><span aria-hidden="true">✓ </span>保存済み</> : saveState === 'error' ? '保存できませんでした' : '保存'}
              </button>
              <button type="button" onClick={handleCancel} disabled={saveState === 'saving'}
                className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] disabled:opacity-40">
                キャンセル
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleStartEdit}
              className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)]">
              編集する
            </button>
          ))}
          {hasSuggestions && (
            <button type="button" role="switch" aria-label="クオリティアップ提案を表示" aria-checked={showSuggestions}
              onClick={() => setShowSuggestions((v) => !v)}
              className="flex items-center gap-1.5 select-none rounded min-h-[44px] px-1">
              <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showSuggestions ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showSuggestions ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-[var(--text2)] whitespace-nowrap">クオリティアップ提案</span>
            </button>
          )}
          {articleType === 'conversation' && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-[var(--text2)] hidden sm:inline">テーマカラー</span>
              <input type="color" aria-label="テーマカラーを選択" value={themeColor} onChange={(e) => setThemeColor(e.target.value)}
                className="h-8 w-8 sm:h-7 sm:w-7 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5" />
              <button type="button" onClick={() => setThemeColor(DEFAULT_THEME_COLOR)}
                className="min-h-[44px] px-2 text-xs text-[var(--text2)] hover:text-[var(--text2)] transition-colors rounded sm:min-h-0 sm:px-0">
                リセット
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 設定パネル（会話形式のみ） */}
      {articleType === 'conversation' && (
        <div className="border-b border-[var(--border)] divide-y divide-[var(--border)] text-xs">
          {/* インタビュアー */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0 px-5 py-3">
            <span className="sm:w-28 shrink-0 text-[var(--text2)] sm:pt-1">インタビュアー</span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-7 w-7 shrink-0 rounded-full border border-[var(--border)] overflow-hidden bg-[var(--bg2)]">
                  {interviewerAvatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={interviewerAvatarUrl} alt="インタビュアーのアイコンプレビュー" className="h-full w-full object-cover" />
                  )}
                </div>
                <label className="cursor-pointer rounded border border-[var(--border)] bg-transparent px-2 min-h-[44px] inline-flex items-center text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors shrink-0 sm:min-h-0 sm:py-1">
                  画像を選ぶ
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return
                    const reader = new FileReader(); reader.onload = () => setInterviewerAvatarUrl(reader.result as string); reader.readAsDataURL(file)
                  }} />
                </label>
                {interviewerAvatarUrl && interviewerAvatarUrl !== (defaultInterviewerAvatarUrl ?? '') && (
                  <button type="button" onClick={() => setInterviewerAvatarUrl(defaultInterviewerAvatarUrl ?? '')} className="shrink-0 min-h-[44px] px-2 text-[var(--text2)] hover:text-[var(--text2)] transition-colors rounded sm:min-h-0 sm:px-0">削除</button>
                )}
                <input type="text" aria-label="インタビュアーの表示名" value={interviewerDisplayName} onChange={(e) => setInterviewerDisplayName(e.target.value)} placeholder="名前" className="min-w-0 w-24 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[var(--text2)]" />
                <button type="button" onClick={() => { setInterviewerAvatarUrl(defaultInterviewerAvatarUrl ?? ''); setInterviewerDisplayName(interviewerName ?? '') }} className="shrink-0 min-h-[44px] px-2 text-[var(--text2)] hover:text-[var(--text2)] transition-colors rounded sm:min-h-0 sm:px-0">リセット</button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" role="switch" aria-label="インタビュアーアイコンを表示" aria-checked={showInterviewerIcon} onClick={() => setShowInterviewerIcon(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] rounded sm:min-h-0">
                  <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showInterviewerIcon ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                    <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showInterviewerIcon ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[var(--text2)]">アイコン</span>
                </button>
                <button type="button" role="switch" aria-label="インタビュアー名を表示" aria-checked={showInterviewerName} onClick={() => setShowInterviewerName(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] rounded sm:min-h-0">
                  <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showInterviewerName ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                    <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showInterviewerName ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[var(--text2)]">名前</span>
                </button>
              </div>
            </div>
          </div>
          {/* 取材先 */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0 px-5 py-3">
            <span className="sm:w-28 shrink-0 text-[var(--text2)] sm:pt-1">取材先</span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-7 w-7 shrink-0 rounded-full border border-[var(--border)] overflow-hidden" style={{ background: clientAvatarUrl ? undefined : themeColor }}>
                  {clientAvatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={clientAvatarUrl} alt="取材先のアイコンプレビュー" className="h-full w-full object-cover" />
                  )}
                </div>
                <label className="cursor-pointer rounded border border-[var(--border)] bg-transparent px-2 min-h-[44px] inline-flex items-center text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors shrink-0 sm:min-h-0 sm:py-1">
                  画像を選ぶ
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return
                    const reader = new FileReader(); reader.onload = () => setClientAvatarUrl(reader.result as string); reader.readAsDataURL(file)
                  }} />
                </label>
                {clientAvatarUrl && (
                  <button type="button" onClick={() => setClientAvatarUrl('')} className="shrink-0 min-h-[44px] px-2 text-[var(--text2)] hover:text-[var(--text2)] transition-colors rounded sm:min-h-0 sm:px-0">削除</button>
                )}
                <input type="text" aria-label="取材先の表示名" value={clientDisplayName} onChange={(e) => setClientDisplayName(e.target.value)} placeholder="名前" className="min-w-0 w-24 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[var(--text2)]" />
                <button type="button" onClick={() => { setClientAvatarUrl(''); setClientDisplayName(clientName ?? '') }} className="shrink-0 min-h-[44px] px-2 text-[var(--text2)] hover:text-[var(--text2)] transition-colors rounded sm:min-h-0 sm:px-0">リセット</button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" role="switch" aria-label="取材先アイコンを表示" aria-checked={showClientIcon} onClick={() => setShowClientIcon(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] rounded sm:min-h-0">
                  <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showClientIcon ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                    <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showClientIcon ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[var(--text2)]">アイコン</span>
                </button>
                <button type="button" role="switch" aria-label="取材先の名前を表示" aria-checked={showClientName} onClick={() => setShowClientName(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] rounded sm:min-h-0">
                  <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showClientName ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                    <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showClientName ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[var(--text2)]">名前</span>
                </button>
              </div>
            </div>
          </div>
          {/* 紹介文 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 px-5 py-3">
            <span className="sm:w-28 shrink-0 text-[var(--text2)]">紹介文</span>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" role="switch" aria-label="AIキャスト紹介文を表示" aria-checked={showIntro} onClick={() => setShowIntro(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] rounded sm:min-h-0">
                <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showIntro ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                  <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showIntro ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-[var(--text2)]">AIキャスト・Insight Cast を紹介する</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* グローバルコピー形式トグル */}
      {!isEditing && (
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text2)]">コピー形式</span>
          <div className="flex overflow-hidden rounded-[var(--r-sm)] border border-[var(--border)] text-xs">
            <button type="button" onClick={() => setGlobalMode('text')} className={`px-3 py-1.5 transition-colors ${globalMode === 'text' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text2)] hover:bg-[var(--bg2)]'}`}>テキスト</button>
            <button type="button" onClick={() => setGlobalMode('markdown')} className={`border-l border-[var(--border)] px-3 py-1.5 transition-colors ${globalMode === 'markdown' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text2)] hover:bg-[var(--bg2)]'}`}>Markdown</button>
          </div>
        </div>
      )}

      {/* コンテンツ描画（blocks のみ） */}
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        {articleType === 'conversation'
          ? (() => {
              const rawGroups = buildConversationRenderGroups(editedContent, interviewerName, effectiveClientName)
              // 概要ブロック（standalone/intro）が会話グループより後ろにある場合、前に移動する
              // 会話本文と小見出し+本文の上下関係は記事の内容に従う
              const allGroups = (() => {
                const convIdx = rawGroups.findIndex(g => g.type === 'conversation')
                if (convIdx < 0) return rawGroups
                const lateIntroIdxs = new Set<number>()
                const lateIntros: ConvRenderGroup[] = []
                for (let i = convIdx + 1; i < rawGroups.length; i++) {
                  const g = rawGroups[i]
                  if (g.type === 'standalone' && g.block.kind === 'intro') {
                    lateIntros.push(g)
                    lateIntroIdxs.add(i)
                  }
                }
                if (lateIntros.length === 0) return rawGroups
                const result: ConvRenderGroup[] = []
                for (let i = 0; i < rawGroups.length; i++) {
                  if (lateIntroIdxs.has(i)) continue
                  if (i === convIdx) result.push(...lateIntros)
                  result.push(rawGroups[i])
                }
                return result
              })()
              const firstConvIdx = allGroups.findIndex(g => g.type === 'conversation')
              return allGroups.map((group, idx) => {
                const anchor = group.type === 'section' ? group.heading.text
                  : group.type === 'standalone' && group.block.kind === 'intro' ? 'intro'
                  : null
                const groupSuggestions = anchor && showSuggestions
                  ? (suggestions?.items.filter((s) => s.anchor === anchor) ?? [])
                  : []
                return (
                  <Fragment key={idx}>
                    {group.type === 'conversation'
                      ? <InterviewerIntroPanelCard
                          interviewerDisplayName={interviewerDisplayName || interviewerName || 'インタビュアー'}
                          interviewerLabel={interviewerLabel}
                          text={group.text}
                          interviewerName={interviewerName ?? ''}
                          clientName={effectiveClientName}
                          getIntroHtml={makeIntroHtml}
                          getConvHtml={() => makeConvOnlyHtml(group.text)}
                          isEditing={isEditing}
                          onEditConv={newExchanges => setEditedContent(prev => applyConvEdit(prev, interviewerName ?? '', effectiveClientName, newExchanges))}
                          themeColor={themeColor}
                          showIntro={showIntro && idx === firstConvIdx}
                          mode={globalMode}
                        />
                      : group.type === 'meta'
                      ? null
                      : group.type === 'section'
                      ? <SectionGroupCard
                          heading={group.heading}
                          body={group.body}
                          isEditing={isEditing}
                          onEditHeading={(o, n) => setEditedContent(prev => applyBlockEdit(prev, 'heading', o, n))}
                          onEditBody={(o, n) => setEditedContent(prev => applyBlockEdit(prev, 'body', o, n))}
                          mode={globalMode}
                        />
                      : <BlockCopyCard
                          kind={group.block.kind}
                          text={group.block.text}
                          rawText={group.block.rawText}
                          isEditing={isEditing}
                          onEditDone={(o, n) => setEditedContent(prev => applyBlockEdit(prev, group.block.kind, o, n))}
                          mode={globalMode}
                        />
                    }
                    {groupSuggestions.map((item, sIdx) => (
                      <SuggestionCard key={sIdx} item={item} />
                    ))}
                  </Fragment>
                )
              })
            })()
          : groupArticleBlocks(splitIntoArticleBlocks(editedContent)).map((group, idx) => {
              const anchor = group.type === 'section' ? group.heading.text
                : group.type === 'standalone' && group.block.kind === 'intro' ? 'intro'
                : null
              const groupSuggestions = anchor && showSuggestions
                ? (suggestions?.items.filter((s) => s.anchor === anchor) ?? [])
                : []
              return (
                <Fragment key={idx}>
                  {group.type === 'section' ? (
                    <SectionGroupCard
                      heading={group.heading}
                      body={group.body}
                      isEditing={isEditing}
                      onEditHeading={(o, n) => setEditedContent(prev => applyBlockEdit(prev, 'heading', o, n))}
                      onEditBody={(o, n) => setEditedContent(prev => applyBlockEdit(prev, 'body', o, n))}
                      mode={globalMode}
                    />
                  ) : (
                    <BlockCopyCard
                      kind={group.block.kind}
                      text={group.block.text}
                      rawText={group.block.rawText}
                      isEditing={isEditing}
                      onEditDone={(o, n) => setEditedContent(prev => applyBlockEdit(prev, group.block.kind, o, n))}
                      mode={globalMode}
                    />
                  )}
                  {groupSuggestions.map((item, sIdx) => (
                    <SuggestionCard key={sIdx} item={item} />
                  ))}
                </Fragment>
              )
            })
        }
      </div>
      {copyError && (
        <p role="alert" className="px-5 pb-3 text-xs text-[var(--err)]">コピーできませんでした。手動でお試しください。</p>
      )}
    </section>
  )
}
