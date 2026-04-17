import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { completeOnboarding } from '@/lib/actions/onboarding'
import { FieldLabel, PrimaryButton, StateCard, TextInput } from '@/components/ui'

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

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <StateCard
            icon="🐱"
            title="最初に、分かる範囲だけ教えてください。"
            description="あとからいつでも直せるので、まずは取材班が動きやすい形に整えます。"
          />
        </div>

        <form action={completeOnboarding} className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
          <div>
            <FieldLabel required>店舗・企業名</FieldLabel>
            <TextInput type="text" name="name" required placeholder="例: 山田工務店" />
          </div>
          <div>
            <FieldLabel required>自社HP URL</FieldLabel>
            <TextInput type="url" name="url" required placeholder="https://example.com" />
          </div>
          <div>
            <FieldLabel>業種</FieldLabel>
            <TextInput type="text" name="industry_memo" placeholder="例: 地域の工務店、カフェ、整骨院" />
          </div>
          <div>
            <FieldLabel>地域</FieldLabel>
            <TextInput type="text" name="location" placeholder="例: 大阪府吹田市" />
          </div>
          <PrimaryButton type="submit" className="w-full py-3 text-sm mt-2">
            取材の準備を進める
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}
