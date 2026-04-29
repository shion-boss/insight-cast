'use client'

import React from 'react'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { CharacterAvatar, FieldLabel, TextInput } from '@/components/ui'
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
  const rawNext = searchParams.get('next') ?? ''
  const nextPath = /^\/(?!\/)/.test(rawNext) ? rawNext : '/dashboard'
  const inviteToken = searchParams.get('invite_token') ?? ''
  const isPaidFlow = nextPath.includes('checkout-redirect')
  const paidPlan = nextPath.includes('plan=business') ? '法人向け' : nextPath.includes('plan=personal') ? '個人向け' : nextPath.includes('plan=lightning') ? 'ライト' : null
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

    // invite_token がある場合は accept API 経由でメンバー登録してから遷移する
    if (inviteToken) {
      try {
        const acceptRes = await fetch(`/api/invitations/${inviteToken}/accept`, { method: 'POST' })
        if (!acceptRes.ok) {
          const json = await acceptRes.json().catch(() => ({})) as { error?: string }
          const code = json.error
          if (code === 'email_mismatch') {
            setError('このメールアドレスは招待されていません。招待先のメールアドレスでログインしてください。')
          } else if (code === 'invalid_or_expired') {
            setError('招待リンクが無効か期限切れです。招待者に再招待を依頼してください。')
          } else {
            setError('招待の処理に失敗しました。しばらく待ってから再度お試しください。')
          }
          setLoading(false)
          return
        }
        const json = await acceptRes.json() as { ok?: boolean; projectId?: string }
        if (json.projectId) {
          router.push(`/projects/${json.projectId}`)
          router.refresh()
          return
        }
      } catch {
        setError('招待の処理に失敗しました。もう一度お試しください。')
        setLoading(false)
        return
      }
    }
    router.push(nextPath)
    router.refresh()
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)

    const origin = window.location.origin
    const callbackParams = new URLSearchParams({ next: nextPath })
    // invite_token がある場合はコールバックに引き継ぎ、OAuth完了後にメンバー登録処理を実行する
    if (inviteToken) callbackParams.set('invite_token', inviteToken)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?${callbackParams.toString()}`,
      },
    })

    if (error) {
      setError('Googleログインを開始できませんでした。ページを再読み込みしてもう一度お試しください。')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[440px]">
        {/* ブランド */}
        <div className="mb-8 flex justify-center">
          <Image src="/logo.jpg" alt="Insight Cast" width={1116} height={350} className="h-9 w-auto" sizes="120px" priority />
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
              アカウントをお持ちでない方は <Link href={`/auth/signup?next=${encodeURIComponent(nextPath)}${inviteToken ? `&invite_token=${encodeURIComponent(inviteToken)}` : ''}`} className="text-[var(--accent)] font-semibold underline underline-offset-2">新規登録はこちら</Link>
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
              {googleLoading ? 'Googleのページを開いています...' : 'Googleでログイン'}
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
                aria-invalid={!!(error || oauthError) || undefined}
                aria-describedby={(error || oauthError) ? 'login-error' : undefined}
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
                aria-invalid={!!(error || oauthError) || undefined}
                aria-describedby={(error || oauthError) ? 'login-error' : undefined}
              />
            </div>

            {(error || oauthError) && (
              <div id="login-error" role="alert" className="flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3">
                <CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--err)]">{error ?? oauthError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] py-[13px] font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {loading ? 'ログインしています...' : 'ログインする'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--text3)]">
          アカウントをお持ちでない方は{' '}
          <Link
            href={(() => {
              const params = new URLSearchParams()
              if (nextPath !== '/dashboard') params.set('next', nextPath)
              if (inviteToken) params.set('invite_token', inviteToken)
              const qs = params.toString()
              return `/auth/signup${qs ? `?${qs}` : ''}`
            })()}
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
    <div className="min-h-dvh bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0]" aria-busy="true" aria-label="読み込み中" />
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
