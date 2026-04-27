'use client'

import { CharacterAvatar, InterviewerSpeech, getButtonClass } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { AppShell } from '@/components/app-shell'
import Link from 'next/link'

export default function InterviewError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const mint = getCharacter('mint')

  return (
    <AppShell title="取材" active="projects" accountLabel="設定" isAdmin={false}>
      <div className="flex min-h-[60vh] items-center justify-center px-6">
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
            title="取材の画面を開けませんでした"
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
    </AppShell>
  )
}
