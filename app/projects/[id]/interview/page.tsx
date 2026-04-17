'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'

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
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
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
    }
    init()
  }, [interviewId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessageToAI(userText: string | null, opts?: { alreadyDisplayed?: boolean }) {
    setLoading(true)

    if (userText && !opts?.alreadyDisplayed) {
      setMessages(prev => [...prev, { role: 'user', content: userText }])
      setUserTurns(t => t + 1)
    }

    const res = await fetch(`/api/projects/${projectId}/interview/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewId, userMessage: userText ?? '__GREETING__' }),
    })

    if (!res.ok || !res.body) { setLoading(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let text = ''
    setMessages(prev => [...prev, { role: 'interviewer', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value)
      const displayText = text.replace(/\[INTERVIEW_COMPLETE\]\s*$/m, '').trim()
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'interviewer', content: displayText }
        return updated
      })
    }

    setLoading(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')

    const newTurns = userTurns + 1

    if (newTurns >= MAX_TURNS) {
      // Show user message in UI immediately, but hold AI request until user decides
      setMessages(prev => [...prev, { role: 'user', content: text }])
      setUserTurns(newTurns)
      setPendingMessage(text)
      setShowComplete(true)
      return
    }

    await sendMessageToAI(text)
  }

  async function handleFinish() {
    if (pendingMessage) {
      await fetch(`/api/projects/${projectId}/interview/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, content: pendingMessage }),
      })
    }
    router.push(`/projects/${projectId}/summary?interviewId=${interviewId}`)
  }

  async function handleContinue() {
    setShowComplete(false)
    const msg = pendingMessage
    setPendingMessage(null)
    if (msg) {
      await sendMessageToAI(msg, { alreadyDisplayed: true })
    }
  }

  function handleManualFinish() {
    setPendingMessage(null)
    setShowComplete(true)
  }

  const char = getCharacter(characterId)

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-sm">{char?.emoji ?? '🐱'} 取材班を呼んでいます...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="bg-white border-b border-stone-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{char?.emoji}</span>
          <div>
            <p className="text-sm font-medium text-stone-800">{char?.name}</p>
            <p className="text-xs text-stone-400">{char?.specialty}</p>
          </div>
        </div>
        <button
          onClick={handleManualFinish}
          className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 cursor-pointer transition-colors"
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
              <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-sm flex-shrink-0 mt-1">
                {char?.emoji}
              </div>
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
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-sm flex-shrink-0">
              {char?.emoji}
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <span className="text-stone-400 text-sm">...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="bg-white border-t border-stone-100 px-4 py-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent) }
            }}
            placeholder="メッセージを入力... (Enterで送信、Shift+Enterで改行)"
            disabled={loading}
            rows={3}
            autoFocus
            className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:opacity-50 resize-none leading-relaxed"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex-shrink-0"
          >
            送信 ✨
          </button>
        </form>
      </div>

      {/* 完了確認モーダル */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-3xl mb-3 text-center">{char?.emoji}</div>
            <p className="text-stone-800 font-medium text-center mb-2">
              いいお話がたくさん聞けました。
            </p>
            <p className="text-sm text-stone-500 text-center mb-6">
              これを記事の素材にまとめてもいいですか？
            </p>
            <div className="space-y-2">
              <button
                onClick={handleFinish}
                className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-700 cursor-pointer transition-colors"
              >
                はい、まとめてください
              </button>
              <button
                onClick={handleContinue}
                className="w-full py-2 text-sm text-stone-400 hover:text-stone-600 cursor-pointer transition-colors"
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
