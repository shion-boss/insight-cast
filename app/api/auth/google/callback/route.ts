import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, findMatchingSiteUrl } from '@/lib/gsc'

/**
 * GET /api/auth/google/callback?code=xxx&state=xxx
 *
 * Google OAuth コールバック。
 * code を access_token / refresh_token に交換し、
 * GSC プロパティ一覧から HP URL に最も近いものを自動選択して
 * gsc_connections に保存する。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const errorParam = searchParams.get('error')

  // Google からエラーが返ってきた場合（ユーザーが拒否など）
  if (errorParam) {
    console.error('[google callback] OAuth error from Google:', errorParam)
    return NextResponse.redirect(new URL('/dashboard?gsc=error', req.url))
  }

  if (!code || !stateRaw) {
    return NextResponse.json({ error: 'code and state are required' }, { status: 400 })
  }

  // state を復元
  let projectId: string
  try {
    const parsed = JSON.parse(stateRaw) as { projectId?: unknown }
    if (typeof parsed.projectId !== 'string') throw new Error('invalid state')
    projectId = parsed.projectId
  } catch {
    return NextResponse.json({ error: 'invalid state parameter' }, { status: 400 })
  }

  // 認証チェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // プロジェクトの所有権確認 + HP URL 取得
  const { data: project } = await supabase
    .from('projects')
    .select('id, hp_url')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!project) {
    return NextResponse.json({ error: 'project not found' }, { status: 404 })
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`).replace(/\/$/, '')
  const redirectUri = `${appUrl}/api/auth/google/callback`

  // code → tokens 交換
  let tokens: { access_token: string; refresh_token: string; expires_at: Date }
  try {
    tokens = await exchangeCodeForTokens(code, redirectUri)
  } catch (err) {
    console.error('[google callback] token exchange failed:', err)
    return NextResponse.redirect(new URL(`/projects/${projectId}?gsc=error`, req.url))
  }

  // GSC サイト一覧から HP URL に合うプロパティを自動選択
  const siteUrl = await findMatchingSiteUrl(tokens.access_token, project.hp_url)

  if (!siteUrl) {
    console.warn('[google callback] no GSC property found for', project.hp_url)
    return NextResponse.redirect(
      new URL(`/projects/${projectId}?gsc=no_property`, req.url),
    )
  }

  // gsc_connections に upsert（project_id ユニーク制約）
  const { error: upsertError } = await supabase
    .from('gsc_connections')
    .upsert(
      {
        user_id: user.id,
        project_id: projectId,
        site_url: siteUrl,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at.toISOString(),
      },
      { onConflict: 'project_id' },
    )

  if (upsertError) {
    console.error('[google callback] upsert failed:', upsertError.message)
    return NextResponse.redirect(
      new URL(`/projects/${projectId}?gsc=error`, req.url),
    )
  }

  return NextResponse.redirect(
    new URL(`/projects/${projectId}?gsc=connected`, req.url),
  )
}
