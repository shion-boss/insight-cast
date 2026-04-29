import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/invitations/[token]/accept
 * 認証済みユーザーが招待トークンを受け入れてプロジェクトメンバーに登録する。
 * メール/パスワードログイン後に招待フローを完了させるために使用する。
 * （Google OAuth の場合は /auth/callback が同等の処理を行う）
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Service role は project_invitations に anon ポリシーがないため必要
  const adminSupabase = createAdminClient()

  const { data: inv } = await adminSupabase
    .from('project_invitations')
    .select('id, project_id, email, role, invited_by, accepted, expires_at')
    .eq('token', token)
    .eq('accepted', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!inv) {
    return NextResponse.json({ error: 'invalid_or_expired' }, { status: 404 })
  }

  // 招待先メールアドレスとログインユーザーのメールが一致するか確認
  if (inv.email !== user.email) {
    return NextResponse.json({ error: 'email_mismatch' }, { status: 403 })
  }

  // メンバー追加
  const { error: memberError } = await adminSupabase
    .from('project_members')
    .insert({
      project_id: inv.project_id,
      user_id: user.id,
      role: inv.role,
      invited_by: inv.invited_by,
    })

  if (memberError) {
    if (memberError.code === '23505') {
      // 既にメンバー登録済み（UNIQUE 違反）→ accepted を true にして正常終了
      await adminSupabase
        .from('project_invitations')
        .update({ accepted: true })
        .eq('id', inv.id)
      return NextResponse.json({ ok: true, projectId: inv.project_id })
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  // 正常 INSERT 成功 → accepted を true に更新
  await adminSupabase
    .from('project_invitations')
    .update({ accepted: true })
    .eq('id', inv.id)

  return NextResponse.json({ ok: true, projectId: inv.project_id })
}
