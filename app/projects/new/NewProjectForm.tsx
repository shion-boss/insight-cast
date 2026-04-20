'use client'

import { useState } from 'react'
import { createProject } from '@/lib/actions/projects'
import CompetitorSelectionFields from '@/components/competitor-selection-fields'
import { CharacterAvatar, FieldLabel, InterviewerSpeech, PrimaryButton, TextInput } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

type Props = {
  errorMessage?: string | null
}

export default function NewProjectForm({ errorMessage }: Props) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const mint = getCharacter('mint')

  return (
    <div className="max-w-2xl">
      <div className="mb-6 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Single Step</p>
        <p className="mt-1 text-sm text-[var(--text2)]">この画面で取材先情報と競合候補をまとめて登録できます。</p>
      </div>

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

      {errorMessage && (
        <div className="mb-6 rounded-[var(--r-lg)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
          {errorMessage}
        </div>
      )}

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
