import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { completeOnboarding } from '@/lib/actions/onboarding'

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
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🐱</div>
          <h1 className="text-xl font-semibold text-stone-800">はじめに教えてください</h1>
          <p className="text-sm text-stone-400 mt-2">後からプロフィールページで変更できます</p>
        </div>

        <form action={completeOnboarding} className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
          <div>
            <label className="block text-sm text-stone-600 mb-1">店舗・企業名 <span className="text-red-400">*</span></label>
            <input type="text" name="name" required placeholder="例: 山田工務店"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">自社HP URL <span className="text-red-400">*</span></label>
            <input type="url" name="url" required placeholder="https://example.com"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">業種</label>
            <input type="text" name="industry_memo" placeholder="例: 地域の工務店、カフェ、整骨院"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">地域</label>
            <input type="text" name="location" placeholder="例: 大阪府吹田市"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <button type="submit"
            className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 cursor-pointer transition-colors text-sm mt-2">
            はじめる
          </button>
        </form>
      </div>
    </div>
  )
}
