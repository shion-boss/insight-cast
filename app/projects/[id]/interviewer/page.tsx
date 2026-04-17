import { CHARACTERS } from '@/lib/characters'
import { createInterview } from '@/lib/actions/interviews'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CharacterAvatar, DevAiLabel, InterviewerSpeech, PageHeader } from '@/components/ui'

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
      <PageHeader title="Insight Cast" backHref={`/projects/${id}`} backLabel="← 取材先の管理" />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={CHARACTERS[0]?.icon48}
                alt="取材班のアイコン"
                emoji={CHARACTERS[0]?.emoji}
                size={48}
              />
            )}
            name="Insight Cast"
            title="今日は、どの取材班に来てもらいましょうか？"
            description="得意な聞き方がそれぞれ違います。気になる相手を選ぶだけで大丈夫です。"
            tone="soft"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {CHARACTERS.filter(c => c.available).map((char) => (
            <form key={char.id} action={createInterview.bind(null, id, char.id)}>
              <button
                type="submit"
                className="w-full text-left p-5 bg-white rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 cursor-pointer transition-all"
              >
                <CharacterAvatar
                  src={char.icon96}
                  alt={`${char.name}のアイコン`}
                  emoji={char.emoji}
                  size={64}
                  className="mb-3 border-stone-100"
                />
                <div className="font-medium text-stone-800 text-sm">{char.name}</div>
                <div className="text-xs text-stone-400 mt-0.5">{char.species}</div>
                {char.label && (
                  <div className="text-xs text-amber-600 mt-1 font-medium">{char.label}</div>
                )}
                <div className="text-xs text-stone-500 mt-2 leading-relaxed">{char.description}</div>
                <div className="text-xs text-stone-400 mt-3 font-medium">得意: {char.specialty}</div>
                <div className="mt-4 text-xs text-center py-2 bg-stone-800 text-white rounded-lg">
                  <DevAiLabel>来てもらう</DevAiLabel>
                </div>
              </button>
            </form>
          ))}
        </div>

        {/* coming soon */}
        <div>
          <p className="text-xs text-stone-300 mb-3">これから来てもらえる取材班</p>
          <div className="grid grid-cols-3 gap-3">
            {CHARACTERS.filter(c => !c.available).map((char) => (
              <div key={char.id} className="p-4 bg-white rounded-xl border border-stone-100 opacity-40">
                <CharacterAvatar
                  src={char.icon48}
                  alt={`${char.name}のアイコン`}
                  emoji={char.emoji}
                  size={44}
                  className="mb-2 grayscale"
                />
                <div className="text-xs font-medium text-stone-600">{char.name}</div>
                {char.label && <div className="text-xs text-stone-400 mt-0.5">{char.label}</div>}
                <div className="text-xs text-stone-300 mt-2">準備を進めています</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
