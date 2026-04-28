import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isProjectAnalysisReady, resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids') ?? ''
  const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean)

  if (ids.length === 0) {
    return NextResponse.json({ projects: [] })
  }

  if (ids.length > 50) {
    return NextResponse.json({ error: 'too many ids' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) return NextResponse.json({ error: 'auth_error' }, { status: 500 })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, hp_url, status')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .in('id', ids)

  const ownedIds = (projects ?? []).map((p) => p.id)

  if (ownedIds.length === 0) {
    return NextResponse.json({ projects: [] })
  }

  const { data: audits } = await supabase
    .from('hp_audits')
    .select('id, project_id, raw_data')
    .in('project_id', ownedIds)

  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, project_id, url')
    .in('project_id', ownedIds)

  const { data: competitorAnalyses } = await supabase
    .from('competitor_analyses')
    .select('project_id, competitor_id, raw_data')
    .in('project_id', ownedIds)

  const resolvedProjects = (projects ?? []).map((project) => {
    const readiness = isProjectAnalysisReady({
      project,
      competitors: (competitors ?? []).filter((competitor) => competitor.project_id === project.id),
      audit: (audits ?? []).find((audit) => audit.project_id === project.id),
      competitorAnalyses: (competitorAnalyses ?? []).filter((row) => row.project_id === project.id),
    })

    return { ...project, status: resolveProjectAnalysisStatus(project.status, readiness.isReady) }
  })

  return NextResponse.json({ projects: resolvedProjects })
}
