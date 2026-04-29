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

function validateUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(withProtocol)
    if (!parsed.hostname.includes('.')) return 'URLの形式を確認してください（例: https://example.com）'
    return null
  } catch {
    return 'URLの形式を確認してください（例: https://example.com）'
  }
}

export default function NewProjectForm({ errorMessage, maxCompetitors = 3 }: Props) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
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
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-[var(--r-lg)] bg-[var(--warn-l)] px-4 py-3">
          <CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-[var(--warn)]">{errorMessage}</p>
        </div>
      )}

      <form action={createProject} className="space-y-6">
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-8 space-y-4">
          <div>
            <FieldLabel required htmlFor="new-project-name">取材先名</FieldLabel>
            <TextInput
              id="new-project-name"
              type="text"
              name="name"
              required
              maxLength={200}
              autoComplete="organization"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 山田工務店"
            />
          </div>
          <div>
            <FieldLabel required htmlFor="new-project-url">自社HP URL</FieldLabel>
            <TextInput
              id="new-project-url"
              type="text"
              inputMode="url"
              name="url"
              required
              autoComplete="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setUrlError(null)
              }}
              onBlur={(e) => setUrlError(validateUrl(e.target.value))}
              aria-describedby={urlError ? 'url-error' : 'url-hint'}
              aria-invalid={urlError ? true : undefined}
              placeholder="https://example.com"
            />
            {urlError ? (
              <p id="url-error" role="alert" className="mt-1 text-[12px] text-[var(--err)]">{urlError}</p>
            ) : (
              <p id="url-hint" className="mt-1 text-[12px] text-[var(--text3)]">https:// がなくても大丈夫です</p>
            )}
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
          <div role="alert" className="flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3">
            <CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--err)]">{competitorIssue}</p>
          </div>
        )}

        <SubmitProjectButton disabled={!canSubmit} />
      </form>
    </div>
  )
}
