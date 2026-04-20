'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import { getInterviewFocusThemeLabel } from '@/lib/interview-focus-theme'
import { CharacterAvatar, DevAiLabel, InterviewerSpeech } from '@/components/ui'

type Message = { role: 'user' | 'interviewer'; content: string }
type SupportPost = { url: string; title: string; summary: string }

const MAX_TURNS = 7
const PASS_QUESTION_TOKEN = '__PASS_QUESTION__'

function getProgressLabel(turns: number) {
  if (turns < 3) return '話を聞かせてもらっています'
  if (turns < 5) return 'もう少し教えてもらえますか'
  if (turns < 7) return 'いい話が集まってきました'
  return 'まとめに入ります'
}

export default function InterviewPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('interviewId') ?? ''
  const from = searchParams.get('from')
  const router = useRouter()
  const supabase = createClient()
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
  }, [interviewId, projectId, router, sendMessageToAI, supabase])

  const latestInterviewerMessage = [...messages].reverse().find((message) => message.role === 'interviewer')?.content ?? ''

  useEffect(() => {
    if (!interviewId || !latestInterviewerMessage.trim()) return

    let cancelled = false
    setSupportPosts((prev) => ({ ...prev, loading: true, error: null }))

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')

    const newTurns = userTurns + 1

    const result = await sendMessageToAI(text)
    if (!result.ok) return

    if (newTurns === MAX_TURNS || result.interviewComplete) {
      setShowComplete(true)
    }
  }

  async function handlePassQuestion() {
    if (loading) return

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
    setShowComplete(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function handleManualFinish() {
    setShowComplete(true)
  }

  const char = getCharacter(characterId)

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 px-6">
        <div className="w-full max-w-md">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={char?.icon48}
                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                emoji={char?.emoji}
                size={48}
              />
            )}
            name={char?.name ?? 'インタビュアー'}
            title="取材班を呼んでいます。"
            description="席につけたら、そのまま聞き取りを始めます。"
            tone="soft"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="bg-white border-b border-stone-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="rounded-md text-xs text-stone-500 transition-colors hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
          >
            {backLabel}
          </button>
          <div className="flex items-center gap-3">
            <CharacterAvatar
              src={char?.icon48}
              alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
              emoji={char?.emoji}
              size={40}
            />
            <div>
              <p className="text-sm font-medium text-stone-800">{char?.name}</p>
              <p className="text-xs text-stone-400">{char?.specialty}</p>
              {focusThemeLabel && (
                <p className="mt-1 text-xs text-amber-700">{focusThemeLabel}</p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleManualFinish}
          className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 cursor-pointer transition-colors"
        >
          インタビューを終わらせる
        </button>
      </header>

      {/* 進捗バー（7ドット）- flex-shrink-0 で常に表示 */}
      <div className="bg-white border-b border-stone-100 px-6 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-400">{getProgressLabel(userTurns)}</span>
            <span className="text-xs text-stone-300">{Math.min(userTurns, MAX_TURNS)}/{MAX_TURNS}</span>
          </div>
          <div className="flex gap-2 justify-center">
            {Array.from({ length: MAX_TURNS }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < userTurns ? 'bg-amber-400 scale-110' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 会話ログ（スクロール可能） */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl w-full mx-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'interviewer' && (
              <CharacterAvatar
                src={char?.icon48}
                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                emoji={char?.emoji}
                size={32}
                className="mt-1 border-amber-100 bg-amber-50"
              />
            )}
            <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'interviewer'
                ? 'bg-white text-stone-700 rounded-tl-sm'
                : 'bg-stone-800 text-white rounded-tr-sm'
            }`}>
              {msg.content || <span className="text-stone-300">...</span>}
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
              className="border-amber-100 bg-amber-50"
            />
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm">
              <span className="text-stone-500 text-sm whitespace-pre-wrap leading-relaxed">
                {streamingMessage || '考えをまとめています...'}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="bg-white border-t border-stone-100 px-4 py-4 flex-shrink-0">
        {(supportPosts.loading || supportPosts.error || supportPosts.ownPosts.length > 0 || supportPosts.competitorPosts.length > 0) && (
          <div className="max-w-2xl mx-auto mb-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-stone-500">この質問と似たテーマを扱う記事</p>
                <p className="mt-1 text-xs text-stone-400">自社HPの記事は内部リンク候補、競合記事は読み比べ用の参考です。</p>
              </div>
              {supportPosts.loading && <p className="text-xs text-stone-400">探しています...</p>}
            </div>

            {supportPosts.error && (
              <p className="mt-3 text-xs text-stone-400">{supportPosts.error}</p>
            )}

            {supportPosts.ownPosts.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">自社HPで似たテーマを扱う記事</p>
                <div className="mt-2 grid gap-3">
                  {supportPosts.ownPosts.map((post) => (
                    <a
                      key={post.url}
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-amber-100 bg-white px-4 py-3 transition-colors hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                    >
                      <p className="text-sm font-medium text-stone-700">{post.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-stone-500">{post.summary}</p>
                      <p className="mt-2 truncate text-[11px] text-stone-400">{post.url}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {supportPosts.competitorPosts.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-teal-700">競合で似たテーマを扱う記事</p>
                <div className="mt-2 grid gap-3">
                  {supportPosts.competitorPosts.map((post) => (
                    <a
                      key={post.url}
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-teal-100 bg-white px-4 py-3 transition-colors hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                    >
                      <p className="text-sm font-medium text-stone-700">{post.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-stone-500">{post.summary}</p>
                      <p className="mt-2 truncate text-[11px] text-stone-400">{post.url}</p>
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
            <p className="text-xs text-stone-400">答えづらい質問は、無理せずパスして次へ進めます。</p>
            <button
              type="button"
              onClick={handlePassQuestion}
              disabled={loading}
              className="rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-500 transition-colors hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 cursor-pointer"
            >
              この質問はパス
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  handleSubmit(e as unknown as FormEvent<HTMLFormElement>)
                }
              }}
              placeholder="メッセージを入力... (Enterで改行、Ctrl+Enterで送信)"
              disabled={loading}
              rows={3}
              autoFocus
              className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 disabled:opacity-50 resize-none leading-relaxed"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 cursor-pointer transition-colors flex-shrink-0"
            >
              {loading ? <DevAiLabel>送信中...</DevAiLabel> : <DevAiLabel>送信</DevAiLabel>}
            </button>
          </form>
        </div>
      </div>

      {/* 完了確認モーダル */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-center mb-3">
              <CharacterAvatar
                src={char?.icon96}
                alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
                emoji={char?.emoji}
                size={72}
              />
            </div>
            <p className="text-stone-800 font-medium text-center mb-2">
              いいお話がたくさん聞けました。
            </p>
            <p className="text-sm text-stone-500 text-center mb-6">
              これを記事の素材にまとめてもいいですか？
            </p>
            <div className="space-y-2">
              <button
                onClick={handleFinish}
                className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 cursor-pointer transition-colors"
              >
                <DevAiLabel>はい、まとめてください</DevAiLabel>
              </button>
              <button
                onClick={handleContinue}
                className="w-full py-2 text-sm text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 rounded-xl cursor-pointer transition-colors"
              >
                もう少し話す
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
