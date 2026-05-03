import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedNext = searchParams.get('next')
  const inviteToken = searchParams.get('invite_token')
  // '//' から始まるプロトコル相対URLによるオープンリダイレクトを防ぐ
  const next = requestedNext && /^\/(?!\/)/.test(requestedNext) ? requestedNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      const baseOrigin = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin

      // 招待トークンがある場合、メンバー登録処理
      if (inviteToken) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const adminSupabase = createAdminClient()
            const { data: inv } = await adminSupabase
              .from('project_invitations')
              .select('id, project_id, email, role, invited_by, accepted, expires_at')
              .eq('token', inviteToken)
              .eq('accepted', false)
              .gt('expires_at', new Date().toISOString())
              .maybeSingle()

            if (inv && inv.email === user.email) {
              // メンバー追加（既に存在する場合は UNIQUE 違反として正常扱い）
              const { error: memberError } = await adminSupabase
                .from('project_members')
                .insert({
                  project_id: inv.project_id,
                  user_id: user.id,
                  role: inv.role,
                  invited_by: inv.invited_by,
                })
              // UNIQUE 違反 (23505) = 既にメンバー登録済みなので accepted を必ず true に更新する。
              // それ以外のエラーが出ていない場合も accepted を true にする。
              if (!memberError || memberError.code === '23505') {
                await adminSupabase
                  .from('project_invitations')
                  .update({ accepted: true })
                  .eq('id', inv.id)
              } else {
                console.error('[callback] project_members insert error:', memberError.message)
              }
              return NextResponse.redirect(new URL(`/projects/${inv.project_id}`, baseOrigin))
            }
          }
        } catch (err) {
          // 招待処理に失敗してもログイン自体は成功とみなしてダッシュボードへ
          console.error('[callback] invite token processing error:', err)
        }
      }

      return NextResponse.redirect(`${baseOrigin}${next}`)
    }

    console.error('Supabase OAuth callback error:', error.message)

    const errorUrl = new URL('/auth/login', origin)
    errorUrl.searchParams.set('error', 'oauth_callback')
    errorUrl.searchParams.set('message', 'ログインに失敗しました。もう一度お試しください。')
    if (inviteToken) errorUrl.searchParams.set('invite_token', inviteToken)
    return NextResponse.redirect(errorUrl)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_callback${inviteToken ? `&invite_token=${inviteToken}` : ''}`)
}
