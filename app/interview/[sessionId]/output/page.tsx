'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, PageHeader, StateCard } from '@/components/ui'

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
  const [error, setError] = useState<string | null>(null)
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
    setError(null)
    setGenerating(type)
    const res = await fetch('/api/interview/output', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, type }),
    })
    if (!res.ok) {
      setGenerating(null)
      setError('出力をまだ用意できませんでした。少し待ってから、もう一度お試しください。')
      return
    }
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader
        title={(
          <div className="flex items-center gap-3">
            <CharacterAvatar
              src={char?.icon48}
              alt={`${char?.name ?? 'インタビュアー'}のアイコン`}
              emoji={char?.emoji}
              size={40}
            />
            <p className="text-sm font-medium text-[var(--text)]">インタビュー結果</p>
          </div>
        )}
        backHref="/home"
        backLabel="ホームへ戻る"
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6">
            <StateCard
              icon="📝"
              title="出力を開けません。"
              description={error}
              tone="warning"
              align="left"
            />
          </div>
        )}

        {/* 出力タイプ選択 */}
        <div className="flex gap-2 mb-6">
          {OUTPUT_TYPES.map(({ type, label }) => {
            const exists = outputs.find((o) => o.type === type)
            return (
              <button
                key={type}
                onClick={() => exists ? setSelectedType(type) : generate(type)}
                disabled={generating === type}
                className={`px-3 py-1.5 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors ${
                  selectedType === type && exists
                    ? 'bg-[var(--text)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)]'
                } disabled:opacity-50`}
              >
                {generating === type ? '記事素材を整えています...' : exists ? label : `✨ ${label}`}
              </button>
            )
          })}
        </div>

        {/* 出力内容 */}
        {currentOutput ? (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-[var(--text)]">{currentOutput.title}</h2>
              <button
                onClick={() => navigator.clipboard.writeText(currentOutput.content)}
                className="text-xs text-[var(--text3)] hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 border border-[var(--border)] px-2 py-1 rounded"
              >
                コピー
              </button>
            </div>
            <div className="text-sm text-[var(--text2)] whitespace-pre-wrap leading-relaxed">
              {currentOutput.content}
            </div>
          </div>
        ) : (
          <StateCard
            icon="📄"
            title="まだ出力はありません。"
            description="上の種類を選ぶと、このインタビューを読みやすい形に整えられます。"
          />
        )}
      </div>
    </div>
  )
}
