import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const force = Boolean(body?.force)

  const { data: project } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (project.status === 'report_ready' && !force) {
    return NextResponse.json({ status: 'report_ready' })
  }

  if (force) {
    const { error: deleteAuditError } = await supabase
      .from('hp_audits')
      .delete()
      .eq('project_id', id)
      .eq('project_id', project.id)

    if (deleteAuditError) {
      return NextResponse.json({ error: 'failed to clear hp audit' }, { status: 500 })
    }

    const { error: deleteCompetitorError } = await supabase
      .from('competitor_analyses')
      .delete()
      .eq('project_id', id)

    if (deleteCompetitorError) {
      return NextResponse.json({ error: 'failed to clear competitor analyses' }, { status: 500 })
    }
  }

  const { error } = await supabase
    .from('projects')
    .update({ status: 'analyzing' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'failed to mark analyzing' }, { status: 500 })
  }

  return NextResponse.json({ status: 'analyzing' })
}
