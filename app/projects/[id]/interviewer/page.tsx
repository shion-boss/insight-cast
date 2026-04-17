import { CHARACTERS } from '@/lib/characters'
import { createInterview } from '@/lib/actions/interviews'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function InterviewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-stone-800">Insight Cast</span>
        <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-600">← 戻る</Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-stone-800">今日はどのインタビュアーに来てもらいますか？</h1>
          <p className="text-sm text-stone-400 mt-1">取材の観点が変わります。気になるインタビュアーを選んでください。</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {CHARACTERS.filter(c => c.available).map((char) => (
            <form key={char.id} action={createInterview.bind(null, id, char.id)}>
              <button
                type="submit"
                className="w-full text-left p-5 bg-white rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-sm cursor-pointer transition-all"
              >
                <div className="text-4xl mb-3">{char.emoji}</div>
                <div className="font-medium text-stone-800 text-sm">{char.name}</div>
                <div className="text-xs text-stone-400 mt-0.5">{char.species}</div>
                {char.label && (
                  <div className="text-xs text-amber-600 mt-1 font-medium">{char.label}</div>
                )}
                <div className="text-xs text-stone-500 mt-2 leading-relaxed">{char.description}</div>
                <div className="text-xs text-stone-400 mt-3 font-medium">得意: {char.specialty}</div>
                <div className="mt-4 text-xs text-center py-2 bg-stone-800 text-white rounded-lg">
                  来てもらう
                </div>
              </button>
            </form>
          ))}
        </div>

        {/* coming soon */}
        <div>
          <p className="text-xs text-stone-300 mb-3">近日公開予定</p>
          <div className="grid grid-cols-3 gap-3">
            {CHARACTERS.filter(c => !c.available).map((char) => (
              <div key={char.id} className="p-4 bg-white rounded-xl border border-stone-100 opacity-40">
                <div className="text-2xl mb-2 grayscale">{char.emoji}</div>
                <div className="text-xs font-medium text-stone-600">{char.name}</div>
                {char.label && <div className="text-xs text-stone-400 mt-0.5">{char.label}</div>}
                <div className="text-xs text-stone-300 mt-2">準備中</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
