import Link from 'next/link'
import { CHARACTERS } from '@/lib/characters'
import { createInterview } from '@/lib/actions/interviews'
import {
  INTERVIEW_FOCUS_THEME_MAX_LENGTH,
  getCompetitorInterviewThemeSuggestions,
  getInterviewSuggestedThemes,
} from '@/lib/interview-focus-theme'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CharacterAvatar, DevAiLabel, InterviewerSpeech, PageHeader } from '@/components/ui'

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function InterviewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
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

  const selectedCharacterId = getSearchParamValue(query.cast)
  const error = getSearchParamValue(query.error)
  const selectedCharacter = CHARACTERS.find((char) => char.id === selectedCharacterId && char.available) ?? null

  const { data: audit } = await supabase
    .from('hp_audits')
    .select('suggested_themes')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const suggestedThemes = getInterviewSuggestedThemes(audit?.suggested_themes)

  const { data: rawCompetitorAnalyses } = await supabase
    .from('competitor_analyses')
    .select('raw_data, competitors(url)')
    .eq('project_id', id)

  const competitorThemeSuggestions = getCompetitorInterviewThemeSuggestions(
    ((rawCompetitorAnalyses ?? []) as Array<{
      raw_data: Record<string, unknown> | null
      competitors: { url: string } | { url: string }[] | null
    }>),
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader title={selectedCharacter ? 'テーマを決める' : '取材班を選ぶ'} backHref={`/projects/${id}`} backLabel="← 取材先の管理" />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={selectedCharacter?.icon48 ?? CHARACTERS[0]?.icon48}
                alt={selectedCharacter ? `${selectedCharacter.name}のアイコン` : '取材班のアイコン'}
                emoji={selectedCharacter?.emoji ?? CHARACTERS[0]?.emoji}
                size={48}
              />
            )}
            name={selectedCharacter?.name ?? 'Insight Cast'}
            title={selectedCharacter ? '今回は、どんなテーマから話しましょうか？' : '今日は、どの取材班に来てもらいましょうか？'}
            description={selectedCharacter
              ? '自由に書いても、AIのおすすめから選んでも、まだ決めずに始めても大丈夫です。'
              : '得意な聞き方がそれぞれ違います。気になる相手を選ぶだけで大丈夫です。'}
            tone="soft"
          />
        </div>

        {!selectedCharacter ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
            {CHARACTERS.filter((char) => char.available).map((char) => (
              <Link
                key={char.id}
                href={`/projects/${id}/interviewer?cast=${char.id}`}
                className="block rounded-xl border border-stone-200 bg-white p-5 text-left transition-colors hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
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
                  <DevAiLabel>このキャストで進む</DevAiLabel>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mb-8 space-y-6">
            <section className="rounded-2xl border border-stone-200 bg-white/90 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <CharacterAvatar
                    src={selectedCharacter.icon96}
                    alt={`${selectedCharacter.name}のアイコン`}
                    emoji={selectedCharacter.emoji}
                    size={64}
                    className="border-stone-100"
                  />
                  <div>
                    <p className="text-sm font-medium text-stone-800">{selectedCharacter.name}</p>
                    <p className="mt-1 text-xs text-stone-400">{selectedCharacter.species}</p>
                    <p className="mt-3 text-sm text-stone-600 leading-relaxed">{selectedCharacter.description}</p>
                    <p className="mt-2 text-xs font-medium text-stone-500">得意: {selectedCharacter.specialty}</p>
                  </div>
                </div>
                <Link
                  href={`/projects/${id}/interviewer`}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-500 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                >
                  選び直す
                </Link>
              </div>
            </section>

            {error === 'theme-required' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                テーマを自由入力する場合は内容を入れてください。決まっていなければ「テーマはお任せ」でも始められます。
              </div>
            )}

            <section className="rounded-2xl border border-stone-200 bg-white/90 p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-stone-500">AIがおすすめするテーマ</p>
                <p className="mt-1 text-sm text-stone-500">
                  ホームページの内容から、先に深めるとよさそうなテーマを5つまで並べます。
                </p>
              </div>

              {suggestedThemes.length > 0 ? (
                <div className="grid gap-3">
                  {suggestedThemes.map((theme) => (
                    <form key={theme} action={createInterview.bind(null, id)}>
                      <input type="hidden" name="interviewerType" value={selectedCharacter.id} />
                      <input type="hidden" name="focusThemeMode" value="suggested" />
                      <input type="hidden" name="focusTheme" value={theme} />
                      <button
                        type="submit"
                        className="w-full cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-left transition-colors hover:border-amber-300 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">Recommended</p>
                        <p className="mt-2 text-sm leading-relaxed text-stone-700">{theme}</p>
                        <p className="mt-3 text-xs text-stone-400">このテーマでインタビューを始める</p>
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-500">
                  まだおすすめテーマは準備できていません。いまは自由入力か、お任せで始められます。
                </div>
              )}
            </section>

            {competitorThemeSuggestions.length > 0 && (
              <section className="rounded-2xl border border-stone-200 bg-white/90 p-5">
                <div className="mb-4">
                  <p className="text-xs font-medium text-stone-500">競合から見えてくるテーマ</p>
                  <p className="mt-1 text-sm text-stone-500">
                    競合が前面に出している切り口です。違う意見なら違いを話せますし、同じ方向なら自社で足りない発信テーマとして使えます。
                  </p>
                </div>

                <div className="grid gap-3">
                  {competitorThemeSuggestions.map((suggestion) => (
                    <form key={suggestion.theme} action={createInterview.bind(null, id)}>
                      <input type="hidden" name="interviewerType" value={selectedCharacter.id} />
                      <input type="hidden" name="focusThemeMode" value="suggested" />
                      <input type="hidden" name="focusTheme" value={suggestion.theme} />
                      <button
                        type="submit"
                        className="w-full cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-teal-700">Competitive Signal</p>
                        <p className="mt-2 text-sm leading-relaxed text-stone-700">{suggestion.theme}</p>
                        <div className="mt-3 space-y-2">
                          {suggestion.sources.map((source, index) => (
                            <div key={`${suggestion.theme}-${source.url ?? 'source'}-${index}`} className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
                              {source.url && (
                                <p className="truncate text-[11px] text-stone-400">{source.url}</p>
                              )}
                              <p className="mt-1 text-xs leading-relaxed text-stone-500">{source.summary}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-stone-400">このテーマでインタビューを始める</p>
                      </button>
                    </form>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-stone-200 bg-white/90 p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-stone-500">自由にテーマを書く</p>
                <p className="mt-1 text-sm text-stone-500">
                  すでに聞きたい切り口があるなら、そのまま短く入れてください。
                </p>
              </div>

              <form action={createInterview.bind(null, id)} className="space-y-3">
                <input type="hidden" name="interviewerType" value={selectedCharacter.id} />
                <input type="hidden" name="focusThemeMode" value="custom" />
                <label className="block">
                  <span className="sr-only">テーマ</span>
                  <input
                    type="text"
                    name="focusTheme"
                    required
                    maxLength={INTERVIEW_FOCUS_THEME_MAX_LENGTH}
                    placeholder="例: 初めて相談する人が安心できる理由"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-400 focus:bg-white"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-stone-800 px-4 py-3 text-sm text-white transition-colors hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                >
                  このテーマで始める
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white/90 p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-stone-500">テーマはお任せ</p>
                <p className="mt-1 text-sm text-stone-500">
                  まだ切り口が決まっていなくても大丈夫です。これまで通り、会話しながら価値を一緒に見つけます。
                </p>
              </div>

              <form action={createInterview.bind(null, id)}>
                <input type="hidden" name="interviewerType" value={selectedCharacter.id} />
                <input type="hidden" name="focusThemeMode" value="omakase" />
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 transition-colors hover:border-stone-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                >
                  お任せでインタビューを始める
                </button>
              </form>
            </section>
          </div>
        )}

        {/* coming soon */}
        <div>
          <p className="text-xs text-stone-500 mb-3">これから来てもらえる取材班</p>
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
