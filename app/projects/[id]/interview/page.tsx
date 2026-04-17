'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, InterviewerSpeech } from '@/components/ui'

type Message = { role: 'user' | 'interviewer'; content: string }

const MAX_TURNS = 7

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
  const router = useRouter()
  const supabase = createClient()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [characterId, setCharacterId] = useState('mint')
  const [initializing, setInitializing] = useState(true)
  const [userTurns, setUserTurns] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
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
        .select('interviewer_type')
        .eq('id', interviewId)
        .single()

      if (interview) setCharacterId(interview.interviewer_type)

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

  async function handleSubmit(e: React.FormEvent) {
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

  async function handleFinish() {
    router.push(`/projects/${projectId}/summary?interviewId=${interviewId}`)
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
          </div>
        </div>
        <button
          onClick={handleManualFinish}
          className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 cursor-pointer transition-colors"
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
                ? 'bg-white text-stone-700 rounded-tl-sm shadow-sm'
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
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
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
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
            placeholder="メッセージを入力... (Enterで改行、Ctrl+Enterで送信)"
            disabled={loading}
            rows={3}
            autoFocus
            className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:opacity-50 resize-none leading-relaxed"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 cursor-pointer transition-colors flex-shrink-0"
          >
            {loading ? '送信中...' : '送信 ✨'}
          </button>
        </form>
      </div>

      {/* 完了確認モーダル */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
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
                className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 cursor-pointer transition-colors"
              >
                はい、まとめてください
              </button>
              <button
                onClick={handleContinue}
                className="w-full py-2 text-sm text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 rounded-xl cursor-pointer transition-colors"
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
