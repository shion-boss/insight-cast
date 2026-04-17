import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportClient from './ReportClient'
import { PageHeader } from '@/components/ui'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, hp_url, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  const { data: audit } = await supabase
    .from('hp_audits')
    .select('current_content, strengths, gaps, suggested_themes')
    .eq('project_id', id)
    .single()

  const { data: rawCompetitorAnalyses } = await supabase
    .from('competitor_analyses')
    .select('gaps, advantages, competitor_id, competitors(url)')
    .eq('project_id', id)

  type CompetitorAnalysisRow = {
    gaps: string[] | null
    advantages: string[] | null
    competitor_id: string
    competitors: { url: string } | { url: string }[] | null
  }

  const competitorAnalyses = (rawCompetitorAnalyses ?? []).map((ca: CompetitorAnalysisRow) => ({
    ...ca,
    competitors: Array.isArray(ca.competitors) ? (ca.competitors[0] ?? null) : ca.competitors,
  }))

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader title="Insight Cast" backHref={`/projects/${id}`} backLabel="← 取材先の管理" />

      <ReportClient
        projectId={id}
        initialStatus={project.status}
        audit={audit}
        competitorAnalyses={competitorAnalyses ?? []}
        interviewerPath={`/projects/${id}/interviewer`}
      />
    </div>
  )
}
