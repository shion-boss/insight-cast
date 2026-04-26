'use client'

import { useFormStatus } from 'react-dom'
import { completeOnboarding } from '@/lib/actions/onboarding'
import { CharacterAvatar, FieldLabel, PrimaryButton, TextInput } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <PrimaryButton type="submit" disabled={pending} className="w-full py-3 text-sm mt-2">
      {pending ? '登録しています...' : 'はじめる'}
    </PrimaryButton>
  )
}

export function OnboardingForm({ next, hasError }: { next: string; hasError: boolean }) {
  const mint = getCharacter('mint')
  return (
    <form action={completeOnboarding} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      {hasError && (
        <div role="alert" className="flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3">
          <CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--err)]">登録できませんでした。もう一度お試しください。</p>
        </div>
      )}
      <div>
        <FieldLabel required htmlFor="onboarding-name">お名前</FieldLabel>
        <TextInput
          id="onboarding-name"
          type="text"
          name="name"
          required
          placeholder="例: 山田さん"
          aria-describedby={hasError ? 'onboarding-error' : undefined}
        />
      </div>
      <SubmitButton />
    </form>
  )
}
