'use client'

import React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import { getInterviewFocusThemeLabel } from '@/lib/interview-focus-theme'
import { CharacterAvatar, DevAiLabel, InterviewerSpeech, StateCard } from '@/components/ui'

type Message = { role: 'user' | 'interviewer'; content: string }
type SupportPost = { url: string; title: string; summary: string }

const MAX_TURNS = 15
const PASS_QUESTION_TOKEN = '__PASS_QUESTION__'

function getProgressLabel(turns: number) {
  if (turns < 5) return '話を聞かせてもらっています'
  if (turns < 10) return 'もう少し教えてもらえますか'
  if (turns < 13) return 'いい話が集まってきました'
  if (turns < MAX_TURNS) return 'そろそろまとまりそうです'
  return 'まとめに入ります'
}

export default function InterviewPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('interviewId') ?? ''
  const from = searchParams.get('from')
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const backHref = from === 'dashboard' ? '/dashboard' : `/projects/${projectId}`
  const backLabel = from === 'dashboard' ? '← ダッシュボード' : '← 取材先の管理'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [characterId, setCharacterId] = useState('mint')
  const [initializing, setInitializing] = useState(true)
  const [userTurns, setUserTurns] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [focusThemeLabel, setFocusThemeLabel] = useState<string | null>('テーマ: お任せ')
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessageToAI = useCallback(async (userText: string | null, opts?: { alreadyDisplayed?: boolean }) => {
    setSubmitError(null)
    setLoading(true)
    setStreamingMessage('')

    const shouldAppendUser = Boolean(userText && !opts?.alreadyDisplayed)

    if (shouldAppendUser && userText) {
      setMessages((prev) => [...prev, { role: 'user', content: userText }])
      setUserTurns((t) => t + 1)
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/interview/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, userMessage: userText ?? '__GREETING__' }),
      })

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
        setStreamingMessage(text.replace(/\[INTERVIEW_COMPLETE\]\s*$/m, '').trim())
      }

      const interviewComplete = /\[INTERVIEW_COMPLETE\]\s*$/m.test(text)
      const finalText = text.replace(/\[INTERVIEW_COMPLETE\]\s*$/m, '').trim()
      if (finalText) {
        setMessages((prev) => [...prev, { role: 'interviewer', content: finalText }])
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
  }, [interviewId, projectId])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    if (!interviewId) { router.push(`/projects/${projectId}/interviewer`); return }

    async function init() {
      const supabase = supabaseRef.current
      const { data: interview } = await supabase
        .from('interviews')
        .select('interviewer_type, focus_theme_mode, focus_theme')
        .eq('id', interviewId)
        .single()

      if (interview) {
        setCharacterId(interview.interviewer_type)
        setFocusThemeLabel(getInterviewFocusThemeLabel(interview.focus_theme_mode, interview.focus_theme))
      }

      const { data: history } = await supabase
        .from('interview_messages')
        .select('role, content')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true })

      if (history && history.length > 0) {
        setMessages(history as Message[])
        setUserTurns(history.filter(m => m.role === 'user').length)
      } else {
        await sendMessageToAI(null)
      }
      setInitializing(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
    init()
  }, [interviewId, projectId, router, sendMessageToAI])

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
    }
  }, [interviewId, latestInterviewerMessage, projectId])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!input.trim() || loading) return
    if (hasReachedTurnLimit) {
      setShowComplete(true)
      return
    }
    const text = input.trim()
    setInput('')

    const newTurns = userTurns + 1

    const result = await sendMessageToAI(text)
    if (!result.ok) return

    if (newTurns >= MAX_TURNS || result.interviewComplete) {
      setShowComplete(true)
    }
  }

  async function handlePassQuestion() {
    if (loading) return
    if (hasReachedTurnLimit) {
      setShowComplete(true)
      return
    }

    const result = await sendMessageToAI(PASS_QUESTION_TOKEN, { alreadyDisplayed: true })
    if (!result.ok) return

    if (result.interviewComplete) {
      setShowComplete(true)
    }
  }

  async function handleFinish() {
    router.push(`/projects/${projectId}/summary?interviewId=${interviewId}${from === 'dashboard' ? '&from=dashboard' : ''}`)
  }

  function handleContinue() {
    if (hasReachedTurnLimit) return
    setShowComplete(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function handleManualFinish() {
    setShowComplete(true)
  }

  const char = getCharacter(characterId)
  const hasReachedTurnLimit = userTurns >= MAX_TURNS
  const supportPostCount = supportPosts.ownPosts.length + supportPosts.competitorPosts.length
  const showSupportPanel = supportPosts.loading || !!supportPosts.error || supportPostCount > 0

  useEffect(() => {
    if (!initializing && hasReachedTurnLimit) {
      setShowComplete(true)
    }
  }, [hasReachedTurnLimit, initializing])

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg)] px-6">
        <div className="w-full max-w-[520px] space-y-4">
          <InterviewerSpeech
            icon={<CharacterAvatar src={char?.icon48} alt={`${char?.name ?? 'インタビュアー'}のアイコン`} emoji={char?.emoji} size={48} />}
            name={char?.name ?? 'インタビュアー'}
            title="取材画面を開いています"
            description="会話履歴と設定を読み込んでいます。通常はすぐに始まります。"
            tone="soft"
          />
          <StateCard
            icon="🎤"
            title="AIの長時間処理ではありません"
            description="ここは画面の準備だけなので、派手なアニメーションは使わないようにしました。"
            tone="soft"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg)] h-screen flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] h-16 flex items-center px-6 gap-4 flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="rounded-[var(--r-sm)] text-sm text-[var(--text3)] transition-colors hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          {backLabel}
        </button>
        <div className="flex items-center gap-3 flex-1">
          <CharacterAvatar
            src={char?.icon48}
            alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
            emoji={char?.emoji}
            size={40}
            className="border-2 border-[var(--accent)]"
          />
          <div>
            <p className="font-serif font-bold text-[var(--text)] text-sm">{char?.name}</p>
            <p className="text-xs text-[var(--teal)]">{char?.specialty}</p>
            {focusThemeLabel && (
              <p className="mt-0.5 text-xs text-[var(--text3)]">{focusThemeLabel}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleManualFinish}
          className="bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] px-3 py-1.5 text-sm font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
        >
          インタビューを終わらせる
        </button>
      </header>

      {/* 進捗バー */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-6 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text3)]">{getProgressLabel(userTurns)}</span>
            <span className="text-xs text-[var(--text3)]">{Math.min(userTurns, MAX_TURNS)}/{MAX_TURNS}</span>
          </div>
          <div className="bg-[var(--border)] h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
              style={{ width: `${Math.min((userTurns / MAX_TURNS) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 会話ログ */}
      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-4 max-w-2xl w-full mx-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'interviewer' && (
              <CharacterAvatar
                src={char?.icon48}
                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                emoji={char?.emoji}
                size={32}
                className="mt-1 border-[var(--border)] bg-[var(--accent-l)]"
              />
            )}
            <div className={`max-w-[68%] px-4 py-3 text-sm whitespace-pre-wrap leading-[1.75] ${
              msg.role === 'interviewer'
                ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-2xl rounded-tl-sm'
                : 'bg-[var(--accent)] text-white rounded-2xl rounded-tr-sm'
            }`}>
              {msg.content || <span className="opacity-50">...</span>}
            </div>
          </div>
        ))}
        {(loading || streamingMessage) && (
          <div className="flex gap-3">
            <CharacterAvatar
              src={char?.icon48}
              alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
              emoji={char?.emoji}
              size={32}
              className="border-[var(--border)] bg-[var(--accent-l)]"
            />
            <div className="bg-[var(--surface)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-sm">
              <span className="text-[var(--text2)] text-sm whitespace-pre-wrap leading-[1.75]">
                {streamingMessage || '少し待ってください...'}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-[var(--surface)] border-t border-[var(--border)] px-6 py-4 flex-shrink-0">
        {showSupportPanel && (
          <div className="max-w-2xl mx-auto mb-3 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--bg2)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--text2)]">この質問と似たテーマを扱う記事</p>
                <p className="mt-1 text-xs text-[var(--text3)]">
                  {supportPosts.loading
                    ? '自社HPと競合の記事から、近いテーマのものを探しています。'
                    : supportPosts.error
                      ? '必要ならあとで開いて確認できます。'
                      : supportPostCount > 0
                        ? `自社HP ${supportPosts.ownPosts.length}件・競合 ${supportPosts.competitorPosts.length}件。必要なときだけ開けます。`
                        : 'いま開ける関連記事はありません。'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {supportPosts.loading && <p className="text-xs text-[var(--text3)]">探しています...</p>}
                {(supportPostCount > 0 || supportPosts.error) && (
                  <button
                    type="button"
                    onClick={() => setIsSupportPanelOpen((prev) => !prev)}
                    aria-expanded={isSupportPanelOpen}
                    className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text2)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    {isSupportPanelOpen ? '閉じる' : '開く'}
                  </button>
                )}
              </div>
            </div>

            {isSupportPanelOpen && supportPosts.error && (
              <p className="mt-3 text-xs text-[var(--text3)]">{supportPosts.error}</p>
            )}

            {isSupportPanelOpen && supportPosts.ownPosts.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent)]">自社HPで似たテーマを扱う記事</p>
                <div className="mt-2 grid gap-3">
                  {supportPosts.ownPosts.map((post) => (
                    <a
                      key={post.url}
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      <p className="text-sm font-medium text-[var(--text)]">{post.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--text2)]">{post.summary}</p>
                      <p className="mt-2 truncate text-[11px] text-[var(--text3)]">{post.url}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {isSupportPanelOpen && supportPosts.competitorPosts.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--teal)]">競合で似たテーマを扱う記事</p>
                <div className="mt-2 grid gap-3">
                  {supportPosts.competitorPosts.map((post) => (
                    <a
                      key={post.url}
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      <p className="text-sm font-medium text-[var(--text)]">{post.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--text2)]">{post.summary}</p>
                      <p className="mt-2 truncate text-[11px] text-[var(--text3)]">{post.url}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {submitError && (
          <div className="max-w-2xl mx-auto mb-3">
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--text3)]">答えづらい質問は、無理せずパスして次へ進めます。</p>
            <button
              type="button"
              onClick={handlePassQuestion}
              disabled={loading || hasReachedTurnLimit}
              className="border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] rounded-[var(--r-sm)] px-4 py-2.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
            >
              この質問はパス
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  handleSubmit(e as unknown as React.SyntheticEvent<HTMLFormElement>)
                }
              }}
              placeholder={hasReachedTurnLimit ? '質問上限に達しました。ここまでの内容を記事素材へ整理できます。' : 'メッセージを入力... (Enterで改行、Ctrl+Enterで送信)'}
              disabled={loading || hasReachedTurnLimit}
              rows={3}
              autoFocus
              className="flex-1 bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--r-lg)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-l)] focus:outline-none text-[var(--text)] px-4 py-3 text-sm resize-none leading-relaxed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || hasReachedTurnLimit}
              className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-5 py-2.5 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors flex-shrink-0"
            >
              {loading ? <DevAiLabel>送信中...</DevAiLabel> : <DevAiLabel>送信</DevAiLabel>}
            </button>
          </form>
        </div>
      </div>

      {/* 完了確認モーダル */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-6 max-w-sm w-full shadow-[0_24px_64px_rgba(0,0,0,0.12)]">
            <div className="flex justify-center mb-4">
              <CharacterAvatar
                src={char?.icon96}
                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                emoji={char?.emoji}
                size={72}
                className="border-2 border-[var(--accent)]"
              />
            </div>
            <p className="text-[var(--text)] font-semibold text-center mb-2">
              {hasReachedTurnLimit ? `上限の${MAX_TURNS}回まで質問しました。` : 'いいお話がたくさん聞けました。'}
            </p>
            <p className="text-sm text-[var(--text2)] text-center mb-6">
              {hasReachedTurnLimit ? 'ここまでの内容を記事の素材にまとめてもいいですか？' : 'これを記事の素材にまとめてもいいですか？'}
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 bg-[var(--accent)] text-white rounded-[var(--r-sm)] text-sm font-semibold hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors"
              >
                <DevAiLabel>はい、まとめてください</DevAiLabel>
              </button>
              {!hasReachedTurnLimit && (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full py-2 text-sm text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-[var(--r-sm)] cursor-pointer transition-colors"
                >
                  もう少し話す
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
