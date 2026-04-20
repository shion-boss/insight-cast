'use client'

import { useState } from 'react'
import { createProject } from '@/lib/actions/projects'
import CompetitorSelectionFields from '@/components/competitor-selection-fields'
import { CharacterAvatar, FieldLabel, InterviewerSpeech, PrimaryButton, TextInput } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

const STEPS = ['基本情報', '競合URL', '完了'] as const

export default function NewProjectForm() {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const mint = getCharacter('mint')

  // フォーム送信はステップ1のみで server action を呼ぶシングルステップ実装を維持
  return (
    <div className="max-w-2xl">
      {/* ステップインジケーター */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                i === 0
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg2)] text-[var(--text3)] border border-[var(--border)]'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i === 0 ? 'text-[var(--accent)]' : 'text-[var(--text3)]'
              }`}
            >
              {step}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-[var(--border)] flex-shrink-0 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Mint 案内 */}
      <div className="mb-7">
        <InterviewerSpeech
          icon={
            <CharacterAvatar
              src={mint?.icon48}
              alt="ミントのアイコン"
              emoji={mint?.emoji}
              size={48}
            />
          }
          name="ミント"
          title="取材先の基本情報を教えてください。"
          description="URLを入力すると、AIが現状のホームページを分析してテーマを提案できるようになります。"
          tone="soft"
        />
      </div>

      <form action={createProject} className="space-y-6">
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-8 space-y-4">
          <div>
            <FieldLabel required>取材先名</FieldLabel>
            <TextInput
              type="text"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 山田工務店"
            />
          </div>
          <div>
            <FieldLabel required>自社HP URL</FieldLabel>
            <TextInput
              type="text"
              name="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <p className="mt-1 text-[12px] text-[var(--text3)]">https:// がなくても大丈夫です</p>
          </div>
        </section>

        <CompetitorSelectionFields siteUrl={url} />

        <PrimaryButton
          type="submit"
          className="w-full py-3 text-sm"
        >
          取材先を登録する
        </PrimaryButton>
      </form>
    </div>
  )
}
