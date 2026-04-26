'use client'

import React from 'react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { FieldLabel, TextInput } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

function SignupForm() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const nextParam = searchParams.get('next')
  // next パラメータ内に plan が埋め込まれているケース（ログイン→サインアップ経由）も検出
  const effectivePlan = plan ?? (() => {
    if (!nextParam) return null
    try {
      const inner = new URLSearchParams(new URL(nextParam, 'http://x').search)
      const p = inner.get('plan')
      return p === 'personal' || p === 'business' ? p : null
    } catch { return null }
  })()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const mint = getCharacter('mint')
  const claus = getCharacter('claus')
  const rain = getCharacter('rain')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password !== confirm) {
      setError('パスワードが一致していません。もう一度入力してください。')
      return
    }
    setLoading(true)
    setError(null)

    const origin = window.location.origin
    const afterNext = plan
      ? `/api/stripe/checkout-redirect?plan=${plan}`
      : nextParam ?? '/dashboard'
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(afterNext)}`

    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
    if (error) {
      setError('登録に失敗しました。もう一度お試しください')
      setLoading(false)
      return
    }

    setSent(true)
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    setError(null)

    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(effectivePlan ? `/api/stripe/checkout-redirect?plan=${effectivePlan}` : nextParam ?? '/dashboard')}`,
      },
    })

    if (error) {
      setError('Google登録を開始できませんでした。ページを再読み込みしてもう一度お試しください。')
      setGoogleLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="grid min-h-screen lg:grid-cols-2">
        <LeftPanel mint={mint} claus={claus} rain={rain} />

        <div className="bg-white flex items-center justify-center p-[60px]">
          <div className="max-w-[420px] w-full">
            <div className="flex items-start gap-4 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--accent-l)] px-6 py-5 mb-8">
              {mint?.icon48 ? (
                <Image
                  src={mint.icon48}
                  alt={`${mint.name}のアイコン`}
                  width={48}
                  height={48}
                  className="flex-shrink-0 rounded-full border border-[var(--border)] object-cover"
                />
              ) : (
                <span className="text-3xl flex-shrink-0" aria-hidden="true">{mint?.emoji ?? '📬'}</span>
              )}
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-1">メールを送りました</p>
                <p className="text-sm text-[var(--text2)] leading-[1.75]">
                  <strong className="font-semibold text-[var(--text)]">{email}</strong> 宛てに確認メールを送りました。
                  メールを開いてリンクをクリックしてください。
                  {plan ? ' リンクを開くと、そのままお申し込み画面に進めます。' : ''}
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--text3)] leading-relaxed mb-6">
              メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </p>
            <Link
              href="/auth/login"
              className="text-sm text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent-h)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              ログイン画面へ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <LeftPanel mint={mint} claus={claus} rain={rain} />

      <div className="bg-white flex items-center justify-center p-[60px]">
        <div className="max-w-[420px] w-full">
          <h1 className="font-serif text-[28px] font-bold text-[var(--text)] mb-2">
            {effectivePlan === 'personal' ? '個人向けプランに申し込む' : effectivePlan === 'business' ? '法人向けプランに申し込む' : '無料で始める'}
          </h1>
          <p className="text-[14px] text-[var(--text2)] mb-8">
            {effectivePlan && <span className="block mb-2 text-[var(--accent)] font-semibold">アカウント登録後、そのままお申し込み画面に進みます。</span>}
            すでにアカウントをお持ちの方は{' '}
            <Link
              href={`/auth/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`}
              className="text-[var(--accent)] font-semibold underline underline-offset-2 hover:text-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-sm"
            >
              ログイン
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading || googleLoading}
              className="w-full border-[1.5px] border-[var(--border)] rounded-[var(--r-sm)] bg-[var(--surface)] flex items-center justify-center gap-2.5 py-3 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {googleLoading ? 'Googleに移動中...' : effectivePlan ? 'Googleアカウントで申し込む' : 'Googleで新規登録'}
            </button>

            <div className="flex items-center gap-3">
              <hr className="flex-1 border-[var(--border)]" />
              <span className="text-xs text-[var(--text3)]">または</span>
              <hr className="flex-1 border-[var(--border)]" />
            </div>

            <div>
              <FieldLabel htmlFor="signup-email">メールアドレス</FieldLabel>
              <TextInput
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <FieldLabel htmlFor="signup-password">パスワード（8文字以上）</FieldLabel>
              <TextInput
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <FieldLabel htmlFor="signup-confirm">パスワード（確認）</FieldLabel>
              <TextInput
                id="signup-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p role="alert" className="bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] px-4 py-3 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] py-[13px] font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {loading ? '登録中...' : effectivePlan ? 'アカウントを作成して申し込む' : '無料で始める'}
            </button>
          </form>

          <p className="mt-5 text-[12px] text-[var(--text3)] text-center leading-relaxed">
            登録すると{' '}
            <Link href="/terms" className="text-[var(--accent)] underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">利用規約</Link>
            {' '}と{' '}
            <Link href="/privacy" className="text-[var(--accent)] underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">プライバシーポリシー</Link>
            {' '}に同意したものとみなされます
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

type LeftPanelProps = {
  mint: ReturnType<typeof getCharacter>
  claus: ReturnType<typeof getCharacter>
  rain: ReturnType<typeof getCharacter>
}

function LeftPanel({ mint, claus, rain }: LeftPanelProps) {
  const perks = [
    'クレジットカード不要',
    '取材は20分、チャット形式で気軽に',
    '記事素材を管理画面ですぐ確認できる',
  ]

  return (
    <div className="bg-[var(--accent)] flex-col p-[60px] relative overflow-hidden hidden lg:flex">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        <span className="font-serif text-[22px] text-white font-bold mb-12">
          Insight Cast
        </span>

        <h2 className="font-serif text-[32px] font-bold text-white leading-[1.35] mb-5">
          答えるだけで、<br />まだ伝わっていない<br />強みが見えてくる。
        </h2>

        <p className="text-[15px] text-white/80 leading-[1.85] mb-8">
          AIキャストが順番に質問するので、<br />
          何を書くかを先に考えなくて大丈夫です。
        </p>

        <ul className="space-y-3 mb-auto">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-xs font-bold">
                ✓
              </span>
              <span className="text-[14px] text-white/90">{perk}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {[mint, claus, rain].map((char, i) => (
              char?.icon48 ? (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-white/60 overflow-hidden bg-white/10"
                >
                  <Image
                    src={char.icon48}
                    alt={char.name ?? 'キャスト'}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-white/60 bg-white/20 flex items-center justify-center text-lg"
                >
                  {char?.emoji ?? '🐾'}
                </div>
              )
            ))}
          </div>
          <span className="text-sm text-white/80">3名のキャストが待っています</span>
        </div>
      </div>
    </div>
  )
}
