'use client'

import { useState, Suspense, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { FieldLabel, PrimaryButton, SecondaryButton, SiteBrand, TextInput } from '@/components/ui'
import { PublicPageFrame } from '@/components/public-layout'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const oauthErrorMessage = searchParams.get('message')
  const oauthError = searchParams.get('error') === 'oauth_callback'
    ? oauthErrorMessage ?? 'Googleログインに失敗しました。Supabase の Google Provider 設定をご確認ください'
    : null

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)

    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      setError('Googleログインを開始できませんでした。設定をご確認ください')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 relative z-10">
      <div className="w-full max-w-sm">
        {/* ブランド */}
        <div className="mb-8 flex items-center justify-between">
          <SiteBrand href="/" subtitle={false} />
          <Link
            href="/"
            className="rounded-md text-sm text-stone-400 transition-colors hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
          >
            ← トップへ
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950">ログイン</h1>
          <p className="mt-1 text-sm text-stone-500">取材班の続きから、すぐ再開できます。</p>
        </div>

        {/* カード */}
        <div className="rounded-[2rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <SecondaryButton
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full"
            >
              {googleLoading ? 'Googleに移動中...' : 'Googleでログイン'}
            </SecondaryButton>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-xs text-stone-400">またはメールでログイン</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <div>
              <FieldLabel>メールアドレス</FieldLabel>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <FieldLabel>パスワード</FieldLabel>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {(error || oauthError) && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error ?? oauthError}</p>
            )}

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'ログイン中...' : 'ログインする'}
            </PrimaryButton>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-stone-400">
          アカウントをお持ちでない方は{' '}
          <Link
            href="/auth/signup"
            className="text-stone-700 underline underline-offset-2 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 rounded-sm"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <PublicPageFrame>
      <Suspense>
        <LoginForm />
      </Suspense>
    </PublicPageFrame>
  )
}
