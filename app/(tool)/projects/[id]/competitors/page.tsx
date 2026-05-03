import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import CompetitorsForm from './CompetitorsForm'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import { loadProjectCompetitorContext } from '@/lib/project-competitor-context'
import { Breadcrumb, CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { getUserPlan, getPlanLimits } from '@/lib/plans'
import { getMemberRole } from '@/lib/project-members'

export const metadata: Metadata = {
  title: '競合サイトの設定',
  robots: { index: false, follow: false },
}

export default async function CompetitorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, hp_url, user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!project) redirect('/dashboard')

  // 権限チェック: 競合設定はオーナー専用。メンバーはプロジェクト詳細へ redirect
  const isOwner = project.user_id === user.id
  if (!isOwner) {
    const memberRole = await getMemberRole(supabase, id, user.id)
    if (!memberRole) redirect('/dashboard')
    redirect(`/projects/${id}`)
  }

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
    <div className="max-w-lg">
      <Breadcrumb items={[
        { label: 'プロジェクト一覧', href: '/projects' },
        { label: project.name || project.hp_url, href: `/projects/${id}` },
        { label: '参考HPを見直す' },
      ]} />
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
  )
}
