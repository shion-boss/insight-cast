import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportClient from './ReportClient'
import { Breadcrumb } from '@/components/ui'
import { isProjectAnalysisReady, resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'
import { getCompetitorInfluentialTopics } from '@/lib/interview-focus-theme'
import { buildBlogFreshnessMetrics, getStoredBlogMetrics, getStoredSiteBlogPosts } from '@/lib/site-blog-support'
import { getMemberRole } from '@/lib/project-members'

export const metadata: Metadata = {
  title: '調査レポート',
  robots: { index: false, follow: false },
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [
    { data: project },
    { data: audit },
    { data: competitors },
    { data: rawCompetitorAnalyses },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, hp_url, status, user_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('hp_audits')
      .select('current_content, strengths, gaps, suggested_themes, raw_data')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('competitors')
      .select('id, url')
      .eq('project_id', id),
    supabase
      .from('competitor_analyses')
      .select('gaps, advantages, competitor_id, raw_data, competitors(url)')
      .eq('project_id', id),
  ])

  if (!project) redirect('/dashboard')

  const isOwner = project.user_id === user.id
  if (!isOwner) {
    const memberRole = await getMemberRole(supabase, id, user.id)
    if (!memberRole) redirect('/dashboard')
  }

  const readiness = isProjectAnalysisReady({
    project,
    competitors: competitors ?? [],
    audit,
    competitorAnalyses: rawCompetitorAnalyses ?? [],
  })

  const resolvedStatus = resolveProjectAnalysisStatus(project.status, readiness.isReady)

  if (isOwner && project.status !== resolvedStatus) {
    await supabase
      .from('projects')
      .update({ status: resolvedStatus })
      .eq('id', id)
      .eq('user_id', user.id)

    redirect(resolvedStatus === 'report_ready' ? `/projects/${id}/report` : `/projects/${id}`)
  }

  const rawData = (audit?.raw_data as Record<string, unknown> | null | undefined) ?? null
  const blogPosts = getStoredSiteBlogPosts(rawData)
  const blogMetrics = getStoredBlogMetrics(rawData) ?? buildBlogFreshnessMetrics(blogPosts)
  const postFrequency = blogMetrics.recentMonthlyCounts
  const siteEvaluation = Array.isArray(rawData?.site_evaluation)
    ? rawData.site_evaluation.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return []
        const key = typeof (entry as { key?: unknown }).key === 'string' ? (entry as { key: string }).key : ''
        const label = typeof (entry as { label?: unknown }).label === 'string' ? (entry as { label: string }).label : ''
        const score = typeof (entry as { score?: unknown }).score === 'number' ? (entry as { score: number }).score : null
        const summary = typeof (entry as { summary?: unknown }).summary === 'string' ? (entry as { summary: string }).summary : ''
        const improvement_hint = typeof (entry as { improvement_hint?: unknown }).improvement_hint === 'string' ? (entry as { improvement_hint: string }).improvement_hint : ''
        if (!key || !label || score === null || !summary) return []
        return [{ key, label, score, summary, improvement_hint }]
      })
    : []
  const toStringList = (value: unknown) =>
    Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
  const trustSignals = toStringList(rawData?.trust_signals)
  const conversionObstacles = toStringList(rawData?.conversion_obstacles)
  const priorityActions = toStringList(rawData?.priority_actions)
  const classificationSummary = rawData && typeof rawData === 'object' && rawData.blog_classification_summary
    ? rawData.blog_classification_summary as Record<string, unknown>
    : null

  type CompetitorAnalysisRow = {
    gaps: string[] | null
    advantages: string[] | null
    competitor_id: string
    raw_data: Record<string, unknown> | null
    competitors: { url: string } | { url: string }[] | null
  }

  const competitorAnalyses = (rawCompetitorAnalyses ?? []).map((ca: CompetitorAnalysisRow) => ({
    ...ca,
    influentialTopics: getCompetitorInfluentialTopics(ca.raw_data),
    competitors: Array.isArray(ca.competitors) ? (ca.competitors[0] ?? null) : ca.competitors,
  }))

  return (
    <>
      <Breadcrumb items={[
        { label: 'プロジェクト一覧', href: '/projects' },
        { label: project.name || project.hp_url, href: `/projects/${id}` },
        { label: '調査結果' },
      ]} />
      <ReportClient
        projectId={id}
        initialStatus={project.status}
        audit={audit}
        competitorAnalyses={competitorAnalyses ?? []}
        interviewerPath={`/projects/${id}/interviewer`}
        postFrequency={postFrequency}
        blogMetrics={blogMetrics}
        siteEvaluation={siteEvaluation}
        trustSignals={trustSignals}
        conversionObstacles={conversionObstacles}
        priorityActions={priorityActions}
        classificationSummary={classificationSummary}
      />
    </>
  )
}
