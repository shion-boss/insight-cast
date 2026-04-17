'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FieldLabel, PrimaryButton, SecondaryButton, StateCard, TextInput } from '@/components/ui'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('パスワードが一致しません')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({ email, password })
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
        redirectTo: `${origin}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      setError('Google登録を開始できませんでした。設定をご確認ください')
      setGoogleLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="w-full max-w-sm">
          <StateCard
            icon="📬"
            title="確認メールを送りました。"
            description={(
              <>
                <strong>{email}</strong> に確認メールを送りました。<br />
                メールのリンクを開くと、そのままログインできます。
              </>
            )}
          />
          <Link href="/auth/login" className="inline-block mt-6 text-sm text-stone-500 underline rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300">
            ログインページへ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold text-stone-800 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300">
            Insight Cast
          </Link>
          <p className="text-sm text-stone-400 mt-2">取材班を呼べるように、まずは登録を済ませましょう。</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
          <SecondaryButton
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading || googleLoading}
            className="w-full py-3 text-sm font-medium"
          >
            {googleLoading ? 'Googleに移動中...' : 'Googleで新規登録'}
          </SecondaryButton>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs text-stone-400">またはメールで登録</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div>
            <FieldLabel>メールアドレス</FieldLabel>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <FieldLabel>パスワード（8文字以上）</FieldLabel>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <FieldLabel>パスワード（確認）</FieldLabel>
            <TextInput
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <PrimaryButton
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm"
          >
            {loading ? '登録中...' : '無料で始める'}
          </PrimaryButton>
        </form>

        <p className="text-center text-sm text-stone-400 mt-4">
          すでにアカウントをお持ちの方は
          <Link href="/auth/login" className="text-stone-600 underline ml-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  )
}
