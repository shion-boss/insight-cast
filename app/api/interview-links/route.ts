import { createClient } from '@/lib/supabase/server'
import { getUserPlan, getPlanLimits } from '@/lib/plans'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PostBodySchema = z.object({
  projectId: z.string().uuid(),
  interviewerType: z.string().min(1).max(50),
  theme: z.string().min(1).max(200),
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
    .select('id, token, interviewer_type, theme, target_name, target_industry, use_count, max_use_count, is_active, created_at')
    .eq('project_id', projectId)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/interview-links] db error:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ links: links ?? [] })
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

  const { projectId, interviewerType, theme, targetName, targetIndustry } = parsed.data

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

  // トークン生成
  const token = crypto.randomUUID().replace(/-/g, '')

  const { data: link, error } = await supabase
    .from('external_interview_links')
    .insert({
      token,
      project_id: projectId,
      interviewer_type: interviewerType,
      theme,
      target_name: targetName ?? null,
      target_industry: targetIndustry ?? null,
      created_by: user.id,
    })
    .select('id, token, interviewer_type, theme, target_name, target_industry, use_count, max_use_count, is_active, created_at')
    .single()

  if (error || !link) {
    console.error('[POST /api/interview-links] insert error:', error?.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ link }, { status: 201 })
}
