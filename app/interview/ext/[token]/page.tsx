'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getCharacter, getCharacterIntro } from '@/lib/characters'
import { CharacterAvatar } from '@/components/ui'
import { InterviewProgressBar } from '@/components/interview/ProgressBar'
import { InterviewMessageList } from '@/components/interview/MessageList'
import { InterviewInputArea } from '@/components/interview/InputArea'
import type { AttachmentRef, InterviewMessage } from '@/components/interview/types'

type LinkInfo = {
  valid: boolean
  interviewerType?: string
  theme?: string
  targetName?: string
  targetIndustry?: string
}

const MAX_TURNS = 15
const STANDARD_TURNS = 7
const PASS_QUESTION_TOKEN = '__PASS_QUESTION__'
const PASS_STREAK_LIMIT = 2

// 取材リンクの進行中インタビューを localStorage に保存しておくためのキー。
// ブラウザを閉じて再オープンした時に続きから再開させる。
const STORAGE_KEY = (token: string) => `insight-cast:interview-link:${token}`

function loadProgress(token: string): { interviewId: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(token))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { interviewId?: unknown }
    if (typeof parsed.interviewId === 'string' && parsed.interviewId.length > 0) {
      return { interviewId: parsed.interviewId }
    }
  } catch {
    // 破損した値は破棄
  }
  return null
}

function saveProgress(token: string, interviewId: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY(token), JSON.stringify({ interviewId }))
  } catch {
    // localStorage が使えない環境は何もしない
  }
}

function clearProgress(token: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY(token))
  } catch {
    // noop
  }
}

function getProgressLabel(turns: number) {
  if (turns < 3) return '話を聞かせてもらっています'
  if (turns < 5) return 'いろいろと教えてもらっています'
  if (turns < STANDARD_TURNS) return 'いい話が集まってきました'
  if (turns < MAX_TURNS) return 'もう少し掘り下げています'
  return 'まとめに入ります'
}

// インタビュー終了確認モーダル（中断 / 完了 の2択）
function FinishInterviewModal({
  finishing,
  onCancel,
  onPause,
  onDone,
}: {
  finishing: boolean
  onCancel: () => void
  onPause: () => void
  onDone: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-interview-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !finishing) onCancel() }}
    >
      <div className="w-full max-w-md rounded-[var(--r-lg)] bg-[var(--surface)] p-6 shadow-[var(--elevation-3)]">
        <h3 id="finish-interview-title" className="text-base font-bold text-[var(--text)] mb-5 text-center">
          インタビューを終わらせますか？
        </h3>

        <div className="space-y-4">
          <div>
            <button
              type="button"
              onClick={onDone}
              disabled={finishing}
              className="w-full min-h-[44px] rounded-full border border-[var(--accent)] bg-[var(--accent)] px-6 py-2 text-base font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity"
            >
              {finishing ? 'まとめ中...' : '完了する'}
            </button>
            <p className="mt-1.5 px-1 text-[13px] text-[var(--text2)] leading-relaxed">
              インタビュアーがメモをまとめます。再開はできません。
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={onPause}
              disabled={finishing}
              className="w-full min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-base font-semibold text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              一時中断する
            </button>
            <p className="mt-1.5 px-1 text-[13px] text-[var(--text2)] leading-relaxed">
              あとからリンクをもう一度開けば、続きから再開できます。
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={finishing}
            className="text-[13px] font-medium text-[var(--text2)] hover:text-[var(--text)] disabled:opacity-50 cursor-pointer transition-colors"
          >
            インタビューに戻る
          </button>
        </div>
      </div>
    </div>
  )
}

type PageProps = { params: Promise<{ token: string }> }

export default function ExternalInterviewPage({ params }: PageProps) {
  const [token, setToken] = useState<string | null>(null)
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null)
  const [validating, setValidating] = useState(true)

  // 画面フェーズ: 'intro' | 'chat' | 'complete'
  const [phase, setPhase] = useState<'intro' | 'chat' | 'complete'>('intro')

  // 会話
  const [messages, setMessages] = useState<InterviewMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [userTurns, setUserTurns] = useState(0)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [completeCalled, setCompleteCalled] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [finishing, setFinishing] = useState(false)
  // 完了画面の種別: 'paused' = 一時中断, 'done' = 完了
  const [completeKind, setCompleteKind] = useState<'paused' | 'done'>('paused')
  // パス連発防止: 連続でパスできるのは2回まで（API コスト保護）
  const [passStreak, setPassStreak] = useState(0)
  // ハル限定: アップロード予定の画像
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentRef[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  const characterId = linkInfo?.interviewerType ?? 'mint'
  const char = getCharacter(characterId)
  const hasReachedTurnLimit = userTurns >= MAX_TURNS

  // params を解決
  useEffect(() => {
    params.then(({ token: t }) => setToken(t))
  }, [params])

  // 自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streamingMessage ? 'instant' : 'smooth' })
  }, [messages, loading, streamingMessage])

  // トークン検証 + 既存進行中インタビューの復元
  useEffect(() => {
    if (!token) return
    let cancelled = false
    void (async () => {
      try {
        const linkRes = await fetch(`/api/interview-links/${token}`)
        const linkData = await linkRes.json() as LinkInfo
        if (cancelled) return
        setLinkInfo(linkData)

        if (linkData.valid) {
          // localStorage の進行中インタビュー id を読んで履歴を取りに行く
          const saved = loadProgress(token)
          if (saved) {
            try {
              const histRes = await fetch(
                `/api/interview-links/${token}/messages?interviewId=${encodeURIComponent(saved.interviewId)}`,
              )
              if (histRes.ok) {
                const histData = await histRes.json() as {
                  interviewId: string
                  messages: Array<{ role: 'user' | 'interviewer'; content: string; meta?: Record<string, unknown> | null }>
                  passStreak?: number
                }
                if (!cancelled && histData.messages && histData.messages.length > 0) {
                  // 添付ありメッセージの path を集めて署名URL一括取得（ハル復元用）
                  type RawMeta = {
                    yesno?: { active?: boolean }
                    attachments?: Array<{ path?: string; content_type?: string }>
                  }
                  const allPaths: string[] = []
                  const enriched: InterviewMessage[] = histData.messages.map((m) => {
                    const meta = (m.meta ?? null) as RawMeta | null
                    const rawAttachments = Array.isArray(meta?.attachments) ? meta!.attachments : []
                    const attachments: AttachmentRef[] = rawAttachments
                      .filter((a): a is { path: string; content_type: string } =>
                        typeof a?.path === 'string' && typeof a?.content_type === 'string',
                      )
                      .map((a) => {
                        allPaths.push(a.path)
                        return { path: a.path, contentType: a.content_type, previewUrl: '' }
                      })
                    return {
                      role: m.role,
                      content: m.content,
                      yesno: meta?.yesno?.active === true,
                      attachments: attachments.length > 0 ? attachments : undefined,
                    }
                  })

                  if (allPaths.length > 0) {
                    try {
                      const sp = new URLSearchParams({
                        interviewId: histData.interviewId,
                        paths: allPaths.join(','),
                      })
                      const urlsRes = await fetch(`/api/interview-links/${token}/attachments?${sp.toString()}`)
                      if (urlsRes.ok) {
                        const { urls } = await urlsRes.json() as { urls: Record<string, string> }
                        for (const m of enriched) {
                          if (m.attachments) {
                            for (const a of m.attachments) {
                              if (urls[a.path]) a.previewUrl = urls[a.path]
                            }
                          }
                        }
                      }
                    } catch {
                      // 署名 URL の取得失敗は致命ではない（プレビューが空のままになるだけ）
                    }
                  }

                  setInterviewId(histData.interviewId)
                  setMessages(enriched)
                  setUserTurns(enriched.filter((m) => m.role === 'user').length)
                  setPassStreak(Math.min(PASS_STREAK_LIMIT, Math.max(0, histData.passStreak ?? 0)))
                  setPhase('chat')
                  initializedRef.current = true
                }
              } else {
                // 復元失敗（履歴 410/404 など）→ 古いキーを掃除
                clearProgress(token)
              }
            } catch {
              clearProgress(token)
            }
          }
        }
      } catch {
        if (!cancelled) setLinkInfo({ valid: false })
      } finally {
        if (!cancelled) setValidating(false)
      }
    })()
    return () => { cancelled = true }
  }, [token])

  const sendMessageToAI = useCallback(async (
    userText: string | null,
    opts?: { alreadyDisplayed?: boolean; attachments?: AttachmentRef[] },
  ) => {
    if (!token || !linkInfo?.valid) return { ok: false as const, interviewComplete: false }

    setSubmitError(null)
    setLoading(true)
    setStreamingMessage('')

    const hasAttachments = (opts?.attachments?.length ?? 0) > 0
    const shouldAppendUser = !opts?.alreadyDisplayed && (Boolean(userText) || hasAttachments)

    if (shouldAppendUser) {
      setMessages((prev) => [...prev, {
        role: 'user',
        content: userText ?? '',
        attachments: opts?.attachments,
      }])
      setUserTurns((t) => t + 1)
    }

    try {
      const res = await fetch(`/api/interview-links/${token}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interviewId ?? undefined,
          userMessage: userText ?? '__GREETING__',
          respondentName: linkInfo.targetName,
          respondentIndustry: linkInfo.targetIndustry,
          attachments: opts?.attachments?.map((a) => ({ path: a.path, contentType: a.contentType })) ?? [],
        }),
      })

      if (!res.ok || !res.body) {
        if (res.status === 429) throw new Error('PASS_LIMIT')
        throw new Error('request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      let firstChunk = true
      let currentInterviewId = interviewId

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)

        // 最初のチャンクに INTERVIEW_ID: が含まれている場合は取り出す
        if (firstChunk && chunk.startsWith('INTERVIEW_ID:')) {
          firstChunk = false
          const newlineIdx = chunk.indexOf('\n')
          if (newlineIdx !== -1) {
            const idLine = chunk.slice('INTERVIEW_ID:'.length, newlineIdx)
            currentInterviewId = idLine.trim()
            setInterviewId(currentInterviewId)
            if (currentInterviewId) saveProgress(token, currentInterviewId)
            const rest = chunk.slice(newlineIdx + 1)
            if (rest) {
              text += rest
              setStreamingMessage(stripMarkers(text))
            }
          }
        } else {
          firstChunk = false
          text += chunk
          setStreamingMessage(stripMarkers(text))
        }
      }

      const interviewComplete = /\[INTERVIEW_COMPLETE\]/g.test(text)
      const yesnoActive = /\[YESNO_QUESTION\]/.test(text)
      const finalText = stripMarkers(text)
      if (finalText) {
        setMessages((prev) => [...prev, {
          role: 'interviewer',
          content: finalText,
          yesno: yesnoActive,
        }])
      }
      setStreamingMessage('')
      return { ok: true as const, interviewComplete, resolvedInterviewId: currentInterviewId }
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
  }, [token, linkInfo, interviewId])

  // 会話開始
  const handleStart = useCallback(async () => {
    if (!linkInfo?.valid) return
    setPhase('chat')
    if (initializedRef.current) return
    initializedRef.current = true
    await sendMessageToAI(null)
  }, [linkInfo, sendMessageToAI])

  async function submitMessage() {
    const hasContent = input.trim().length > 0
    const hasAttachments = pendingAttachments.length > 0
    if (!hasContent && !hasAttachments) return
    if (loading) return
    if (userTurns >= MAX_TURNS) {
      await handleFinish()
      return
    }
    const text = input.trim()
    setInput('')
    const attachmentsToSend = pendingAttachments
    setPendingAttachments([])

    const newTurns = userTurns + 1
    const result = await sendMessageToAI(text, { attachments: attachmentsToSend })
    if (!result.ok) {
      // 失敗時は添付を元に戻す
      setPendingAttachments(attachmentsToSend)
      return
    }
    // 回答できたのでパス連発カウントをリセット
    setPassStreak(0)

    if (newTurns >= MAX_TURNS) {
      await handleFinish(result.resolvedInterviewId ?? interviewId ?? undefined)
    } else if (result.interviewComplete) {
      // AI が「終わってもいい」と言ったタイミング
      setPhase('complete')
    }
  }

  async function handlePassQuestion() {
    if (loading) return
    if (passStreak >= PASS_STREAK_LIMIT) return

    setMessages((prev) => {
      const last = [...prev].reverse().findIndex((m) => m.role === 'interviewer')
      if (last === -1) return prev
      const idx = prev.length - 1 - last
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
    })

    const result = await sendMessageToAI(PASS_QUESTION_TOKEN, { alreadyDisplayed: true })
    if (!result.ok) return
    setPassStreak((n) => n + 1)

    if (result.interviewComplete) {
      setPhase('complete')
    }
  }

  // モグロ等のYes/Noボタン押下
  async function handleYesNo(answer: 'はい' | 'いいえ') {
    if (loading || hasReachedTurnLimit) return
    const newTurns = userTurns + 1
    const result = await sendMessageToAI(answer)
    if (!result.ok) return
    setPassStreak(0)
    if (newTurns >= MAX_TURNS) {
      await handleFinish(result.resolvedInterviewId ?? interviewId ?? undefined)
    } else if (result.interviewComplete) {
      setPhase('complete')
    }
  }

  // ハル限定: 画像アップロード
  async function handleAttachmentUpload(file: File) {
    if (!token || !interviewId) return
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
      const sp = new URLSearchParams({ interviewId })
      const res = await fetch(`/api/interview-links/${token}/attachments?${sp.toString()}`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = typeof body?.message === 'string'
          ? body.message
          : '画像のアップロードに失敗しました。もう一度お試しください。'
        setSubmitError(msg)
        return
      }
      const data = await res.json() as { path: string; contentType: string }
      const previewUrl = URL.createObjectURL(file)
      setPendingAttachments((prev) => [...prev, { path: data.path, contentType: data.contentType, previewUrl }])
    } catch {
      setSubmitError('画像のアップロードに失敗しました。もう一度お試しください。')
    } finally {
      setUploadingAttachment(false)
    }
  }

  function removePendingAttachment(index: number) {
    setPendingAttachments((prev) => {
      const next = [...prev]
      const removed = next.splice(index, 1)
      removed.forEach((a) => {
        if (a.previewUrl.startsWith('blob:')) URL.revokeObjectURL(a.previewUrl)
      })
      return next
    })
  }

  async function handleFinish(resolvedId?: string) {
    const idToUse = resolvedId ?? interviewId
    if (!token || !idToUse || completeCalled) return
    setCompleteCalled(true)
    try {
      await fetch(`/api/interview-links/${token}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: idToUse }),
      })
    } catch {
      // 完了通知の失敗はUI上のエラーにしない
    }
    clearProgress(token)
    setPhase('complete')
  }

  // 一時中断: /complete を叩かず、localStorage も残す。
  async function handlePauseInterview() {
    setShowFinishConfirm(false)
    setCompleteKind('paused')
    setPhase('complete')
  }

  // 完了: /complete を叩いて status='completed' に。再開不可。
  async function handleDoneInterview() {
    if (!interviewId) {
      setShowFinishConfirm(false)
      return
    }
    setFinishing(true)
    try {
      await handleFinish()
      setCompleteKind('done')
    } finally {
      setFinishing(false)
      setShowFinishConfirm(false)
    }
  }

  // ローディング中
  if (validating || !token) {
    return (
      <div className="bg-[var(--bg)] h-dvh flex items-center justify-center">
        <p className="text-[var(--text3)] text-base">確認しています...</p>
      </div>
    )
  }

  // 無効なリンク
  if (!linkInfo?.valid) {
    if (token) clearProgress(token)
    return (
      <div className="bg-[var(--bg)] h-dvh flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-16 h-16 rounded-full bg-[var(--err-l)] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--err)]" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[var(--text)] font-semibold text-lg mb-2">このリンクは無効または期限切れです。</p>
          <p className="text-[var(--text3)] text-base">リンクを送ってくれた方にご確認ください。</p>
        </div>
      </div>
    )
  }

  // 導入画面
  if (phase === 'intro') {
    return (
      <div className="bg-[var(--bg)] min-h-dvh flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 text-center">
            <div className="flex justify-center mb-5">
              <CharacterAvatar
                src={char?.icon96}
                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                emoji={char?.emoji}
                size={80}
                className="border-2 border-[var(--accent)]"
              />
            </div>

            <p className="text-[var(--text)] font-semibold text-base mb-1">{char?.name ?? 'インタビュアー'}</p>
            <p className="text-[var(--text2)] text-base mb-5">
              {getCharacterIntro(characterId)}
            </p>

            <div className="rounded-[var(--r-lg)] bg-[var(--accent-l)] border border-[var(--accent)]/20 px-4 py-3 mb-5">
              <p className="text-[13px] text-[var(--accent)] font-semibold mb-1">今日のテーマ</p>
              <p className="text-base text-[var(--text)] font-medium">{linkInfo.theme}についてお話を聞かせてください</p>
            </div>

            <p className="text-[13px] text-[var(--text3)] mb-6">
              {characterId === 'mogro'
                ? '質問に「はい / いいえ」で答えるだけでOKです。'
                : characterId === 'hal'
                  ? '写真を1枚送ってもらえると、そこから話を広げます。'
                  : 'メッセージを送るだけでOKです。全部で10往復程度です。'}
            </p>

            <button
              type="button"
              onClick={handleStart}
              className="w-full bg-[var(--accent)] text-white rounded-full py-3 text-base font-semibold hover:bg-[var(--accent-h)] transition-colors cursor-pointer min-h-[44px]"
            >
              はじめる
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 完了画面: completeKind ('paused' / 'done') で文言を切り替える
  if (phase === 'complete') {
    const nameDisplay = linkInfo.targetName ? `${linkInfo.targetName}さん、` : ''
    const isDone = completeKind === 'done'
    const canResume = !isDone && !completeCalled && userTurns < MAX_TURNS
    return (
      <div className="bg-[var(--bg)] min-h-dvh flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 text-center">
            <div className="flex justify-center mb-5">
              <CharacterAvatar
                src={char?.icon96}
                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                emoji={char?.emoji}
                size={80}
                className="border-2 border-[var(--ok)]"
              />
            </div>
            {isDone ? (
              <>
                <p className="text-[var(--text)] font-semibold text-base mb-2">ありがとうございました！</p>
                <p className="text-[var(--text2)] text-base">
                  {nameDisplay}貴重なお話をありがとうございました。インタビュアーがメモをまとめて、依頼者にお届けします。
                </p>
              </>
            ) : (
              <>
                <p className="text-[var(--text)] font-semibold text-base mb-2">ここまでありがとうございました</p>
                <p className="text-[var(--text2)] text-base mb-5">
                  また続きから話せます。リンクをもう一度開いていただければ、ここから再開します。
                </p>
                {canResume && (
                  <button
                    type="button"
                    onClick={() => setPhase('chat')}
                    className="w-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text)] rounded-full py-2.5 text-base font-semibold transition-colors cursor-pointer min-h-[44px]"
                  >
                    インタビューに戻る
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 会話画面
  return (
    <div className="bg-[var(--bg)] h-dvh flex flex-col overflow-hidden">
      {/* ヘッダー（インタビュアー + 終了ボタン） */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CharacterAvatar
            src={char?.icon48}
            alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
            emoji={char?.emoji}
            size={36}
            className="border border-[var(--accent)] flex-shrink-0"
          />
          <span className="font-serif font-bold text-[var(--text)] text-base">{char?.name}</span>
        </div>
        {/* モバイル: アイコンのみ */}
        <button
          type="button"
          onClick={() => setShowFinishConfirm(true)}
          aria-label="インタビューを終わらせる"
          disabled={loading || messages.length === 0}
          className="md:hidden bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors hover:opacity-90 cursor-pointer flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {/* PC: テキストボタン */}
        <button
          type="button"
          onClick={() => setShowFinishConfirm(true)}
          disabled={loading || messages.length === 0}
          className="hidden md:block bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] px-3 py-1.5 text-base font-semibold transition-colors hover:opacity-90 cursor-pointer flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          インタビューを終わらせる
        </button>
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
        onYesNo={characterId === 'mogro' ? handleYesNo : undefined}
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
        hasReachedTurnLimit={hasReachedTurnLimit}
        passStreak={passStreak}
        passStreakLimit={PASS_STREAK_LIMIT}
        onPassQuestion={handlePassQuestion}
        pendingAttachments={pendingAttachments}
        uploadingAttachment={uploadingAttachment}
        onAttachmentSelected={characterId === 'hal' && interviewId ? handleAttachmentUpload : undefined}
        onRemoveAttachment={characterId === 'hal' ? removePendingAttachment : undefined}
        submitError={submitError}
        onSubmit={() => void submitMessage()}
      />

      {/* 取材上限到達時のバナー */}
      {hasReachedTurnLimit && !completeCalled && (
        <div className="bg-[var(--surface)] border-t border-[var(--border)] px-4 py-4 flex-shrink-0">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-base text-[var(--text2)] mb-3">上限まで話を聞かせていただきました。</p>
            <button
              type="button"
              onClick={() => handleFinish()}
              className="bg-[var(--accent)] text-white rounded-full px-6 py-2.5 text-base font-semibold hover:bg-[var(--accent-h)] transition-colors cursor-pointer min-h-[44px]"
            >
              完了する
            </button>
          </div>
        </div>
      )}

      {/* インタビュー終了確認モーダル */}
      {showFinishConfirm && (
        <FinishInterviewModal
          finishing={finishing}
          onCancel={() => setShowFinishConfirm(false)}
          onPause={handlePauseInterview}
          onDone={handleDoneInterview}
        />
      )}
    </div>
  )
}

// AI 出力の各種マーカーをユーザー表示用に除去する。
// 通常側 InterviewClient.tsx と同じ規約を使用（追加マーカーを増やしたら両方更新する）。
function stripMarkers(text: string): string {
  return text
    .replace(/\[INTERVIEW_COMPLETE\]/g, '')
    .replace(/\[DISCOVERY:[^\]]+\]/g, '')
    .replace(/\[DRAFT_PROPOSAL:[^\]]+\]/g, '')
    .replace(/\[HEADLINE_CANDIDATES:[^\]]+\]/g, '')
    .replace(/\[YESNO_QUESTION\]/g, '')
    .trim()
}
