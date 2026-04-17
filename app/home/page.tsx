import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { getCharacter } from '@/lib/characters'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: sessions }] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user!.id).single(),
    supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .eq('type', 'interview')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <h1 className="font-semibold text-stone-800">Insight Cast</h1>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-sm text-stone-400 hover:text-stone-600">
            {profile?.name ?? user?.email}
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-stone-400 hover:text-stone-600">
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-stone-700">インタビュー</h2>
          <Link
            href="/interview/new"
            className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
          >
            + 新しくはじめる
          </Link>
        </div>

        {sessions && sessions.length > 0 ? (
          <ul className="space-y-3">
            {sessions.map((s) => {
              const char = getCharacter(s.character_id)
              return (
                <li key={s.id}>
                  <Link
                    href={s.status === 'completed' ? `/interview/${s.id}/output` : `/interview/${s.id}`}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-stone-100 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{char?.emoji ?? '🎙️'}</span>
                      <div>
                        <p className="text-sm font-medium text-stone-800">{char?.name ?? s.character_id}</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {new Date(s.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      s.status === 'completed'
                        ? 'bg-stone-100 text-stone-500'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {s.status === 'completed' ? '完了' : '進行中'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-center py-16 text-stone-400">
            <p className="text-4xl mb-4">🐱</p>
            <p className="text-sm">まだインタビューがありません</p>
            <p className="text-sm mt-1">取材班を呼んで、お店の魅力を引き出しましょう</p>
          </div>
        )}
      </main>
    </div>
  )
}
