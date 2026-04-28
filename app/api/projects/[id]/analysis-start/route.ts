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
    .is('deleted_at', null)
    .single()

  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (project.status === 'report_ready' && !force) {
    return NextResponse.json({ status: 'report_ready' })
  }

  // fetch_failed は force なしで再試行可能にする（audit が存在しないため削除不要）
  const isFetchFailed = project.status === 'fetch_failed'

  // force 再調査の月1回制限（analyzing に書く前に弾く）
  if (force && !isFetchFailed) {
    const { data: auditRow } = await supabase
      .from('hp_audits')
      .select('raw_data')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const analyzedAt = typeof (auditRow?.raw_data as Record<string, unknown> | null)?.analyzed_at === 'string'
      ? new Date((auditRow!.raw_data as Record<string, unknown>).analyzed_at as string)
      : null

    if (analyzedAt && process.env.NODE_ENV !== 'development') {
      const daysSinceLast = (Date.now() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLast < 30) {
        const nextAvailableAt = new Date(analyzedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        return NextResponse.json({ error: 'reanalysis_too_soon', next_available_at: nextAvailableAt }, { status: 429 })
      }
    }
  }

  if (force && !isFetchFailed) {
    const { error: deleteAuditError } = await supabase
      .from('hp_audits')
      .delete()
      .eq('project_id', id)

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
