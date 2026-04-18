'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
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

  async function handleSubmit(e: React.FormEvent) {
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
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7f1e4_0%,_#fcfaf6_100%)] flex flex-col items-center justify-center px-4">
      {/* ロゴ + トップへ戻るリンク */}
      <div className="w-full max-w-sm mb-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.12em] text-stone-800 uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 rounded-md"
          >
            Insight Cast
          </Link>
          <Link
            href="/"
            className="text-sm text-stone-400 transition-colors hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 rounded-md"
          >
            ← トップに戻る
          </Link>
        </div>
        <p className="text-sm text-stone-400 mt-2">取材班の続きから、すぐ再開できます。</p>
      </div>

      {/* カード */}
      <div className="w-full max-w-sm rounded-[2rem] border border-stone-200 bg-white p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full rounded-xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 disabled:opacity-50"
          >
            {googleLoading ? 'Googleに移動中...' : 'Googleでログイン'}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs text-stone-400">またはメールでログイン</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div>
            <label className="block text-sm text-stone-600 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border border-stone-200 px-4 py-3 text-sm focus:ring-2 focus:ring-stone-300 focus:outline-none w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border border-stone-200 px-4 py-3 text-sm focus:ring-2 focus:ring-stone-300 focus:outline-none w-full"
            />
          </div>

          {(error || oauthError) && (
            <p className="text-sm text-red-500">{error ?? oauthError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-stone-900 py-3 text-sm font-medium text-white hover:bg-stone-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : 'ログインする'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-400 mt-6">
          アカウントをお持ちでない方は
          <Link
            href="/auth/signup"
            className="text-stone-600 underline ml-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  )
}
