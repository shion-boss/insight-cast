import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-stone-800">Insight Cast</h1>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>
        <p className="text-stone-600">ようこそ、{user?.email}</p>
      </div>
    </div>
  )
}
