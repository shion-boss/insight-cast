'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { getCharacter } from '@/lib/characters'
import { getInterviewFocusThemeLabel } from '@/lib/interview-focus-theme'
import { CharacterAvatar, DevAiLabel } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { InterviewProgressBar } from '@/components/interview/ProgressBar'
import { InterviewMessageList } from '@/components/interview/MessageList'
import { InterviewInputArea } from '@/components/interview/InputArea'
import type { AttachmentRef, InterviewMessage } from '@/components/interview/types'
import {
  hasInterviewCompleteMarker,
  hasYesnoMarker,
  stripInterviewMarkers,
  stripPostCompletionSummary,
} from '@/lib/interview-markers'

type Message = InterviewMessage
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
  const backLabel = from === 'dashboard' ? 'ダッシュボード' : 'プロジェクトの管理'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [characterId, setCharacterId] = useState('mint')
  const [initializing, setInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [userTurns, setUserTurns] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [completionType, setCompletionType] = useState<'standard_sufficient' | 'standard_need_more' | 'hard_limit' | 'manual'>('manual')
  const [continueCount, setContinueCount] = useState(0)
  // パス連発防止: 連続2回まで（API コスト保護）
  const [passStreak, setPassStreak] = useState(0)
  const PASS_STREAK_LIMIT = 2
  const [streamingMessage, setStreamingMessage] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [focusThemeLabel, setFocusThemeLabel] = useState<string | null>('テーマ: お任せ')
  // ハル限定: アップロード予定の画像（送信前にプレビューで保持）
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentRef[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
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
  const initializedRef = useRef(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streamingMessage ? 'instant' : 'smooth' })
  }, [messages, loading, streamingMessage])

  const sendMessageToAI = useCallback(async (userText: string | null, opts?: { alreadyDisplayed?: boolean; attachments?: AttachmentRef[] }) => {
    setSubmitError(null)
    setLoading(true)
    setStreamingMessage('')

    const hasAttachments = (opts?.attachments?.length ?? 0) > 0
    const shouldAppendUser = !opts?.alreadyDisplayed && (Boolean(userText) || hasAttachments)

    if (shouldAppendUser) {
      setMessages((prev) => [...prev, { role: 'user', content: userText ?? '', attachments: opts?.attachments }])
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
        if (res.status === 429) throw new Error('PASS_LIMIT')
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
        setStreamingMessage(stripInterviewMarkers(text))
      }

      const interviewComplete = hasInterviewCompleteMarker(text)
      const yesnoActive = hasYesnoMarker(text)
      const stripped = stripInterviewMarkers(text)
      // AI が [INTERVIEW_COMPLETE] と一緒にまとめ本文まで書いてしまった場合は --- 以降を切る
      const finalText = interviewComplete ? stripPostCompletionSummary(stripped) : stripped
      if (finalText) {
        setMessages((prev) => [...prev, { role: 'interviewer', content: finalText, yesno: yesnoActive }])
      }
      setStreamingMessage('')
      return { ok: true as const, interviewComplete }
    } catch (err) {
      const isPassLimit = err instanceof Error && err.message === 'PASS_LIMIT'
      if (shouldAppendUser) {
        setMessages((prev) => prev.slice(0, -1))
        setUserTurns((t) => Math.max(0, t - 1))
      }
      if (userText && !opts?.alreadyDisplayed) {
        setInput(userText)
      }
      setStreamingMessage('')
      if (isPassLimit) {
        setPassStreak(PASS_STREAK_LIMIT)
        setSubmitError(`パスは${PASS_STREAK_LIMIT}回までです。何か一言でもいいので答えてみてください。`)
      } else {
        setSubmitError('うまくお返事を受け取れませんでした。少し待ってから、もう一度送信してください。')
      }
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

        const { data: rawHistory } = await supabase
          .from('interview_messages')
          .select('role, content, meta')
          .eq('interview_id', interviewId)
          .order('created_at', { ascending: true })

        // パス済み（meta.passed === true）はユーザーに見せない
        const history = (rawHistory ?? []).filter((m) => {
          const meta = (m as { meta?: { passed?: boolean } | null }).meta
          return !(meta && meta.passed === true)
        })

        // 再開時のパスストリーク復元: rawHistory の interviewer 数 - user 数 - 1（アクティブ質問の分）
        const ivCount = (rawHistory ?? []).filter((m) => m.role !== 'user').length
        const usrCount = (rawHistory ?? []).filter((m) => m.role === 'user').length
        setPassStreak(Math.max(0, Math.min(PASS_STREAK_LIMIT, ivCount - usrCount - 1)))

        if (history && history.length > 0) {
          // meta から yesno フラグ + 添付パスを Message 型に展開
          type MessageMeta = {
            yesno?: { active?: boolean }
            attachments?: Array<{ path?: string; content_type?: string }>
          }
          // 添付ありメッセージの path を収集
          const allPaths: string[] = []
          const enriched: Message[] = history.map((m) => {
            const meta = (m as { meta?: MessageMeta | null }).meta ?? null
            const rawAttachments = Array.isArray(meta?.attachments) ? meta!.attachments : []
            const attachments: AttachmentRef[] = rawAttachments
              .filter((a): a is { path: string; content_type: string } =>
                typeof a?.path === 'string' && typeof a?.content_type === 'string',
              )
              .map((a) => {
                allPaths.push(a.path)
                return { path: a.path, contentType: a.content_type, previewUrl: '' }
              })
            // 古い実装で cleanText が失敗してマーカーが content に残っているメッセージや、
            // [INTERVIEW_COMPLETE] と同時に「---」区切りのまとめ本文まで保存されている
            // メッセージは、クライアント側で表示用に整える。
            const rawContent = m.content ?? ''
            return {
              role: m.role as 'user' | 'interviewer',
              content: stripPostCompletionSummary(stripInterviewMarkers(rawContent)),
              yesno: meta?.yesno?.active === true || hasYesnoMarker(rawContent),
              attachments: attachments.length > 0 ? attachments : undefined,
            }
          })

          // 添付があれば一括で署名URLを取得
          if (allPaths.length > 0) {
            try {
              const params = new URLSearchParams({ paths: allPaths.join(',') })
              const res = await fetch(
                `/api/projects/${projectId}/interviews/${interviewId}/attach?${params.toString()}`,
              )
              if (res.ok) {
                const { urls } = (await res.json()) as { urls: Record<string, string> }
                for (const m of enriched) {
                  if (m.attachments) {
                    for (const a of m.attachments) {
                      if (urls[a.path]) a.previewUrl = urls[a.path]
                    }
                  }
                }
              }
            } catch (err) {
              console.warn('[interview] failed to load signed urls', err)
            }
          }

          setMessages(enriched)
          setUserTurns(enriched.filter(m => m.role === 'user').length)
        } else {
          const result = await sendMessageToAI(null)
          if (!result.ok) {
            setInitError('取材を始められませんでした。回線が一時的に不安定だった可能性があります。')
          }
        }
      } catch {
        setInitError('取材画面を開けませんでした。回線が一時的に不安定だった可能性があります。')
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [interviewId, projectId, sendMessageToAI])

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
    // 写真だけのときはテキストを空文字で送る。サーバー側で AI への文脈用に補完される。
    // ユーザーバブルでも text は空のまま表示し、画像だけが見える形にする。
    const text = input.trim()
    setInput('')

    const newTurns = userTurns + 1
    const attachmentsToSend = pendingAttachments
    setPendingAttachments([])

    const result = await sendMessageToAI(text, { attachments: attachmentsToSend })
    if (!result.ok) return
    // 回答できたのでパス連発カウントをリセット
    setPassStreak(0)

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
    if (passStreak >= PASS_STREAK_LIMIT) return

    // 直前のインタビュアーの質問を履歴から取り消す
    setMessages((prev) => {
      const last = [...prev].reverse().findIndex((m) => m.role === 'interviewer')
      if (last === -1) return prev
      const idx = prev.length - 1 - last
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
    })

    const result = await sendMessageToAI(PASS_QUESTION_TOKEN, { alreadyDisplayed: true })
    if (!result.ok) return
    setPassStreak((n) => n + 1)

    if (result.interviewComplete && continueCount < 2) {
      setCompletionType('standard_sufficient')
      setShowComplete(true)
    }
  }

  /**
   * モグロ等の はい/いいえ ボタン押下。
   * 送信ボタンと同じ後処理（パスストリークリセット、ターン上限・完了判定）を踏む。
   */
  async function handleYesNo(answer: 'はい' | 'いいえ') {
    if (loading || hasReachedTurnLimit) return

    const newTurns = userTurns + 1
    const result = await sendMessageToAI(answer)
    if (!result.ok) return
    setPassStreak(0)

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

  /**
   * ハル限定: 画像をアップロードして添付候補に追加する。
   * サーバー API（/api/projects/[id]/interviews/[interviewId]/attach）経由でアップロードする。
   * これにより Storage RLS の罠を避け、サーバー側で admin client を使って確実に保存できる。
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
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/projects/${projectId}/interviews/${interviewId}/attach`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = typeof body?.message === 'string'
          ? body.message
          : '画像のアップロードに失敗しました。もう一度お試しください。'
        setSubmitError(msg)
        console.error('[interview] upload failed', { status: res.status, body })
        return
      }
      const data = await res.json() as { path: string; contentType: string }
      const previewUrl = URL.createObjectURL(file)
      setPendingAttachments((prev) => [...prev, { path: data.path, contentType: data.contentType, previewUrl }])
    } catch (err) {
      console.error('[interview] upload error', err)
      setSubmitError('画像のアップロードに失敗しました。もう一度お試しください。')
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

  // 取材画面では AppShell のグローバルヘッダーと <main> padding を CSS で無効化し、
  // この画面が viewport ぴったりに収まる「フルスクリーンツールページ」として振る舞う。
  // body クラス制御は globals.css の body.is-tool-fullscreen ルールと対になっている。
  useEffect(() => {
    document.body.classList.add('is-tool-fullscreen')
    return () => {
      document.body.classList.remove('is-tool-fullscreen')
    }
  }, [])

  if (initError) {
    return (
      <div className="bg-[var(--bg)] min-h-[100dvh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--elevation-2)]">
          <div className="flex items-start gap-3">
            <CharacterAvatar
              src={char?.icon48}
              alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
              emoji={char?.emoji}
              size={48}
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-serif font-bold text-[var(--text)] text-base">{char?.name ?? 'インタビュアー'}</p>
              <p className="mt-2 text-base leading-[1.7] text-[var(--text2)]">{initError}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-2.5 text-base text-[var(--text2)] hover:text-[var(--text)] transition-colors cursor-pointer min-h-[44px]"
            >
              {backLabel}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-[var(--r-sm)] bg-[var(--accent)] text-[var(--on-primary)] px-4 py-2.5 text-base font-semibold transition-colors hover:opacity-90 cursor-pointer min-h-[44px]"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg)] h-[100dvh] flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] flex-shrink-0">
        <div className="mx-auto h-16 flex items-center max-w-6xl px-4 sm:px-6 gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          aria-label={backLabel}
          className="rounded-[var(--r-sm)] min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-2 sm:px-3 text-base text-[var(--text2)] transition-colors hover:text-[var(--text2)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="hidden sm:inline">{backLabel}</span>
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
            <p className="font-serif font-bold text-[var(--text)] text-base truncate">{char?.name}</p>
            <p className="text-[13px] text-[var(--teal)] hidden md:block">{char?.specialty}</p>
            {focusThemeLabel && (
              <p className="mt-0.5 text-[13px] text-[var(--text2)] hidden md:block">{focusThemeLabel}</p>
            )}
          </div>
        </div>
        {/* 参考記事ボタン */}
        {showSupportPanel && (
          <div className="flex items-center flex-shrink-0">
            {supportPosts.loading ? (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2 py-1 text-[13px] text-[var(--text2)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="hidden sm:inline">確認中</span>
              </span>
            ) : (supportPostCount > 0 || supportPosts.error) ? (
              <button
                type="button"
                onClick={() => setIsSupportPanelOpen((prev) => !prev)}
                aria-expanded={isSupportPanelOpen}
                aria-controls="support-posts-panel"
                className={`flex items-center gap-1.5 rounded-full border px-2 sm:px-3 py-1 text-[13px] font-medium transition-colors cursor-pointer ${
                  isSupportPanelOpen
                    ? 'border-[var(--accent)] bg-[var(--accent-l)] text-[var(--on-primary-container)]'
                    : 'border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)] hover:bg-white'
                }`}
              >
                <span className="sm:hidden">記事</span>
                <span className="hidden sm:inline">参考記事</span>
                {supportPostCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white">
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
          className="md:hidden bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors hover:opacity-90 cursor-pointer flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {/* PC: テキストボタン */}
        <button
          type="button"
          onClick={handleManualFinish}
          className="hidden md:block bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] px-3 py-1.5 text-base font-semibold transition-colors hover:opacity-90 cursor-pointer flex-shrink-0"
        >
          インタビューを終わらせる
        </button>
        </div>
      </header>

      <InterviewProgressBar
        userTurns={userTurns}
        standardTurns={STANDARD_TURNS}
        label={getProgressLabel(userTurns)}
      />

      <InterviewMessageList
        messages={messages}
        loading={loading}
        streamingMessage={streamingMessage}
        characterName={char?.name}
        characterIcon48={char?.icon48}
        characterEmoji={char?.emoji}
        onYesNo={(answer) => void handleYesNo(answer)}
        hasReachedTurnLimit={hasReachedTurnLimit}
        bottomRef={bottomRef}
      />

      <InterviewInputArea
        characterId={characterId}
        characterName={char?.name}
        characterIcon48={char?.icon48}
        characterEmoji={char?.emoji}
        input={input}
        onInputChange={setInput}
        loading={loading}
        initializing={initializing}
        hasReachedTurnLimit={hasReachedTurnLimit}
        passStreak={passStreak}
        passStreakLimit={PASS_STREAK_LIMIT}
        onPassQuestion={handlePassQuestion}
        onDeepDive={handleDeepDive}
        showDeepDive={messages.length > 0}
        pendingAttachments={pendingAttachments}
        uploadingAttachment={uploadingAttachment}
        onAttachmentSelected={characterId === 'hal' ? handleAttachmentUpload : undefined}
        onRemoveAttachment={characterId === 'hal' ? removePendingAttachment : undefined}
        showSkipPhoto={
          characterId === 'hal' &&
          !photoSkipped &&
          userTurns < 2 &&
          pendingAttachments.length === 0 &&
          !messages.some((m) => m.attachments && m.attachments.length > 0)
        }
        onSkipPhoto={handleSkipPhoto}
        submitError={submitError}
        onSubmit={() => void submitMessage()}
        rightSlot={<DevAiLabel>AI送信</DevAiLabel>}
      />

      {/* 参考記事パネル — fixed */}
      {isSupportPanelOpen && !supportPosts.loading && (
        <div id="support-posts-panel" className="fixed left-4 right-4 top-[68px] z-30 max-h-[60vh] overflow-y-auto rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--elevation-3)] md:left-auto md:w-80">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-[var(--text2)]">この質問に近い記事</p>
              <button
                type="button"
                onClick={() => setIsSupportPanelOpen(false)}
                className="rounded-[var(--r-sm)] px-2 py-1 text-[13px] text-[var(--text2)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
            {supportPosts.error && (
              <p className="text-[13px] text-[var(--text2)]">{supportPosts.error}</p>
            )}
            {supportPosts.ownPosts.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--on-primary-container)]">自社HP</p>
                <div className="space-y-2">
                  {supportPosts.ownPosts.map((post) => (
                    <a key={post.url} href={post.url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2.5 transition-colors hover:border-[var(--accent)]">
                      <p className="text-[13px] font-medium text-[var(--text)]">{post.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text2)]">{post.summary}</p>
                      <p className="mt-1 truncate text-[11px] text-[var(--text2)]">{post.url}</p>
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
                      className="block rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2.5 transition-colors hover:border-[var(--teal)]">
                      <p className="text-[13px] font-medium text-[var(--text)]">{post.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text2)]">{post.summary}</p>
                      <p className="mt-1 truncate text-[11px] text-[var(--text2)]">{post.url}</p>
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
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-6 max-w-sm w-full shadow-[var(--elevation-5)] focus-visible:outline-none"
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
                <p className="text-base text-[var(--text2)] text-center mb-6">ここまでの内容を記事の素材にまとめます。</p>
                <div className="space-y-2">
                  <DevAiLabel className="justify-center mb-1 text-[13px] opacity-60">まとめ生成</DevAiLabel>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full py-3 bg-[var(--accent)] text-white rounded-full text-base font-semibold hover:bg-[var(--accent-h)] cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {finishing ? 'まとめています...' : '記事にまとめる'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    disabled={finishing}
                    className="w-full py-2 text-base text-[var(--text2)] hover:text-[var(--text2)] rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    まとめずに中断する
                  </button>
                </div>
              </>
            )}
            {completionType === 'standard_sufficient' && (
              <>
                <p className="text-[var(--text)] font-semibold text-center mb-2">いいお話がたくさん聞けました。</p>
                <p className="text-base text-[var(--text2)] text-center mb-6">十分な内容が集まりました。このまままとめてもいいですか？</p>
                <div className="space-y-2">
                  <DevAiLabel className="justify-center mb-1 text-[13px] opacity-60">まとめ生成</DevAiLabel>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full py-3 bg-[var(--accent)] text-white rounded-full text-base font-semibold hover:bg-[var(--accent-h)] cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {finishing ? 'まとめています...' : 'はい、まとめてください'}
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={finishing}
                    className="w-full py-2 text-base text-[var(--text2)] hover:text-[var(--text2)] rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    もう少し話す
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    disabled={finishing}
                    className="w-full py-2 text-base text-[var(--text2)] hover:text-[var(--text2)] rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    まとめずに中断する
                  </button>
                </div>
              </>
            )}
            {completionType === 'standard_need_more' && (
              <>
                <p className="text-[var(--text)] font-semibold text-center mb-2">もう少し話を聞かせてもらえますか？</p>
                <p className="text-base text-[var(--text2)] text-center mb-6">もう少し掘り下げると、さらに深い内容が引き出せるかもしれません。</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full py-3 bg-[var(--accent)] text-white rounded-full text-base font-semibold hover:bg-[var(--accent-h)] cursor-pointer transition-colors"
                  >
                    もう少し話す
                  </button>
                  <DevAiLabel className="justify-center mt-1 text-[13px] opacity-60">まとめ生成</DevAiLabel>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full py-2 text-base text-[var(--text2)] hover:text-[var(--text2)] rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {finishing ? 'まとめています...' : 'ここまでの内容でまとめる'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    disabled={finishing}
                    className="w-full py-2 text-base text-[var(--text2)] hover:text-[var(--text2)] rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    まとめずに中断する
                  </button>
                </div>
              </>
            )}
            {completionType === 'manual' && (
              <>
                <p className="text-[var(--text)] font-semibold text-center mb-2">取材をまとめますか？</p>
                <p className="text-base text-[var(--text2)] text-center mb-6">ここまでの内容を記事の素材にまとめることができます。</p>
                <div className="space-y-2">
                  <DevAiLabel className="justify-center mb-1 text-[13px] opacity-60">まとめ生成</DevAiLabel>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full py-3 bg-[var(--accent)] text-white rounded-full text-base font-semibold hover:bg-[var(--accent-h)] cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {finishing ? 'まとめています...' : 'はい、まとめてください'}
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={finishing}
                    className="w-full py-2 text-base text-[var(--text2)] hover:text-[var(--text2)] rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    まだ話す
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    disabled={finishing}
                    className="w-full py-2 text-base text-[var(--text2)] hover:text-[var(--text2)] rounded-[var(--r-sm)] cursor-pointer transition-colors disabled:opacity-50"
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
