export const dynamic = 'force-dynamic'

'use client'

import React from 'react'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { FieldLabel, TextInput } from '@/components/ui'

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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[440px]">
        {/* ブランド */}
        <div className="mb-8 text-center">
          <span className="font-serif text-[22px] font-bold text-[var(--text)]">
            Insight <span className="text-[var(--accent)]">Cast</span>
          </span>
        </div>

        {/* カード */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-12 w-full shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
          <h1 className="font-serif text-[22px] font-bold text-[var(--text)] text-center mb-8">ログイン</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full border-[1.5px] border-[var(--border)] rounded-[var(--r-sm)] bg-[var(--surface)] flex items-center justify-center gap-2.5 py-3 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {googleLoading ? 'Googleに移動中...' : 'Googleでログイン'}
            </button>

            <div className="flex items-center gap-3">
              <hr className="flex-1 border-[var(--border)]" />
              <span className="text-xs text-[var(--text3)]">または</span>
              <hr className="flex-1 border-[var(--border)]" />
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
              <p className="bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] px-4 py-3 text-sm">
                {error ?? oauthError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] py-[13px] font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {loading ? 'ログイン中...' : 'ログインする'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--text3)]">
          アカウントをお持ちでない方は{' '}
          <Link
            href="/auth/signup"
            className="text-[var(--accent)] font-semibold underline underline-offset-2 hover:text-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-sm"
          >
            新規登録
          </Link>
        </p>

        <p className="mt-3 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-sm"
          >
            ← トップへ
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
