'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import { PageHeader } from '@/components/ui'

type Output = { id: string; type: string; title: string; content: string }

const OUTPUT_TYPES = [
  { type: 'raw', label: 'インタビュー記録' },
  { type: 'polished', label: 'まとめ' },
  { type: 'qa', label: 'Q&A形式' },
]

export default function OutputPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [outputs, setOutputs] = useState<Output[]>([])
  const [selectedType, setSelectedType] = useState('raw')
  const [generating, setGenerating] = useState<string | null>(null)
  const [characterId, setCharacterId] = useState('mint')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase
        .from('interview_sessions')
        .select('character_id')
        .eq('id', sessionId)
        .single()
      if (session) setCharacterId(session.character_id)

      const { data } = await supabase
        .from('interview_outputs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      if (data) setOutputs(data)
    }
    load()
  }, [sessionId, supabase])

  async function generate(type: string) {
    setGenerating(type)
    const res = await fetch('/api/interview/output', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, type }),
    })
    const data = await res.json()
    setOutputs((prev) => {
      const exists = prev.find((o) => o.type === type)
      if (exists) return prev.map((o) => o.type === type ? { ...o, content: data.content } : o)
      return [...prev, { id: data.id, type, title: OUTPUT_TYPES.find(t => t.type === type)?.label ?? type, content: data.content }]
    })
    setGenerating(null)
    setSelectedType(type)
  }

  const char = getCharacter(characterId)
  const currentOutput = outputs.find((o) => o.type === selectedType)

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader
        title={(
          <div className="flex items-center gap-3">
            <span className="text-2xl">{char?.emoji}</span>
            <p className="text-sm font-medium text-stone-800">インタビュー結果</p>
          </div>
        )}
        backHref="/home"
        backLabel="ホームへ戻る"
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* 出力タイプ選択 */}
        <div className="flex gap-2 mb-6">
          {OUTPUT_TYPES.map(({ type, label }) => {
            const exists = outputs.find((o) => o.type === type)
            return (
              <button
                key={type}
                onClick={() => exists ? setSelectedType(type) : generate(type)}
                disabled={generating === type}
                className={`px-3 py-1.5 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors ${
                  selectedType === type && exists
                    ? 'bg-stone-800 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                } disabled:opacity-50`}
              >
                {generating === type ? '✨ 生成中...' : exists ? label : `✨ ${label}`}
              </button>
            )
          })}
        </div>

        {/* 出力内容 */}
        {currentOutput ? (
          <div className="bg-white rounded-xl border border-stone-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-stone-800">{currentOutput.title}</h2>
              <button
                onClick={() => navigator.clipboard.writeText(currentOutput.content)}
                className="text-xs text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 border border-stone-200 px-2 py-1 rounded"
              >
                コピー
              </button>
            </div>
            <div className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
              {currentOutput.content}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-stone-400">
            <p className="text-sm">上のボタンで出力を生成できます</p>
          </div>
        )}
      </div>
    </div>
  )
}
