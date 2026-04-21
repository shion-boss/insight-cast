export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, InterviewerSpeech } from '@/components/ui'

export default function NotFound() {
  const mint = getCharacter('mint')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-8">
        <div>
          <InterviewerSpeech
            icon={
              <CharacterAvatar
                src={mint?.icon96}
                alt={mint?.name ? `${mint.name}のアイコン` : 'キャストのアイコン'}
                emoji={mint?.emoji}
                size={80}
              />
            }
            name={mint?.name ?? 'キャスト'}
            title="このページは見つかりませんでした。"
            description="URLが間違っているか、ページが移動した可能性があります。ダッシュボードから進んでみてください。"
            tone="soft"
          />
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  )
}
