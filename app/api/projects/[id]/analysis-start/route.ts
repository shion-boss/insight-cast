import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMemberRole } from '@/lib/project-members'
import { NextRequest, NextResponse } from 'next/server'
import { isFreePlanLocked } from '@/lib/plans'
import { checkRateLimit } from '@/lib/api-usage'

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

  // owner / editor を許可（viewer は不可）
  const { data: project } = await supabase
    .from('projects')
    .select('id, status, user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const isOwner = project.user_id === user.id
  const memberRole = isOwner ? null : await getMemberRole(supabase, id, user.id)
  const canEdit = isOwner || memberRole === 'editor'
  if (!canEdit) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  if (project.status === 'report_ready' && !force) {
    return NextResponse.json({ status: 'report_ready' })
  }

  // fetch_failed は force なしで再試行可能にする（audit が存在しないため削除不要）
  const isFetchFailed = project.status === 'fetch_failed'

  // 課金プラン制限はオーナーの契約状況で判定する
  if (await isFreePlanLocked(supabase, project.user_id)) {
    return NextResponse.json({ error: 'free_plan_locked' }, { status: 403 })
  }

  if (!(await checkRateLimit(user.id, '/api/projects/[id]/analyze')).allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 })
  }

  // editor は projects/hp_audits/competitor_analyses への書き込み RLS を持たないので admin client で実行
  const adminSupabase = createAdminClient()

  if (force && !isFetchFailed) {
    const { data: auditRow } = await adminSupabase
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
    const { error: deleteAuditError } = await adminSupabase
      .from('hp_audits')
      .delete()
      .eq('project_id', id)

    if (deleteAuditError) {
      return NextResponse.json({ error: 'failed to clear hp audit' }, { status: 500 })
    }

    const { error: deleteCompetitorError } = await adminSupabase
      .from('competitor_analyses')
      .delete()
      .eq('project_id', id)

    if (deleteCompetitorError) {
      return NextResponse.json({ error: 'failed to clear competitor analyses' }, { status: 500 })
    }
  }

  const { error } = await adminSupabase
    .from('projects')
    .update({ status: 'analyzing' })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'failed to mark analyzing' }, { status: 500 })
  }

  return NextResponse.json({ status: 'analyzing' })
}
