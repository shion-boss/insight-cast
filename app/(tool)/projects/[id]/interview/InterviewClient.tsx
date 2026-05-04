'use client'

import React from 'react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { getCharacter } from '@/lib/characters'
import { getInterviewFocusThemeLabel } from '@/lib/interview-focus-theme'
import { CharacterAvatar, DevAiLabel, InterviewerSpeech } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

type AttachmentRef = { path: string; contentType: string; previewUrl: string }
type Message = { role: 'user' | 'interviewer'; content: string; attachments?: AttachmentRef[]; yesno?: boolean }
type SupportPost = { url: string; title: string; summary: string }

const MAX_TURNS = 15
const STANDARD_TURNS = 7
const PASS_QUESTION_TOKEN = '__PASS_QUESTION__'
const CONTINUE_INTERVIEW_TOKEN = '__CONTINUE_INTERVIEW__'
const DEEP_DIVE_TOKEN = '__DEEP_DIVE__'
const SKIP_PHOTO_TOKEN = '__SKIP_PHOTO__'

function getProgressLabel(turns: number) {
  if (turns < 3) return '話を聞かせてもらっています'
  if (turns < 5) return 'いろいろと教えてもらっています'
  if (turns < STANDARD_TURNS) {
    const remaining = STANDARD_TURNS - turns
    return `いい話が集まってきました（あと${remaining}問でひと区切り）`
  }
  if (turns < MAX_TURNS) return 'もう少し掘り下げています'
  return 'まとめに入ります'
}

type Props = {
  projectId: string
  interviewId: string
  from: string
}

export default function InterviewClient({ projectId, interviewId, from }: Props) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const backHref = from === 'dashboard' ? '/dashboard' : `/projects/${projectId}`
  const backLabel = from === 'dashboard' ? '← ダッシュボード' : '← プロジェクトの管理'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [characterId, setCharacterId] = useState('mint')
  const [initializing, setInitializing] = useState(true)
  const [userTurns, setUserTurns] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [completionType, setCompletionType] = useState<'standard_sufficient' | 'standard_need_more' | 'hard_limit' | 'manual'>('manual')
  const [continueCount, setContinueCount] = useState(0)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [focusThemeLabel, setFocusThemeLabel] = useState<string | null>('テーマ: お任せ')
  // ハル限定: アップロード予定の画像（送信前にプレビューで保持）
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentRef[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // ハル限定: 「写真なしで進める」を選んだら次回からスキップボタンを隠す
  const [photoSkipped, setPhotoSkipped] = useState(false)
  const [supportPosts, setSupportPosts] = useState<{
    ownPosts: SupportPost[]
    competitorPosts: SupportPost[]
    loading: boolean
    error: string | null
  }>({
    ownPosts: [],
    competitorPosts: [],
    loading: false,
    error: null,
  })
  const [isSupportPanelOpen, setIsSupportPanelOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initializedRef = useRef(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streamingMessage ? 'instant' : 'smooth' })
  }, [messages, loading, streamingMessage])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  const sendMessageToAI = useCallback(async (userText: string | null, opts?: { alreadyDisplayed?: boolean; attachments?: AttachmentRef[] }) => {
    setSubmitError(null)
    setLoading(true)
    setStreamingMessage('')

    const shouldAppendUser = Boolean(userText && !opts?.alreadyDisplayed)

    if (shouldAppendUser && userText) {
      setMessages((prev) => [...prev, { role: 'user', content: userText, attachments: opts?.attachments }])
      setUserTurns((t) => t + 1)
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/interview/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          userMessage: userText ?? '__GREETING__',
          attachments: opts?.attachments?.map((a) => ({ path: a.path, contentType: a.contentType })) ?? [],
        }),
      })

      if (res.status === 403) {
        const body = await res.json().catch(() => ({}))
        if (body.error === 'free_plan_locked') {
          document.dispatchEvent(new Event('cross-area-navigate'))
          router.push('/pricing?reason=free_plan_locked')
          return { ok: false as const, interviewComplete: false }
        }
        throw new Error('request failed')
      }
      if (!res.ok || !res.body) {
        throw new Error('request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value)
        // ストリーミング表示時もマーカー類は隠す
        setStreamingMessage(
          text
            .replace(/\[INTERVIEW_COMPLETE\]/g, '')
            .replace(/\[DISCOVERY:[^\]]+\]/g, '')
            .replace(/\[DRAFT_PROPOSAL:[^\]]+\]/g, '')
            .replace(/\[HEADLINE_CANDIDATES:[^\]]+\]/g, '')
            .replace(/\[YESNO_QUESTION\]/g, '')
            .trim(),
        )
      }

      const interviewComplete = /\[INTERVIEW_COMPLETE\]/g.test(text)
      const yesnoActive = /\[YESNO_QUESTION\]/.test(text)
      const finalText = text
        .replace(/\[INTERVIEW_COMPLETE\]/g, '')
        .replace(/\[DISCOVERY:[^\]]+\]/g, '')
        .replace(/\[DRAFT_PROPOSAL:[^\]]+\]/g, '')
        .replace(/\[HEADLINE_CANDIDATES:[^\]]+\]/g, '')
        .replace(/\[YESNO_QUESTION\]/g, '')
        .trim()
      if (finalText) {
        setMessages((prev) => [...prev, { role: 'interviewer', content: finalText, yesno: yesnoActive }])
      }
      setStreamingMessage('')
      setTimeout(() => textareaRef.current?.focus(), 50)
      return { ok: true as const, interviewComplete }
    } catch {
      if (shouldAppendUser) {
        setMessages((prev) => prev.slice(0, -1))
        setUserTurns((t) => Math.max(0, t - 1))
      }
      if (userText && !opts?.alreadyDisplayed) {
        setInput(userText)
      }
      setStreamingMessage('')
      setSubmitError('返事を受け取れませんでした。少し待ってから、もう一度送信してください。')
      return { ok: false as const, interviewComplete: false }
    } finally {
      setLoading(false)
    }
  }, [interviewId, projectId, router])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    async function init() {
      try {
        const supabase = supabaseRef.current
        const { data: interview } = await supabase
          .from('interviews')
          .select('interviewer_type, focus_theme_mode, focus_theme')
          .eq('id', interviewId)
          .is('deleted_at', null)
          .single()

        if (interview) {
          setCharacterId(interview.interviewer_type)
          setFocusThemeLabel(getInterviewFocusThemeLabel(interview.focus_theme_mode, interview.focus_theme))
        }

        const { data: history } = await supabase
          .from('interview_messages')
          .select('role, content, meta')
          .eq('interview_id', interviewId)
          .order('created_at', { ascending: true })

        if (history && history.length > 0) {
          // meta から yesno フラグを Message 型に展開（最新のインタビュアー発話だけが対象だが、全件持っておいて render 側で最新判定）
          const enriched: Message[] = history.map((m) => {
            const meta = (m as { meta?: { yesno?: { active?: boolean } } | null }).meta ?? null
            return {
              role: m.role as 'user' | 'interviewer',
              content: m.content,
              yesno: meta?.yesno?.active === true,
            }
          })
          setMessages(enriched)
          setUserTurns(enriched.filter(m => m.role === 'user').length)
        } else {
          const result = await sendMessageToAI(null)
          if (!result.ok) {
            setSubmitError('取材を始められませんでした。ページを再読み込みしてもう一度お試しください。')
          }
        }
      } catch {
        setSubmitError('取材画面を開けませんでした。ページを再読み込みしてもう一度お試しください。')
      } finally {
        setInitializing(false)
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    }
    init()
  }, [interviewId, sendMessageToAI])

  const latestInterviewerMessage = [...messages].reverse().find((message) => message.role === 'interviewer')?.content ?? ''

  useEffect(() => {
    if (!interviewId || !latestInterviewerMessage.trim()) return

    let cancelled = false
    setSupportPosts({ ownPosts: [], competitorPosts: [], loading: true, error: null })
    setIsSupportPanelOpen(false)

    async function loadSupport() {
      try {
        const res = await fetch(`/api/projects/${projectId}/interview/support`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId,
            question: latestInterviewerMessage,
          }),
        })

        if (!res.ok) throw new Error('request failed')
        const json = await res.json() as {
          ownPosts?: SupportPost[]
          competitorPosts?: SupportPost[]
        }

        if (cancelled) return
        setSupportPosts({
          ownPosts: Array.isArray(json.ownPosts) ? json.ownPosts : [],
          competitorPosts: Array.isArray(json.competitorPosts) ? json.competitorPosts : [],
          loading: false,
          error: null,
        })
      } catch {
        if (cancelled) return
        setSupportPosts({
          ownPosts: [],
          competitorPosts: [],
          loading: false,
          error: '関連記事はいま取得できていません。',
        })
      }
    }

    loadSupport()

    return () => {
      cancelled = true
      setSupportPosts((prev) => prev.loading ? { ...prev, loading: false } : prev)
    }
  }, [interviewId, latestInterviewerMessage, projectId])

  async function submitMessage() {
    const hasContent = input.trim().length > 0
    const hasAttachments = pendingAttachments.length > 0
    if (!hasContent && !hasAttachments) return
    if (loading) return
    if (hasReachedTurnLimit) {
      setShowComplete(true)
      return
    }
    const text = input.trim() || '（写真を共有しました）'
    setInput('')

    const newTurns = userTurns + 1
    const attachmentsToSend = pendingAttachments
    setPendingAttachments([])

    const result = await sendMessageToAI(text, { attachments: attachmentsToSend })
    if (!result.ok) return

    if (newTurns >= MAX_TURNS) {
      setCompletionType('hard_limit')
      setShowComplete(true)
    } else if (newTurns === STANDARD_TURNS) {
      setCompletionType(result.interviewComplete ? 'standard_sufficient' : 'standard_need_more')
      setShowComplete(true)
    } else if (result.interviewComplete && continueCount < 2) {
      setCompletionType('standard_sufficient')
      setShowComplete(true)
    }
  }

  async function handlePassQuestion() {
    if (loading) return
    if (hasReachedTurnLimit) {
      setShowComplete(true)
      return
    }

    // 直前のインタビュアーの質問を履歴から取り消す
    setMessages((prev) => {
      const last = [...prev].reverse().findIndex((m) => m.role === 'interviewer')
      if (last === -1) return prev
      const idx = prev.length - 1 - last
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
    })

    const result = await sendMessageToAI(PASS_QUESTION_TOKEN, { alreadyDisplayed: true })
    if (!result.ok) return

    if (result.interviewComplete && continueCount < 2) {
      setCompletionType('standard_sufficient')
      setShowComplete(true)
    }
  }

  /**
   * ハル限定: 画像をアップロードして添付候補に追加する。
   * Supabase Storage の interview-attachments バケットに保存し、送信時にメッセージと一緒にAPIに送る。
   */
  async function handleAttachmentUpload(file: File) {
    if (loading || uploadingAttachment) return
    if (pendingAttachments.length >= 4) {
      setSubmitError('画像は1メッセージあたり4枚までです。')
      return
    }
    if (!file.type.startsWith('image/')) {
      setSubmitError('画像ファイルを選んでください。')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('画像は 5MB 以下にしてください。')
      return
    }
    setUploadingAttachment(true)
    setSubmitError(null)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 5)
      const uid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const path = `${projectId}/${interviewId}/${uid}.${ext}`
      const { error } = await supabaseRef.current.storage
        .from('interview-attachments')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (error) {
        setSubmitError('画像のアップロードに失敗しました。もう一度お試しください。')
        console.error('[interview] upload failed', error)
        return
      }
      const previewUrl = URL.createObjectURL(file)
      setPendingAttachments((prev) => [...prev, { path, contentType: file.type, previewUrl }])
    } finally {
      setUploadingAttachment(false)
    }
  }

  /**
   * ハル限定: 「写真なしで進める」を押したら、AI に記憶ベースの取材へ切り替えるよう指示。
   * 一度押したらボタンを隠す（state で管理）。
   */
  async function handleSkipPhoto() {
    if (loading || hasReachedTurnLimit) return
    setPhotoSkipped(true)
    const result = await sendMessageToAI(SKIP_PHOTO_TOKEN, { alreadyDisplayed: true })
    if (!result.ok) {
      // 失敗したら再表示できるよう state を戻す
      setPhotoSkipped(false)
      return
    }
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function removePendingAttachment(index: number) {
    setPendingAttachments((prev) => {
      const next = [...prev]
      const removed = next.splice(index, 1)
      removed.forEach((a) => URL.revokeObjectURL(a.previewUrl))
      return next
    })
  }

  /**
   * 「もう少し聞かせてください」: ユーザー側から AI に深掘りを促す。
   * 直前のインタビュアー発話には触らず、新しい問いを別角度で立て直してもらう。
   */
  async function handleDeepDive() {
    if (loading) return
    if (hasReachedTurnLimit) {
      setShowComplete(true)
      return
    }
    const result = await sendMessageToAI(DEEP_DIVE_TOKEN, { alreadyDisplayed: true })
    if (!result.ok) return
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function handleFinish() {
    flushSync(() => setFinishing(true))
    router.push(`/projects/${projectId}/summary?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}`)
  }

  async function handleContinue() {
    if (hasReachedTurnLimit) return
    setContinueCount((c) => c + 1)
    setShowComplete(false)

    // 直前のまとめ提案メッセージを履歴から取り消す（インタビュアーの返答末尾に[INTERVIEW_COMPLETE]が付いていた発話）
    setMessages((prev) => {
      const last = [...prev].reverse().findIndex((m) => m.role === 'interviewer')
      if (last === -1) return prev
      const idx = prev.length - 1 - last
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
    })

    // AIキャストに「続行を選んだので別角度から1問」を送って、新しい質問を引き出す
    await sendMessageToAI(CONTINUE_INTERVIEW_TOKEN, { alreadyDisplayed: true })
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function handleManualFinish() {
    setCompletionType('manual')
    setShowComplete(true)
  }

  function handleAbort() {
    setShowComplete(false)
    router.push(backHref)
  }

  // モーダルフォーカストラップ
  useEffect(() => {
    if (!showComplete) return
    if (!modalRef.current) return
    const modalEl: HTMLDivElement = modalRef.current
    const el = modalEl.querySelector<HTMLElement>('button,[tabindex]:not([tabindex="-1"])')
    el?.focus()
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = Array.from(modalEl.querySelectorAll<HTMLElement>('button:not([disabled]),[tabindex]:not([tabindex="-1"])'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showComplete])

  const char = getCharacter(characterId)
  const hasReachedTurnLimit = userTurns >= MAX_TURNS
  const supportPostCount = supportPosts.ownPosts.length + supportPosts.competitorPosts.length
  const showSupportPanel = supportPosts.loading || !!supportPosts.error || supportPostCount > 0

  useEffect(() => {
    if (!initializing && hasReachedTurnLimit) {
      setCompletionType('hard_limit')
      setShowComplete(true)
    }
  }, [hasReachedTurnLimit, initializing])

  return (
    <div className="bg-[var(--bg)] h-dvh flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] h-16 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="rounded-[var(--r-sm)] min-h-[44px] min-w-[44px] px-2 sm:px-3 text-sm text-[var(--text3)] transition-colors hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          {backLabel}
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CharacterAvatar
            src={char?.icon48}
            alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
            emoji={char?.emoji}
            size={40}
            className="border-2 border-[var(--accent)] flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="font-serif font-bold text-[var(--text)] text-sm truncate">{char?.name}</p>
            <p className="text-xs text-[var(--teal)] hidden md:block">{char?.specialty}</p>
            {focusThemeLabel && (
              <p className="mt-0.5 text-xs text-[var(--text3)] hidden md:block">{focusThemeLabel}</p>
            )}
          </div>
        </div>
        {/* 参考記事ボタン */}
        {showSupportPanel && (
          <div className="flex items-center flex-shrink-0">
            {supportPosts.loading ? (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2 py-1 text-xs text-[var(--text3)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="hidden sm:inline">確認中</span>
              </span>
            ) : (supportPostCount > 0 || supportPosts.error) ? (
              <button
                type="button"
                onClick={() => setIsSupportPanelOpen((prev) => !prev)}
                aria-expanded={isSupportPanelOpen}
                aria-controls="support-posts-panel"
                className={`flex items-center gap-1.5 rounded-full border px-2 sm:px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer ${
                  isSupportPanelOpen
                    ? 'border-[var(--accent)] bg-[var(--accent-l)] text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)] hover:bg-white'
                }`}
              >
                <span className="sm:hidden">記事</span>
                <span className="hidden sm:inline">参考記事</span>
                {supportPostCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                    {supportPostCount}
                  </span>
                )}
              </button>
            ) : null}
          </div>
        )}
        {/* モバイル: アイコンのみ表示 */}
        <button
          type="button"
          onClick={handleManualFinish}
          aria-label="インタビューを終わらせる"
          className="md:hidden bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          </svg>
        </button>
        {/* PC: テキストボタン */}
        <button
          type="button"
          onClick={handleManualFinish}
          className="hidden md:block bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] px-3 py-1.5 text-sm font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer flex-shrink-0"
        >
          インタビューを終わらせる
        </button>
      </header>

      {/* 進捗バー */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-3 sm:px-6 py-2 sm:py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text3)]">{getProgressLabel(userTurns)}</span>
            <span className="text-xs text-[var(--text3)]">{userTurns <= STANDARD_TURNS ? `${userTurns}/${STANDARD_TURNS}` : `${userTurns}/${MAX_TURNS}`}</span>
          </div>
          <div
            role="progressbar"
            aria-label="インタビューの進行状況"
            aria-valuenow={userTurns}
            aria-valuemin={0}
            aria-valuemax={userTurns <= STANDARD_TURNS ? STANDARD_TURNS : MAX_TURNS}
            className="bg-[var(--border)] h-1 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
              style={{ width: `${Math.min((userTurns / STANDARD_TURNS) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 会話ログ */}
      {/* tabIndex={0}: キーボードユーザーがスクロールコンテナにフォーカスしてキーで読み進められるよう WCAG 2.1 AA 準拠 */}
      <div role="log" aria-label="インタビューの会話" aria-live="polite" tabIndex={0} className="flex-1 overflow-y-auto px-3 py-4 sm:px-7 flex flex-col gap-4 max-w-2xl w-full mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
        {messages.map((msg, i) => {
          const isLatestInterviewer = msg.role === 'interviewer' && i === messages.length - 1
          const showYesNoButtons =
            isLatestInterviewer &&
            msg.yesno === true &&
            !loading &&
            !streamingMessage &&
            !hasReachedTurnLimit
          return (
            <React.Fragment key={`${msg.role}-${i}`}>
              <div className={`flex gap-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'interviewer' && (
                  <CharacterAvatar
                    src={char?.icon48}
                    alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                    emoji={char?.emoji}
                    size={32}
                    className="-mt-2 flex-shrink-0 border-[var(--border)] bg-[var(--accent-l)]"
                  />
                )}
                <div className={`max-w-[80%] sm:max-w-[60%] px-3 py-2 text-sm sm:text-[15px] whitespace-pre-wrap break-words leading-[1.85] ${
                  msg.role === 'interviewer'
                    ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-2xl rounded-tl-sm'
                    : 'bg-[var(--accent)] text-white rounded-2xl rounded-tr-sm'
                }`}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {msg.attachments.map((att, j) => (
                        <Image
                          key={`${i}-${j}`}
                          src={att.previewUrl}
                          alt={`添付 ${j + 1}`}
                          width={140}
                          height={140}
                          unoptimized
                          className="max-h-36 max-w-[180px] rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {msg.content || <span className="opacity-50">...</span>}
                </div>
              </div>
              {/* モグロ用 はい/いいえ ボタン（最新の interviewer 発話に [YESNO_QUESTION] が付いていた時だけ） */}
              {showYesNoButtons && (
                <div className="flex gap-2 pl-10">
                  <button
                    type="button"
                    onClick={() => void sendMessageToAI('はい')}
                    disabled={loading}
                    className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-full px-5 py-2 text-sm font-semibold min-h-[40px] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors"
                  >
                    はい
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendMessageToAI('いいえ')}
                    disabled={loading}
                    className="border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg2)] rounded-full px-5 py-2 text-sm font-semibold min-h-[40px] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors"
                  >
                    いいえ
                  </button>
                </div>
              )}
            </React.Fragment>
          )
        })}
        {(loading || streamingMessage) && (
          <div className="flex gap-1">
            <CharacterAvatar
              src={char?.icon48}
              alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
              emoji={char?.emoji}
              size={32}
              className="-mt-2 flex-shrink-0 border-[var(--border)] bg-[var(--accent-l)]"
            />
            <div className="bg-[var(--surface)] border border-[var(--border)] px-3 py-1 rounded-2xl rounded-tl-sm">
              {streamingMessage ? (
                <span className="text-[var(--text2)] text-[15px] whitespace-pre-wrap leading-[1.85]">
                  {streamingMessage}
                </span>
              ) : (
                <span className="ic-typing-dots">
                  <span className="ic-typing-dot" />
                  <span className="ic-typing-dot" />
                  <span className="ic-typing-dot" />
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-[var(--surface)] border-t border-[var(--border)] px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        {submitError && (
          <div role="alert" className="max-w-2xl mx-auto mb-3">
            <InterviewerSpeech
              icon={(
                <CharacterAvatar
                  src={char?.icon48}
                  alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                  emoji={char?.emoji}
                  size={44}
                />
              )}
              name={char?.name ?? 'インタビュアー'}
              title="返事が少し途切れてしまいました。"
              description={submitError}
              tone="soft"
            />
          </div>
        )}
        <div className="max-w-2xl mx-auto">
          {/* ハル限定: 添付プレビュー */}
          {characterId === 'hal' && pendingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingAttachments.map((att, idx) => (
                <div key={att.path} className="relative">
                  <Image
                    src={att.previewUrl}
                    alt={`添付 ${idx + 1}`}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded-md object-cover border border-[var(--border)]"
                  />
                  <button
                    type="button"
                    onClick={() => removePendingAttachment(idx)}
                    aria-label="この画像を削除"
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[var(--err)] text-white text-[10px] flex items-center justify-center hover:bg-[var(--err-h,var(--err))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--text3)] hidden sm:block">答えづらければパスできます。気になる話があれば「もう少し聞いてもらう」を押してください。</p>
            <p className="text-xs text-[var(--text3)] sm:hidden">パス・もう少し聞くもできます。</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {characterId === 'hal' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleAttachmentUpload(file)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || initializing || hasReachedTurnLimit || uploadingAttachment || pendingAttachments.length >= 4}
                    className="border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] rounded-[var(--r-sm)] px-3 sm:px-4 py-2 sm:py-3 text-xs min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
                    aria-label="写真を添付"
                  >
                    {uploadingAttachment ? 'アップ中...' : '📷 写真を添付'}
                  </button>
                  {/* 「写真なしで進める」ボタン: 取材序盤かつ画像が一度も送られていない時だけ出す */}
                  {!photoSkipped && userTurns < 2 && pendingAttachments.length === 0 && !messages.some((m) => m.attachments && m.attachments.length > 0) && (
                    <button
                      type="button"
                      onClick={handleSkipPhoto}
                      disabled={loading || initializing || hasReachedTurnLimit}
                      className="border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] rounded-[var(--r-sm)] px-3 sm:px-4 py-2 sm:py-3 text-xs min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
                    >
                      写真なしで進める
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={handleDeepDive}
                disabled={loading || initializing || hasReachedTurnLimit || messages.length === 0}
                className="border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] rounded-[var(--r-sm)] px-3 sm:px-4 py-2 sm:py-3 text-xs min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
              >
                もう少し聞いてもらう
              </button>
              <button
                type="button"
                onClick={handlePassQuestion}
                disabled={loading || initializing || hasReachedTurnLimit}
                className="border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] rounded-[var(--r-sm)] px-3 sm:px-4 py-2 sm:py-3 text-xs min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
              >
                この質問はパス
              </button>
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void submitMessage() }} className="flex gap-2 sm:gap-3 items-end">
            <textarea
              aria-label="インタビューへの回答を入力"
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  void submitMessage()
                }
              }}
              placeholder={hasReachedTurnLimit ? '取材はここまでです。ここまでの内容を記事にまとめられます。' : 'ここに話しかけてください'}
              disabled={loading || initializing || hasReachedTurnLimit}
              autoFocus
              className="flex-1 bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--r-lg)] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:outline-none text-[var(--text)] px-3 sm:px-4 py-3 text-sm resize-none leading-relaxed disabled:opacity-50 min-h-[56px] max-h-[200px] overflow-y-auto"
            />
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <DevAiLabel>AI送信</DevAiLabel>
              <button
                type="submit"
                disabled={loading || initializing || !input.trim() || hasReachedTurnLimit}
                className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-4 sm:px-5 py-3 min-h-[44px] min-w-[56px] sm:min-w-0 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors"
              >
                {loading ? '送信中...' : '送信'}
              </button>
              <p className="text-[10px] text-[var(--text3)] hidden sm:block">Ctrl+Enter</p>
            </div>
          </form>
        </div>
      </div>

      {/* 参考記事パネル — fixed */}
      {isSupportPanelOpen && !supportPosts.loading && (
        <div id="support-posts-panel" className="fixed left-4 right-4 top-[68px] z-30 max-h-[60vh] overflow-y-auto rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-lg md:left-auto md:w-80">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-[var(--text2)]">この質問に近い記事</p>
              <button
                type="button"
                onClick={() => setIsSupportPanelOpen(false)}
                className="rounded-[var(--r-sm)] px-2 py-1 text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                閉じる
              </button>
            </div>
            {supportPosts.error && (
              <p className="text-xs text-[var(--text3)]">{supportPosts.error}</p>
            )}
            {supportPosts.ownPosts.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">自社HP</p>
                <div className="space-y-2">
                  {supportPosts.ownPosts.map((post) => (
                    <a key={post.url} href={post.url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2.5 transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                      <p className="text-xs font-medium text-[var(--text)]">{post.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--text2)]">{post.summary}</p>
                      <p className="mt-1 truncate text-[11px] text-[var(--text3)]">{post.url}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {supportPosts.competitorPosts.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">競合</p>
                <div className="space-y-2">
                  {supportPosts.competitorPosts.map((post) => (
                    <a key={post.url} href={post.url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2.5 transition-colors hover:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                      <p className="text-xs font-medium text-[var(--text)]">{post.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--text2)]">{post.summary}</p>
                      <p className="mt-1 truncate text-[11px] text-[var(--text3)]">{post.url}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 完了確認モーダル */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="取材まとめの確認"
            tabIndex={-1}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-6 max-w-sm w-full shadow-[0_24px_64px_rgba(0,0,0,0.12)] focus-visible:outline-none"
          >
            <div className="flex justify-center mb-4">
              <CharacterAvatar
                src={char?.icon96}
                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                emoji={char?.emoji}
                size={72}
                className="border-2 border-[var(--accent)]"
              />
            </div>
            {completionType === 'hard_limit' && (
              <>
                <p className="text-[var(--text)] font-semibold text-center mb-2">上限の{MAX_TURNS}回まで質問しました。</p>
                <p className="text-sm text-[var(--text2)] text-center mb-6">ここまでの内容を記事の素材にまとめます。</p>
                <div className="space-y-2">
                  <DevAiLabel className="justify-center mb-1 text-xs opacity-60">まとめ生成</DevAiLabel>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full py-3 bg-[var(--accent)] text-white rounded-[var(--r-sm)] text-sm font-semibold hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {finishing ? 'まとめています...' : '記事にまとめる'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    disabled={finishing}
                    className="w-full py-2 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    まとめずに中断する
                  </button>
                </div>
              </>
            )}
            {completionType === 'standard_sufficient' && (
              <>
                <p className="text-[var(--text)] font-semibold text-center mb-2">いいお話がたくさん聞けました。</p>
                <p className="text-sm text-[var(--text2)] text-center mb-6">十分な内容が集まりました。このまままとめてもいいですか？</p>
                <div className="space-y-2">
                  <DevAiLabel className="justify-center mb-1 text-xs opacity-60">まとめ生成</DevAiLabel>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full py-3 bg-[var(--accent)] text-white rounded-[var(--r-sm)] text-sm font-semibold hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {finishing ? 'まとめています...' : 'はい、まとめてください'}
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={finishing}
                    className="w-full py-2 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    もう少し話す
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    disabled={finishing}
                    className="w-full py-2 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    まとめずに中断する
                  </button>
                </div>
              </>
            )}
            {completionType === 'standard_need_more' && (
              <>
                <p className="text-[var(--text)] font-semibold text-center mb-2">もう少し話を聞かせてもらえますか？</p>
                <p className="text-sm text-[var(--text2)] text-center mb-6">もう少し掘り下げると、さらに深い内容が引き出せるかもしれません。</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full py-3 bg-[var(--accent)] text-white rounded-[var(--r-sm)] text-sm font-semibold hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors"
                  >
                    もう少し話す
                  </button>
                  <DevAiLabel className="justify-center mt-1 text-xs opacity-60">まとめ生成</DevAiLabel>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full py-2 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {finishing ? 'まとめています...' : 'ここまでの内容でまとめる'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    disabled={finishing}
                    className="w-full py-2 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    まとめずに中断する
                  </button>
                </div>
              </>
            )}
            {completionType === 'manual' && (
              <>
                <p className="text-[var(--text)] font-semibold text-center mb-2">取材をまとめますか？</p>
                <p className="text-sm text-[var(--text2)] text-center mb-6">ここまでの内容を記事の素材にまとめることができます。</p>
                <div className="space-y-2">
                  <DevAiLabel className="justify-center mb-1 text-xs opacity-60">まとめ生成</DevAiLabel>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full py-3 bg-[var(--accent)] text-white rounded-[var(--r-sm)] text-sm font-semibold hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {finishing ? 'まとめています...' : 'はい、まとめてください'}
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={finishing}
                    className="w-full py-2 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    まだ話す
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    disabled={finishing}
                    className="w-full py-2 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    まとめずに中断する
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
