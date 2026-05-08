import { createClient } from '@/lib/supabase/server'
import { getUserPlan, getPlanLimits } from '@/lib/plans'
import { findOrCreateIntervieweeByName } from '@/lib/interviewees'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PostBodySchema = z.object({
  projectId: z.string().uuid(),
  interviewerType: z.string().min(1).max(50),
  theme: z.string().min(1).max(200),
  // 既存の取材先を選ぶ場合
  intervieweeId: z.string().uuid().optional(),
  // 新規取材先を作る場合
  targetName: z.string().max(100).optional(),
  targetIndustry: z.string().max(100).optional(),
})

// GET: プロジェクトの外部取材リンク一覧取得
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })

  // プロジェクトのオーナー確認
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { data: links, error } = await supabase
    .from('external_interview_links')
    .select('id, token, interviewer_type, theme, target_name, target_industry, interviewee_id, use_count, max_use_count, is_active, created_at')
    .eq('project_id', projectId)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/interview-links] db error:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  // 各リンクに紐づく取材ステータスを付与する
  // - interview row なし: 'waiting' (取材待ち)
  // - status='completed': 'done' (完了)
  // - その他（in_progress 等）: 'in_progress' (取材中)
  const linkIds = (links ?? []).map((l) => l.id as string)
  const statusMap = new Map<string, 'waiting' | 'in_progress' | 'done'>()
  if (linkIds.length > 0) {
    const { data: interviews } = await supabase
      .from('interviews')
      .select('external_link_id, status, created_at')
      .in('external_link_id', linkIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    // 各 link につき直近の interview のステータスを採用
    for (const iv of interviews ?? []) {
      const linkId = iv.external_link_id as string
      if (statusMap.has(linkId)) continue
      statusMap.set(linkId, iv.status === 'completed' ? 'done' : 'in_progress')
    }
  }
  const enriched = (links ?? []).map((l) => ({
    ...l,
    interview_status: statusMap.get(l.id as string) ?? ('waiting' as const),
  }))

  return NextResponse.json({ links: enriched })
}

// POST: 外部取材リンク発行
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = PostBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad_request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { projectId, interviewerType, theme, intervieweeId, targetName, targetIndustry } = parsed.data

  // プラン確認: business のみ許可
  const plan = await getUserPlan(supabase, user.id)
  const limits = getPlanLimits(plan)
  if (!limits.externalInterviewLinksAllowed) {
    return NextResponse.json({ error: 'plan_not_supported' }, { status: 403 })
  }

  // プロジェクトのオーナー確認
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // 取材先の解決:
  //   1) intervieweeId が来たら既存取材先として解決
  //   2) 来てないが targetName があれば、既存検索 → 無ければ新規作成
  //   3) どちらも無ければ取材先 null（再会機能は使えない）
  let resolvedIntervieweeId: string | null = null
  let resolvedTargetName: string | null = targetName?.trim() || null
  let resolvedTargetIndustry: string | null = targetIndustry?.trim() || null

  if (intervieweeId) {
    const { data: existing } = await supabase
      .from('interviewees')
      .select('id, name, industry, project_id')
      .eq('id', intervieweeId)
      .is('deleted_at', null)
      .maybeSingle()
    if (!existing || existing.project_id !== projectId) {
      return NextResponse.json({ error: 'interviewee_not_found' }, { status: 404 })
    }
    resolvedIntervieweeId = existing.id as string
    resolvedTargetName = existing.name as string
    resolvedTargetIndustry = (existing.industry as string | null) ?? resolvedTargetIndustry
  } else if (resolvedTargetName) {
    const created = await findOrCreateIntervieweeByName(supabase, projectId, resolvedTargetName, {
      industry: resolvedTargetIndustry,
    })
    if (created) {
      resolvedIntervieweeId = created.id
      resolvedTargetName = created.name
    }
  }

  // トークン生成
  const token = crypto.randomUUID().replace(/-/g, '')

  const { data: link, error } = await supabase
    .from('external_interview_links')
    .insert({
      token,
      project_id: projectId,
      interviewer_type: interviewerType,
      theme,
      target_name: resolvedTargetName,
      target_industry: resolvedTargetIndustry,
      interviewee_id: resolvedIntervieweeId,
      created_by: user.id,
    })
    .select('id, token, interviewer_type, theme, target_name, target_industry, interviewee_id, use_count, max_use_count, is_active, created_at')
    .single()

  if (error || !link) {
    console.error('[POST /api/interview-links] insert error:', error?.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ link }, { status: 201 })
}
