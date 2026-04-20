import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { completeOnboarding } from '@/lib/actions/onboarding'
import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, FieldLabel, InterviewerSpeech, PrimaryButton, TextInput } from '@/components/ui'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .single()

  if (profile?.onboarded) redirect('/dashboard')
  const mint = getCharacter('mint')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)] flex items-center justify-center p-4">
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
            description="まずはお呼びするお名前だけで大丈夫です。取材先のホームページは、あとで登録できます。"
            tone="soft"
          />
        </div>

        <form action={completeOnboarding} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 space-y-4">
          <div>
            <FieldLabel required>お名前</FieldLabel>
            <TextInput type="text" name="name" required placeholder="例: 山田さん" />
          </div>
          <PrimaryButton type="submit" className="w-full py-3 text-sm mt-2">
            はじめる
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}
