import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportClient from './ReportClient'
import { PageHeader } from '@/components/ui'
import { isProjectAnalysisReady, resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'
import { getCompetitorInfluentialTopics } from '@/lib/interview-focus-theme'

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

  // 投稿頻度集計
  type BlogPost = { url?: unknown; title?: unknown }
  const blogPosts: BlogPost[] = Array.isArray(
    (audit?.raw_data as Record<string, unknown> | null | undefined)?.blog_posts
  )
    ? ((audit!.raw_data as Record<string, unknown>).blog_posts as BlogPost[])
    : []

  function extractYearMonth(post: BlogPost): string | null {
    const url = typeof post.url === 'string' ? post.url : ''
    const title = typeof post.title === 'string' ? post.title : ''

    // 優先度1: /2024/03 または /2024-03
    const m1 = url.match(/[/_-](\d{4})[/_-](0[1-9]|1[0-2])(?:[/_-]|$)/)
    if (m1) return `${m1[1]}-${m1[2]}`

    // 優先度2: 8桁数字 20240315
    const m2 = url.match(/(\d{4})(0[1-9]|1[0-2])\d{2}/)
    if (m2) return `${m2[1]}-${m2[2]}`

    // 優先度3: タイトル内 2024年3月
    const m3 = title.match(/(\d{4})年(\d{1,2})月/)
    if (m3) return `${m3[1]}-${m3[2].padStart(2, '0')}`

    return null
  }

  const freqMap = new Map<string, number>()
  for (const post of blogPosts) {
    const ym = extractYearMonth(post)
    if (ym) freqMap.set(ym, (freqMap.get(ym) ?? 0) + 1)
  }
  const postFrequency = Array.from(freqMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader title="取材先の調査結果" backHref={`/projects/${id}`} backLabel="← 取材先の管理" />

      <ReportClient
        projectId={id}
        initialStatus={project.status}
        audit={audit}
        competitorAnalyses={competitorAnalyses ?? []}
        interviewerPath={`/projects/${id}/interviewer`}
        postFrequency={postFrequency}
      />
    </div>
  )
}
