import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const currentPassword =
    typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword =
    typeof body?.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword) {
    return NextResponse.json(
      { error: 'current_password_required' },
      { status: 422 },
    )
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'new_password_too_short' },
      { status: 422 },
    )
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: 'same_password' },
      { status: 422 },
    )
  }

  // 現在のパスワード検証用の独立クライアント。
  // クッキーセッションに影響を与えないよう、persistSession: false で生成する。
  const verifier = createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { error: signInError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return NextResponse.json(
      { error: 'invalid_current_password' },
      { status: 401 },
    )
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json(
      { error: 'update_failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
