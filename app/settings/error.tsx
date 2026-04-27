'use client'

import { CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { AppShell } from '@/components/app-shell'

export default function SettingsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const mint = getCharacter('mint')

  return (
    <AppShell title="設定" active="settings" accountLabel="設定" isAdmin={false}>
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-8">
          <InterviewerSpeech
            icon={
              <CharacterAvatar
                src={mint?.icon96}
                alt={mint?.name ? `${mint.name}のアイコン` : 'キャストのアイコン'}
                emoji={mint?.emoji}
                size={72}
                priority
              />
            }
            name={mint?.name ?? 'ミント'}
            title="うまく表示できませんでした"
            description="一時的な問題が起きています。ページを再読み込みしてもう一度お試しください。"
            tone="soft"
          />
          <button
            type="button"
            onClick={reset}
            className="inline-block rounded-xl bg-[var(--accent)] text-white px-6 py-3 text-sm font-semibold hover:bg-[var(--accent-h)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            もう一度試す
          </button>
        </div>
      </div>
    </AppShell>
  )
}
