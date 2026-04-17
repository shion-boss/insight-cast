'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import { completeSession } from '@/lib/actions/interview'

type Message = { role: 'user' | 'assistant'; content: string }

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [characterId, setCharacterId] = useState('mint')
  const [initializing, setInitializing] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      // セッション情報と履歴を取得
      const { data: session } = await supabase
        .from('interview_sessions')
        .select('character_id')
        .eq('id', sessionId)
        .single()

      if (session) setCharacterId(session.character_id)

      const { data: history } = await supabase
        .from('interview_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (history && history.length > 0) {
        setMessages(history as Message[])
      } else {
        // 初回: ミントの挨拶
        await sendMessage(null, session?.character_id ?? 'mint')
      }
      setInitializing(false)
    }
    init()
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(userText: string | null, charId?: string) {
    setLoading(true)

    if (userText) {
      setMessages((prev) => [...prev, { role: 'user', content: userText }])
    }

    const res = await fetch('/api/interview/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userMessage: userText ?? '__GREETING__',
      }),
    })

    if (!res.ok || !res.body) { setLoading(false); return }

    // ストリーミング表示
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let text = ''

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: text }
        return updated
      })
    }

    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  const char = getCharacter(characterId)

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-sm">取材班を呼んでいます...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{char?.emoji}</span>
          <div>
            <p className="text-sm font-medium text-stone-800">{char?.name}</p>
            <p className="text-xs text-stone-400">{char?.description}</p>
          </div>
        </div>
        <form action={completeSession.bind(null, sessionId)}>
          <button
            type="submit"
            className="text-sm px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
          >
            インタビューを終わる
          </button>
        </form>
      </header>

      {/* 会話ログ */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl w-full mx-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm flex-shrink-0 mt-1">
                {char?.emoji}
              </div>
            )}
            <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
              msg.role === 'assistant'
                ? 'bg-white text-stone-700 rounded-tl-sm shadow-sm'
                : 'bg-stone-800 text-white rounded-tr-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm flex-shrink-0">
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
      <div className="bg-white border-t border-stone-100 px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-stone-800 text-white rounded-xl text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            ✨ 送信
          </button>
        </form>
      </div>
    </div>
  )
}
