import { createClient } from '@/lib/supabase/server'
import { getStoredSiteBlogPosts, selectRelevantBlogPosts } from '@/lib/site-blog-support'
import { NextRequest, NextResponse } from 'next/server'

type CompetitorAnalysisRow = {
  raw_data: Record<string, unknown> | null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  const { interviewId, question } = body as { interviewId?: string; question?: string }
  if (!interviewId || typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }
  if (question.length > 500) {
    return NextResponse.json({ error: 'question too long' }, { status: 400 })
  }

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, project_id, interviews_project:projects(user_id)')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single()

  if (!interview) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const joinedProject = interview.interviews_project as { user_id: string } | { user_id: string }[] | null
  const projectOwner = Array.isArray(joinedProject) ? (joinedProject[0] ?? null) : joinedProject
  if (projectOwner?.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: auditRow } = await supabase
    .from('hp_audits')
    .select('raw_data')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: competitorRows } = await supabase
    .from('competitor_analyses')
    .select('raw_data')
    .eq('project_id', projectId)

  const ownPosts = getStoredSiteBlogPosts((auditRow?.raw_data as Record<string, unknown> | null | undefined) ?? null)
  const competitorPosts = (competitorRows ?? [])
    .flatMap((row) => getStoredSiteBlogPosts((row as CompetitorAnalysisRow).raw_data))

  if (ownPosts.length === 0 && competitorPosts.length === 0) {
    return NextResponse.json({ ownPosts: [], competitorPosts: [] })
  }

  const selected = await selectRelevantBlogPosts({
    query: question.trim(),
    ownPosts,
    competitorPosts,
    maxOwnPosts: 3,
    maxCompetitorPosts: 3,
  })

  return NextResponse.json(selected)
}
