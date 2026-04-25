'use client'

import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { createProject } from '@/lib/actions/projects'
import CompetitorSelectionFields from '@/components/competitor-selection-fields'
import { CharacterAvatar, FieldLabel, InterviewerSpeech, PrimaryButton, TextInput } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

type Props = {
  errorMessage?: string | null
  maxCompetitors?: number
}

function SubmitProjectButton({
  disabled,
}: {
  disabled: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <PrimaryButton
      type="submit"
      disabled={pending || disabled}
      className="w-full py-3 text-sm"
    >
      {pending ? '取材先を登録しています...' : '取材先を登録する'}
    </PrimaryButton>
  )
}

export default function NewProjectForm({ errorMessage, maxCompetitors = 3 }: Props) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [competitorIssue, setCompetitorIssue] = useState<string | null>(null)
  const [canSubmit, setCanSubmit] = useState(true)
  const mint = getCharacter('mint')

  return (
    <div className="max-w-2xl">
      <div className="mb-6 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">まとめて登録</p>
        <p className="mt-1 text-sm text-[var(--text2)]">この画面だけで、取材先の基本情報と参考HPをまとめて登録できます。</p>
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
          description="URLを入れておくと、あとでホームページを分析して取材テーマを提案しやすくなります。"
          tone="soft"
        />
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-[var(--r-lg)] border border-[var(--warn-l)] bg-[var(--warn-l)] px-4 py-3 text-sm leading-relaxed text-[var(--warn)]">
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

        <CompetitorSelectionFields
          siteUrl={url}
          maxCompetitors={maxCompetitors}
          onSelectionStateChange={(state) => {
            setCanSubmit(state.canSubmit)
            setCompetitorIssue(state.issue)
          }}
        />

        {competitorIssue && (
          <p className="rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3 text-sm text-[var(--err)]">
            {competitorIssue}
          </p>
        )}

        <SubmitProjectButton disabled={!canSubmit} />
      </form>
    </div>
  )
}
