import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/google?project_id=xxx
 *
 * Google OAuth 認可 URL へリダイレクトする。
 * state に projectId を入れてコールバック時に参照する。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')

  if (!projectId) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
  }

  // 認証チェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // プロジェクトの所有権確認
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!project) {
    return NextResponse.json({ error: 'project not found' }, { status: 404 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    console.error('[google oauth] GOOGLE_CLIENT_ID が未設定です')
    return NextResponse.json({ error: 'OAuth is not configured' }, { status: 500 })
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI
    ?? `${(process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`).replace(/\/$/, '')}/api/auth/google/callback`
  const state = JSON.stringify({ projectId })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    access_type: 'offline',
    prompt: 'consent', // 必ず refresh_token を返させる
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
