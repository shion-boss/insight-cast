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
import { CharacterAvatar, InterviewerSpeech, PageHeader } from '@/components/ui'
import { getUserPlan, getPlanLimits, isFreePlanLocked } from '@/lib/plans'
import { getCharacter } from '@/lib/characters'

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

  const userPlan = await getUserPlan(supabase, user.id)
  const planLimits = getPlanLimits(userPlan)
  const freeLocked = await isFreePlanLocked(supabase, user.id)

  const userProjectIds = (await supabase.from('projects').select('id').eq('user_id', user.id)).data?.map((p) => p.id) ?? []

  let isInterviewLimitReached = false
  if (planLimits.lifetimeInterviewLimit !== null) {
    const { count: lifetimeCount } = await supabase
      .from('interviews')
      .select('id', { count: 'exact', head: true })
      .in('project_id', userProjectIds.length > 0 ? userProjectIds : ['__none__'])
    isInterviewLimitReached = (lifetimeCount ?? 0) >= planLimits.lifetimeInterviewLimit
  } else {
    const now = new Date()
    const thisMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const { count: thisMonthInterviewCount } = await supabase
      .from('interviews')
      .select('id', { count: 'exact', head: true })
      .in('project_id', userProjectIds.length > 0 ? userProjectIds : ['__none__'])
      .gte('created_at', `${thisMonthKey}-01`)
    isInterviewLimitReached = (thisMonthInterviewCount ?? 0) >= planLimits.monthlyInterviewLimit
  }

  const mint = getCharacter('mint')

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
      <PageHeader title={selectedCharacter ? 'テーマを決める' : 'キャストを選ぶ'} backHref={`/projects/${id}`} backLabel="← 取材先の管理" />

      <div className="max-w-2xl mx-auto px-6 py-10">
        {freeLocked && (
          <div className="mb-6">
            <InterviewerSpeech
              icon={(
                <CharacterAvatar
                  src={mint?.icon48}
                  alt={`${mint?.name ?? 'ミント'}のアイコン`}
                  emoji={mint?.emoji}
                  size={48}
                />
              )}
              name={mint?.name ?? 'ミント'}
              title="無料体験が終了しました。"
              description="記事を3本作成していただけましたか？お役に立てていれば嬉しいです。引き続きご利用いただくには、プランへのアップグレードが必要です。これまでのデータはすべて残っています。"
              tone="soft"
            />
            <div className="mt-4 flex gap-3">
              <Link
                href="/pricing?reason=free_plan_locked"
                className="inline-block rounded-xl bg-[var(--accent)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[var(--accent-h)] transition-colors"
              >
                プランを見る →
              </Link>
              <Link
                href={`/projects/${id}`}
                className="inline-block rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors"
              >
                取材先に戻る
              </Link>
            </div>
          </div>
        )}

        {!freeLocked && isInterviewLimitReached && (
          <div className="mb-6">
            <InterviewerSpeech
              icon={(
                <CharacterAvatar
                  src={mint?.icon48}
                  alt={`${mint?.name ?? 'ミント'}のアイコン`}
                  emoji={mint?.emoji}
                  size={48}
                />
              )}
              name={mint?.name ?? 'ミント'}
              title={planLimits.lifetimeInterviewLimit !== null ? '無料体験の取材回数を使い切りました。' : '今月の取材回数の上限に達しています。'}
              description={planLimits.lifetimeInterviewLimit !== null
                ? '引き続き取材するには、プランへのアップグレードが必要です。これまでのデータはすべて残っています。'
                : '引き続き取材するには、プランをアップグレードするか、来月をお待ちください。'}
              tone="soft"
            />
            <div className="mt-4">
              <Link
                href="/pricing?reason=interview_limit"
                className="inline-block rounded-xl bg-[var(--accent)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[var(--accent-h)] transition-colors"
              >
                プランを見る →
              </Link>
            </div>
          </div>
        )}

        <div className="mb-8">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={selectedCharacter?.icon48 ?? CHARACTERS[0]?.icon48}
                alt={selectedCharacter ? `${selectedCharacter.name}のアイコン` : 'キャストのアイコン'}
                emoji={selectedCharacter?.emoji ?? CHARACTERS[0]?.emoji}
                size={48}
              />
            )}
            name={selectedCharacter?.name ?? 'Insight Cast'}
            title={selectedCharacter ? '今回は、どんなテーマから話しましょうか？' : '今日は、どのキャストと話しましょうか？'}
            description={selectedCharacter
              ? '自由に書いても、AIのおすすめから選んでも、まだ決めずに始めても大丈夫です。'
              : '得意な引き出し方がそれぞれ違います。いま聞きたいテーマに近い相手を選べば大丈夫です。'}
            tone="soft"
          />
        </div>

        {!selectedCharacter ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
            {CHARACTERS.filter((char) => char.available).map((char) => (
              <Link
                key={char.id}
                href={`/projects/${id}/interviewer?cast=${char.id}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-colors hover:border-[var(--border2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                <CharacterAvatar
                  src={char.icon96}
                  alt={`${char.name}のアイコン`}
                  emoji={char.emoji}
                  size={64}
                  className="mb-3 border-[var(--border)]"
                />
                <div className="font-medium text-[var(--text)] text-sm">{char.name}</div>
                <div className="text-xs text-[var(--text3)] mt-0.5">{char.species}</div>
                {char.label && (
                  <div className="text-xs text-amber-600 mt-1 font-medium">{char.label}</div>
                )}
                <div className="text-xs text-[var(--text3)] mt-2 leading-relaxed">{char.description}</div>
                <div className="text-xs text-[var(--text2)] mt-3 font-medium">得意テーマ: {char.specialty}</div>
                <div className="mt-4 text-xs text-center py-3 min-h-[44px] flex items-center justify-center bg-[var(--accent)] text-white rounded-lg">
                  このキャストと話す →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mb-8 space-y-6">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <CharacterAvatar
                    src={selectedCharacter.icon96}
                    alt={`${selectedCharacter.name}のアイコン`}
                    emoji={selectedCharacter.emoji}
                    size={64}
                    className="border-[var(--border)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{selectedCharacter.name}</p>
                    <p className="mt-1 text-xs text-[var(--text3)]">{selectedCharacter.species}</p>
                    <p className="mt-3 text-sm text-[var(--text2)] leading-relaxed">{selectedCharacter.description}</p>
                    <p className="mt-2 text-xs font-medium text-[var(--text2)]">得意テーマ: {selectedCharacter.specialty}</p>
                  </div>
                </div>
                <Link
                  href={`/projects/${id}/interviewer`}
                  className="rounded-lg border border-[var(--border)] px-3 py-2.5 min-h-[44px] text-xs text-[var(--text3)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  選び直す
                </Link>
              </div>
            </section>

            {(error === 'monthly_limit' || error === 'lifetime_limit') && (
              <div className="rounded-xl border border-[var(--err-l)] bg-[var(--err-l)] px-4 py-3 text-sm text-[var(--err)]">
                {error === 'lifetime_limit'
                  ? '無料体験の取材回数を使い切りました。プランへのアップグレードが必要です。'
                  : '今月の取材回数の上限に達しました。プランをアップグレードするか、来月またお試しください。'}
              </div>
            )}

            {error === 'theme-required' && (
              <div className="rounded-xl border border-[var(--warn-l)] bg-[var(--warn-l)] px-4 py-3 text-sm text-[var(--warn)]">
                テーマを自由入力する場合は内容を入れてください。決まっていなければ「テーマはお任せ」でも始められます。
              </div>
            )}

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--text2)]">AIがおすすめするテーマ</p>
                <p className="mt-1 text-sm text-[var(--text3)]">
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
                        className="w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-4 py-4 text-left transition-colors hover:border-[var(--warn)]/40 hover:bg-[var(--warn-l)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--warn)]">Recommended</p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">{theme}</p>
                        <p className="mt-3 text-xs text-[var(--text3)]">このテーマでインタビューを始める</p>
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg2)] px-4 py-4 text-sm text-[var(--text3)]">
                  まだおすすめテーマは準備できていません。いまは自由入力か、お任せで始められます。
                </div>
              )}
            </section>

            {competitorThemeSuggestions.length > 0 && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5">
                <div className="mb-4">
                  <p className="text-xs font-medium text-[var(--text2)]">競合から見えてくるテーマ</p>
                  <p className="mt-1 text-sm text-[var(--text3)]">
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
                        className="w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-4 py-4 text-left transition-colors hover:border-[var(--ok)]/40 hover:bg-[var(--ok-l)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ok)]">Competitive Signal</p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">{suggestion.theme}</p>
                        <div className="mt-3 space-y-2">
                          {suggestion.sources.map((source, index) => (
                            <div key={`${suggestion.theme}-${source.url ?? 'source'}-${index}`} className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
                              {source.url && (
                                <p className="truncate text-[11px] text-[var(--text3)]">{source.url}</p>
                              )}
                              <p className="mt-1 text-xs leading-relaxed text-[var(--text3)]">{source.summary}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-[var(--text3)]">このテーマでインタビューを始める</p>
                      </button>
                    </form>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--text2)]">自由にテーマを書く</p>
                <p className="mt-1 text-sm text-[var(--text3)]">
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
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-4 py-3 text-sm text-[var(--text2)] outline-none transition-colors placeholder:text-[var(--text3)] focus:border-amber-400 focus:bg-white"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-[var(--accent)] px-4 py-3 text-sm text-white transition-colors hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  このテーマでインタビューを始める
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--text2)]">テーマはお任せ</p>
                <p className="mt-1 text-sm text-[var(--text3)]">
                  まだ切り口が決まっていなくても大丈夫です。これまで通り、会話しながら価値を一緒に見つけます。
                </p>
              </div>

              <form action={createInterview.bind(null, id)}>
                <input type="hidden" name="interviewerType" value={selectedCharacter.id} />
                <input type="hidden" name="focusThemeMode" value="omakase" />
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-4 py-3 text-sm text-[var(--text2)] transition-colors hover:border-[var(--border2)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  お任せでインタビューを始める
                </button>
              </form>
            </section>
          </div>
        )}

        {/* coming soon */}
        <div>
          <p className="text-xs text-[var(--text3)] mb-3">これから選べるキャスト</p>
          <div className="grid grid-cols-3 gap-3">
            {CHARACTERS.filter(c => !c.available).map((char) => (
              <div key={char.id} className="p-4 bg-white rounded-2xl border border-[var(--border)] opacity-40">
                <CharacterAvatar
                  src={char.icon48}
                  alt={`${char.name}のアイコン`}
                  emoji={char.emoji}
                  size={44}
                  className="mb-2 grayscale"
                />
                <div className="text-xs font-medium text-[var(--text2)]">{char.name}</div>
                {char.label && <div className="text-xs text-[var(--text3)] mt-0.5">{char.label}</div>}
                <div className="text-xs text-[var(--text3)] mt-2">準備を進めています</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
