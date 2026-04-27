'use client'

import Link from 'next/link'
import { CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const mint = getCharacter('mint')

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
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
          title="うまく表示できませんでした"
          description="一時的な問題が起きています。再読み込みしてみてください。"
          tone="soft"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            もう一度試す
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
