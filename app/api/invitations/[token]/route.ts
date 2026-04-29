import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/invitations/[token]
 * 招待トークンの情報を返す（認証不要）
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  // project_invitations テーブルに anon ロールのポリシーがないため Service Role が必要。
  // レスポンスには project名・role・有効期限のみを返し、email など個人情報は含めない。
  // トークンは32バイトHEX（256bit）なので総当たりは現実的に不可能。
  const adminSupabase = createAdminClient()

  const { data: invitation } = await adminSupabase
    .from('project_invitations')
    .select('id, project_id, email, role, expires_at, accepted')
    .eq('token', token)
    .maybeSingle()

  if (!invitation) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (invitation.accepted) {
    return NextResponse.json({ error: 'already_accepted' }, { status: 404 })
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'expired' }, { status: 404 })
  }

  // プロジェクト名を取得
  const { data: project } = await adminSupabase
    .from('projects')
    .select('name, hp_url')
    .eq('id', invitation.project_id)
    .single()

  const projectName = project?.name ?? project?.hp_url ?? '取材先'

  return NextResponse.json({
    projectName,
    role: invitation.role,
    expiresAt: invitation.expires_at,
  })
}
