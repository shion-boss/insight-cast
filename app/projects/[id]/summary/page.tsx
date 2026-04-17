'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import Link from 'next/link'

type SummaryData = {
  values: string[]
  themes: string[]
  messages: { role: string; content: string }[]
  interviewerType: string
}

export default function SummaryPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('interviewId') ?? ''
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMessages, setShowMessages] = useState(false)

  useEffect(() => {
    if (!interviewId) { router.push(`/projects/${projectId}/interviewer`); return }

    async function load() {
      const res = await fetch(`/api/projects/${projectId}/interview/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId }),
      })
      const json = await res.json()

      const { data: interview } = await supabase
        .from('interviews')
        .select('interviewer_type')
        .eq('id', interviewId)
        .single()

      const { data: messages } = await supabase
        .from('interview_messages')
        .select('role, content')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true })

      setData({
        values: Array.isArray(json.summary) ? json.summary : [],
        themes: Array.isArray(json.themes) ? json.themes : [],
        messages: messages ?? [],
        interviewerType: interview?.interviewer_type ?? 'mint',
      })
      setLoading(false)
    }
    load()
  }, [interviewId, projectId, router, supabase])

  const char = data ? getCharacter(data.interviewerType) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📝</div>
          <p className="text-stone-500 text-sm">取材メモを整理しています...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-stone-800">Insight Cast</span>
        <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-600">← ダッシュボード</Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{char?.emoji ?? '📝'}</span>
          <div>
            <p className="text-stone-800 font-medium">
              {char?.name ? `${char.name}からメモが届きました` : '取材メモが届きました'}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">インタビューで引き出せた内容です</p>
          </div>
        </div>

        {/* 引き出せた価値 */}
        <section className="bg-white rounded-xl border border-stone-100 p-5">
          <h2 className="text-sm font-medium text-stone-600 mb-3">引き出せた価値</h2>
          {data?.values && data.values.length > 0 ? (
            <ul className="space-y-2">
              {data.values.map((v, i) => (
                <li key={i} className="text-sm text-stone-700 flex gap-2">
                  <span className="text-amber-400 flex-shrink-0 mt-0.5">●</span>
                  {v}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-400">内容を取得できませんでした</p>
          )}
        </section>

        {/* 記事テーマ（各テーマから記事生成可能） */}
        {data?.themes && data.themes.length > 0 && (
          <section className="bg-white rounded-xl border border-stone-100 p-5">
            <h2 className="text-sm font-medium text-stone-600 mb-3">記事にできそうなテーマ</h2>
            <ul className="space-y-3">
              {data.themes.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <div className="text-sm text-stone-700 flex gap-2 min-w-0">
                    <span className="text-stone-300 flex-shrink-0">💬</span>
                    <span className="truncate">{t}</span>
                  </div>
                  <Link
                    href={`/projects/${projectId}/article?interviewId=${interviewId}&theme=${encodeURIComponent(t)}`}
                    className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 flex-shrink-0 transition-colors"
                  >
                    記事を作る
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* やり取りの折りたたみ */}
        <section className="bg-white rounded-xl border border-stone-100 p-5">
          <button
            onClick={() => setShowMessages(!showMessages)}
            className="flex items-center justify-between w-full text-sm font-medium text-stone-600 cursor-pointer"
          >
            やり取りを見る
            <span className="text-stone-300">{showMessages ? '▲' : '▼'}</span>
          </button>
          {showMessages && (
            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
              {data?.messages.map((m, i) => (
                <div key={i} className={`text-xs leading-relaxed ${m.role === 'user' ? 'text-stone-500' : 'text-stone-700'}`}>
                  <span className="font-medium">{m.role === 'user' ? '事業者' : char?.name ?? 'インタビュアー'}: </span>
                  {m.content}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* アクション */}
        <div className="space-y-3">
          <Link
            href={`/projects/${projectId}/article?interviewId=${interviewId}`}
            className="block w-full py-4 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-sm text-center"
          >
            記事を作る →
          </Link>
          <Link
            href={`/projects/${projectId}/interview?interviewId=${interviewId}`}
            className="block w-full py-2 text-sm text-stone-400 hover:text-stone-600 text-center transition-colors"
          >
            もう少し話す
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-2 text-sm text-stone-300 hover:text-stone-500 text-center transition-colors"
          >
            あとで記事にする
          </Link>
        </div>
      </div>
    </div>
  )
}
