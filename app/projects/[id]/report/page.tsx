import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportClient from './ReportClient'
import { PageHeader } from '@/components/ui'
import { isProjectAnalysisReady, resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'

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
    .select('current_content, strengths, gaps, suggested_themes, raw_data')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, url')
    .eq('project_id', id)

  const { data: rawCompetitorAnalyses } = await supabase
    .from('competitor_analyses')
    .select('gaps, advantages, competitor_id, raw_data, competitors(url)')
    .eq('project_id', id)

  const readiness = isProjectAnalysisReady({
    project,
    competitors: competitors ?? [],
    audit,
    competitorAnalyses: rawCompetitorAnalyses ?? [],
  })

  const resolvedStatus = resolveProjectAnalysisStatus(project.status, readiness.isReady)

  if (project.status !== resolvedStatus) {
    await supabase
      .from('projects')
      .update({ status: resolvedStatus })
      .eq('id', id)
      .eq('user_id', user.id)

    redirect(resolvedStatus === 'report_ready' ? `/projects/${id}/report` : `/projects/${id}`)
  }

  type CompetitorAnalysisRow = {
    gaps: string[] | null
    advantages: string[] | null
    competitor_id: string
    raw_data: Record<string, unknown> | null
    competitors: { url: string } | { url: string }[] | null
  }

  const competitorAnalyses = (rawCompetitorAnalyses ?? []).map((ca: CompetitorAnalysisRow) => ({
    ...ca,
    competitors: Array.isArray(ca.competitors) ? (ca.competitors[0] ?? null) : ca.competitors,
  }))

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader title="取材先の調査結果" backHref={`/projects/${id}`} backLabel="← 取材先の管理" />

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
