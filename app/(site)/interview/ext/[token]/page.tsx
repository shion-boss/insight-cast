'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, InterviewerSpeech } from '@/components/ui'

// キャラ別自己紹介文
const CHARACTER_INTROS: Record<string, string> = {
  mint: 'こんにちは！ミントといいます。気軽にお話しください。',
  claus: 'クラウスです。業種の観点からお話を聞かせていただきます。',
  rain: 'レインといいます。マーケティングの視点でお話を聞きます。',
}

function getCharacterIntro(characterId: string): string {
  return CHARACTER_INTROS[characterId] ?? 'インタビュアーが話を聞かせていただきます。'
}

type LinkInfo = {
  valid: boolean
  interviewerType?: string
  theme?: string
  targetName?: string
  targetIndustry?: string
}

type Message = { role: 'user' | 'interviewer'; content: string }

const MAX_TURNS = 15
const STANDARD_TURNS = 7
const PASS_QUESTION_TOKEN = '__PASS_QUESTION__'

function getProgressLabel(turns: number) {
  if (turns < 3) return '話を聞かせてもらっています'
  if (turns < 5) return 'いろいろと教えてもらっています'
  if (turns < STANDARD_TURNS) return 'いい話が集まってきました'
  if (turns < MAX_TURNS) return 'もう少し掘り下げています'
  return 'まとめに入ります'
}

type PageProps = { params: Promise<{ token: string }> }

export default function ExternalInterviewPage({ params }: PageProps) {
  const [token, setToken] = useState<string | null>(null)
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null)
  const [validating, setValidating] = useState(true)

  // 画面フェーズ: 'intro' | 'chat' | 'complete'
  const [phase, setPhase] = useState<'intro' | 'chat' | 'complete'>('intro')

  // 会話
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [userTurns, setUserTurns] = useState(0)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [completeCalled, setCompleteCalled] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initializedRef = useRef(false)

  // params を解決
  useEffect(() => {
    params.then(({ token: t }) => setToken(t))
  }, [params])

  // トークン検証
  useEffect(() => {
    if (!token) return
    fetch(`/api/interview-links/${token}`)
      .then(r => r.json())
      .then((data: LinkInfo) => {
        setLinkInfo(data)
        setValidating(false)
      })
      .catch(() => {
        setLinkInfo({ valid: false })
        setValidating(false)
      })
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streamingMessage ? 'instant' : 'smooth' })
  }, [messages, loading, streamingMessage])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  const sendMessageToAI = useCallback(async (userText: string | null, opts?: { alreadyDisplayed?: boolean }) => {
    if (!token || !linkInfo?.valid) return { ok: false as const, interviewComplete: false }

    setSubmitError(null)
    setLoading(true)
    setStreamingMessage('')

    const shouldAppendUser = Boolean(userText && !opts?.alreadyDisplayed)

    if (shouldAppendUser && userText) {
      setMessages(prev => [...prev, { role: 'user', content: userText }])
      setUserTurns(t => t + 1)
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
        }),
      })

      if (!res.ok || !res.body) {
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
            const rest = chunk.slice(newlineIdx + 1)
            if (rest) {
              text += rest
              setStreamingMessage(text.replace(/\[INTERVIEW_COMPLETE\]/g, '').trim())
            }
          }
        } else {
          firstChunk = false
          text += chunk
          setStreamingMessage(text.replace(/\[INTERVIEW_COMPLETE\]/g, '').trim())
        }
      }

      const interviewComplete = /\[INTERVIEW_COMPLETE\]/g.test(text)
      const finalText = text.replace(/\[INTERVIEW_COMPLETE\]/g, '').trim()
      if (finalText) {
        setMessages(prev => [...prev, { role: 'interviewer', content: finalText }])
      }
      setStreamingMessage('')
      setTimeout(() => textareaRef.current?.focus(), 50)
      return { ok: true as const, interviewComplete, resolvedInterviewId: currentInterviewId }
    } catch {
      if (shouldAppendUser) {
        setMessages(prev => prev.slice(0, -1))
        setUserTurns(t => Math.max(0, t - 1))
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
    if (!input.trim() || loading) return
    if (userTurns >= MAX_TURNS) {
      await handleFinish()
      return
    }
    const text = input.trim()
    setInput('')

    const newTurns = userTurns + 1
    const result = await sendMessageToAI(text)
    if (!result?.ok) return

    if (newTurns >= MAX_TURNS || result.interviewComplete) {
      await handleFinish(result.resolvedInterviewId ?? interviewId ?? undefined)
    }
  }

  async function handlePassQuestion() {
    if (loading) return

    setMessages(prev => {
      const last = [...prev].reverse().findIndex(m => m.role === 'interviewer')
      if (last === -1) return prev
      const idx = prev.length - 1 - last
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
    })

    const result = await sendMessageToAI(PASS_QUESTION_TOKEN, { alreadyDisplayed: true })
    if (!result?.ok) return

    if (result.interviewComplete) {
      await handleFinish(result.resolvedInterviewId ?? interviewId ?? undefined)
    }
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
    setPhase('complete')
  }

  // ローディング中
  if (validating || !token) {
    return (
      <div className="bg-[var(--bg)] h-dvh flex items-center justify-center">
        <p className="text-[var(--text3)] text-sm">確認しています...</p>
      </div>
    )
  }

  // 無効なリンク
  if (!linkInfo?.valid) {
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
          <p className="text-[var(--text3)] text-sm">リンクを送ってくれた方にご確認ください。</p>
        </div>
      </div>
    )
  }

  const char = getCharacter(linkInfo.interviewerType ?? 'mint')
  const hasReachedTurnLimit = userTurns >= MAX_TURNS

  // 導入画面
  if (phase === 'intro') {
    return (
      <div className="bg-[var(--bg)] min-h-dvh flex flex-col items-center justify-center px-4 py-12">
        {/* ロゴ */}
        <div className="mb-8 text-center">
          <span className="font-serif font-bold text-[var(--text)] text-lg tracking-tight">Insight Cast</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 text-center">
            {/* キャラアイコン */}
            <div className="flex justify-center mb-5">
              <CharacterAvatar
                src={char?.icon96}
                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                emoji={char?.emoji}
                size={80}
                className="border-2 border-[var(--accent)]"
              />
            </div>

            {/* 自己紹介 */}
            <p className="text-[var(--text)] font-semibold text-base mb-1">{char?.name ?? 'インタビュアー'}</p>
            <p className="text-[var(--text2)] text-sm mb-5">
              {getCharacterIntro(linkInfo.interviewerType ?? 'mint')}
            </p>

            {/* テーマ */}
            <div className="rounded-[var(--r-lg)] bg-[var(--accent-l)] border border-[var(--accent)]/20 px-4 py-3 mb-5">
              <p className="text-xs text-[var(--accent)] font-semibold mb-1">今日のテーマ</p>
              <p className="text-sm text-[var(--text)] font-medium">{linkInfo.theme}についてお話を聞かせてください</p>
            </div>

            {/* 使い方 */}
            <p className="text-xs text-[var(--text3)] mb-6">
              メッセージを送るだけでOKです。全部で10往返程度です。
            </p>

            <button
              type="button"
              onClick={handleStart}
              className="w-full bg-[var(--accent)] text-white rounded-[var(--r-sm)] py-3 text-sm font-semibold hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors cursor-pointer min-h-[44px]"
            >
              はじめる
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 完了画面
  if (phase === 'complete') {
    const nameDisplay = linkInfo.targetName ? `${linkInfo.targetName}さん、` : ''
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
            <p className="text-[var(--text)] font-semibold text-base mb-2">ありがとうございました！</p>
            <p className="text-[var(--text2)] text-sm mb-6">
              {nameDisplay}貴重なお話をありがとうございました。お話は記事の素材としてまとめられます。
            </p>
            <div className="rounded-[var(--r-lg)] bg-[var(--bg2)] border border-[var(--border)] px-4 py-4">
              <p className="text-xs text-[var(--text3)]">
                このインタビューは <span className="font-semibold text-[var(--text2)]">Insight Cast</span> を使って行われました。
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 会話画面
  return (
    <div className="bg-[var(--bg)] h-dvh flex flex-col overflow-hidden">
      {/* ヘッダー（シンプルなロゴのみ） */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CharacterAvatar
            src={char?.icon48}
            alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
            emoji={char?.emoji}
            size={36}
            className="border border-[var(--accent)] flex-shrink-0"
          />
          <span className="font-serif font-bold text-[var(--text)] text-sm">{char?.name}</span>
        </div>
        <span className="text-xs text-[var(--text3)] font-medium">Insight Cast</span>
      </header>

      {/* 進捗バー */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-3 sm:px-6 py-2 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1.5">
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
      <div
        role="log"
        aria-label="インタビューの会話"
        aria-live="polite"
        tabIndex={0}
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-7 flex flex-col gap-4 max-w-2xl w-full mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        {messages.map((msg, i) => (
          <div key={`${msg.role}-${i}`} className={`flex gap-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
              {msg.content || <span className="opacity-50">...</span>}
            </div>
          </div>
        ))}
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
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--text3)] hidden sm:block">答えづらい質問は、無理せずパスして次へ進めます。</p>
            <p className="text-xs text-[var(--text3)] sm:hidden">答えづらければパスできます。</p>
            <button
              type="button"
              onClick={handlePassQuestion}
              disabled={loading || hasReachedTurnLimit}
              className="border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] rounded-[var(--r-sm)] px-3 sm:px-4 py-2 sm:py-3 text-xs min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer flex-shrink-0"
            >
              この質問はパス
            </button>
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
              placeholder={hasReachedTurnLimit ? 'インタビューはここまでです。ありがとうございました。' : 'ここに話しかけてください'}
              disabled={loading || hasReachedTurnLimit}
              autoFocus
              className="flex-1 bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--r-lg)] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:outline-none text-[var(--text)] px-3 sm:px-4 py-3 text-sm resize-none leading-relaxed disabled:opacity-50 min-h-[56px] max-h-[200px] overflow-y-auto"
            />
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <button
                type="submit"
                disabled={loading || !input.trim() || hasReachedTurnLimit}
                className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-4 sm:px-5 py-3 min-h-[44px] min-w-[56px] sm:min-w-0 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors"
              >
                {loading ? '送信中...' : '送信'}
              </button>
              <p className="text-[10px] text-[var(--text3)] hidden sm:block">Ctrl+Enter</p>
            </div>
          </form>
        </div>
      </div>

      {/* 取材上限到達時のバナー */}
      {hasReachedTurnLimit && !completeCalled && (
        <div className="bg-[var(--surface)] border-t border-[var(--border)] px-4 py-4 flex-shrink-0">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-[var(--text2)] mb-3">上限まで話を聞かせていただきました。</p>
            <button
              type="button"
              onClick={() => handleFinish()}
              className="bg-[var(--accent)] text-white rounded-[var(--r-sm)] px-6 py-2.5 text-sm font-semibold hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors cursor-pointer min-h-[44px]"
            >
              完了する
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
