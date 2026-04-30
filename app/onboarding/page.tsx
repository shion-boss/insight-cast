export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
export const metadata: Metadata = { robots: { index: false, follow: false } }

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { OnboardingForm } from './OnboardingForm'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .single()

  const params = await searchParams
  const next = params.next?.startsWith('/') ? params.next : '/dashboard'
  const hasError = params.error === '1'

  if (profile?.onboarded) redirect(next)
  const mint = getCharacter('mint')

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={mint?.icon48}
                alt={`${mint?.name ?? 'インタビュアー'}のアイコン`}
                emoji={mint?.emoji}
                size={48}
              />
            )}
            name={mint?.name ?? 'インタビュアー'}
            title="最初に、分かる範囲だけ教えてください。"
            description="まずはお呼びするお名前だけで大丈夫です。HPはあとで登録できます。"
            tone="soft"
          />
        </div>

        <OnboardingForm next={next} hasError={hasError} />
      </div>
    </div>
  )
}
