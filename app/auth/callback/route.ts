import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedNext = searchParams.get('next')
  // '//' から始まるプロトコル相対URLによるオープンリダイレクトを防ぐ
  const next = requestedNext && /^\/(?!\/)/.test(requestedNext) ? requestedNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Supabase OAuth callback error:', error.message)

    const errorUrl = new URL('/auth/login', origin)
    errorUrl.searchParams.set('error', 'oauth_callback')
    errorUrl.searchParams.set('message', 'ログインに失敗しました。もう一度お試しください。')
    return NextResponse.redirect(errorUrl)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_callback`)
}
