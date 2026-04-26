'use client'

import React from 'react'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { FieldLabel, TextInput } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const nextPath = searchParams.get('next') ?? '/dashboard'
  const isPaidFlow = nextPath.includes('checkout-redirect')
  const paidPlan = nextPath.includes('plan=business') ? '法人向け' : nextPath.includes('plan=personal') ? '個人向け' : null
  const mint = getCharacter('mint')
  const oauthErrorMessage = searchParams.get('message')
  const oauthError = searchParams.get('error') === 'oauth_callback'
    ? oauthErrorMessage ?? 'Googleログインできませんでした。しばらく待ってから、もう一度お試しください。'
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

    router.push(nextPath)
    router.refresh()
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)

    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })

    if (error) {
      setError('Googleログインを開始できませんでした。ページを再読み込みしてもう一度お試しください。')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[440px]">
        {/* ブランド */}
        <div className="mb-8 flex justify-center">
          <Image src="/logo.jpg" alt="Insight Cast" width={1116} height={350} className="h-9 w-auto" priority />
        </div>

        {/* 有料プラン文脈の案内 */}
        {isPaidFlow && paidPlan && (
          <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-[var(--accent)]/30 bg-[var(--accent-l)] px-4 py-4">
            {mint?.icon48 && (
              <Image src={mint.icon48} alt={mint.name} width={36} height={36} className="rounded-full flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-[var(--text2)] leading-[1.7]">
              <span className="font-semibold text-[var(--text)]">{paidPlan}プランへのお申し込み</span>ありがとうございます。<br />
              ログイン後、そのままお支払い画面に進みます。<br />
              アカウントをお持ちでない方は <Link href={`/auth/signup?next=${encodeURIComponent(nextPath)}`} className="text-[var(--accent)] font-semibold underline underline-offset-2">新規登録はこちら</Link>
            </p>
          </div>
        )}

        {/* カード */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-6 sm:p-12 w-full shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
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
              <FieldLabel htmlFor="login-email">メールアドレス</FieldLabel>
              <TextInput
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-[var(--text2)]">パスワード</label>
                <Link
                  href="/auth/reset-password"
                  className="text-xs text-[var(--text3)] hover:text-[var(--accent)] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  パスワードを忘れた場合
                </Link>
              </div>
              <TextInput
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {(error || oauthError) && (
              <p role="alert" className="bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] px-4 py-3 text-sm">
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
            href={`/auth/signup${nextPath !== '/dashboard' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
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

function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <div className="h-7 w-32 animate-pulse rounded-full bg-[var(--border)]" />
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-6 sm:p-12 shadow-[0_24px_64px_rgba(0,0,0,0.08)] space-y-4">
          <div className="h-7 w-20 animate-pulse rounded-full bg-[var(--border)] mx-auto mb-8" />
          <div className="h-12 animate-pulse rounded-[var(--r-sm)] bg-[var(--border)]" />
          <div className="h-px bg-[var(--border)]" />
          <div className="h-10 animate-pulse rounded-[var(--r-sm)] bg-[var(--border)]" />
          <div className="h-10 animate-pulse rounded-[var(--r-sm)] bg-[var(--border)]" />
          <div className="h-12 animate-pulse rounded-[var(--r-sm)] bg-[var(--accent-l)]" />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
