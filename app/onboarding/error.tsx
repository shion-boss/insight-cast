'use client'

import Link from 'next/link'
import { CharacterAvatar, InterviewerSpeech, getButtonClass } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

export default function OnboardingError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const mint = getCharacter('mint')

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8 text-center">
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
          title="登録の画面を開けませんでした"
          description="一時的な問題が起きています。再読み込みしてもう一度お試しください。"
          tone="soft"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            もう一度試す
          </button>
          <Link
            href="/"
            className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
