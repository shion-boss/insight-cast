import { redirect } from 'next/navigation'
import CompetitorsForm from './CompetitorsForm'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import { loadProjectCompetitorContext } from '@/lib/project-competitor-context'
import { CharacterAvatar, InterviewerSpeech, PageHeader } from '@/components/ui'
import { getUserPlan, getPlanLimits } from '@/lib/plans'

export default async function CompetitorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, hp_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/projects')

  const rememberedContext = await loadProjectCompetitorContext({
    supabase,
    userId: user.id,
    projectId: id,
    hpUrl: project.hp_url,
  })

  const { data: competitors } = await supabase
    .from('competitors')
    .select('url')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  const userPlan = await getUserPlan(supabase, user.id)
  const planLimits = getPlanLimits(userPlan)

  const claus = getCharacter('claus')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader title="参考にするHPを見直す" backHref={`/projects/${id}`} backLabel="← 取材先の管理" />

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={claus?.icon48}
                alt={`${claus?.name ?? 'インタビュアー'}のアイコン`}
                emoji={claus?.emoji}
                size={48}
              />
            )}
            name={claus?.name ?? 'インタビュアー'}
            title="参考にするHPは、あとから何度でも見直せます。"
            description="おすすめから選ぶこともできますし、URLを直接入力することもできます。"
            tone="soft"
          />
        </div>

        <CompetitorsForm
          projectId={id}
          projectName={project.name || project.hp_url}
          siteUrl={project.hp_url}
          initialCompetitorUrls={(competitors ?? []).map((competitor) => competitor.url)}
          initialIndustryMemo={rememberedContext.industryMemo}
          initialLocation={rememberedContext.location}
          maxCompetitors={planLimits.maxCompetitorsPerProject}
        />
      </div>
    </div>
  )
}
