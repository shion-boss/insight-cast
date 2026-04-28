'use client'

import Link from 'next/link'
import { CharacterAvatar, InterviewerSpeech, getButtonClass } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

export default function ReportError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const claus = getCharacter('claus')

  return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <InterviewerSpeech
            icon={
              <CharacterAvatar
                src={claus?.icon96}
                alt={claus?.name ? `${claus.name}のアイコン` : 'キャストのアイコン'}
                emoji={claus?.emoji}
                size={72}
                priority
              />
            }
            name={claus?.name ?? 'クラウス'}
            title="調査レポートを開けませんでした"
            description="一時的な問題が起きています。再読み込みするか、取材先に戻ってもう一度お試しください。"
            tone="soft"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={reset}
              className={getButtonClass('primary', 'px-6 py-3 text-sm')}
            >
              もう一度試す
            </button>
            <Link
              href="/projects"
              className={getButtonClass('secondary', 'px-6 py-3 text-sm')}
            >
              取材先一覧へ戻る
            </Link>
          </div>
        </div>
      </div>
  )
}
