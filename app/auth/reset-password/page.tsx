'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const origin = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/update-password`,
    })

    if (error) {
      setError('メールの送信に失敗しました。もう一度お試しください。')
      setLoading(false)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <img src="/logo.jpg" alt="Insight Cast" className="h-9 w-auto" />
          </Link>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-12 w-full shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-l)]">
                <span className="text-2xl">📬</span>
              </div>
              <h1 className="font-serif text-[20px] font-bold text-[var(--text)] mb-3">メールを送りました</h1>
              <p className="text-sm text-[var(--text2)] leading-[1.8] mb-6">
                <strong className="text-[var(--text)]">{email}</strong> にパスワード再設定のリンクを送りました。メールボックスをご確認ください。
              </p>
              <Link
                href="/auth/login"
                className="text-sm text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent-h)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                ログイン画面に戻る
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-[20px] font-bold text-[var(--text)] text-center mb-2">パスワードを忘れた場合</h1>
              <p className="text-sm text-[var(--text2)] text-center mb-8 leading-[1.7]">
                登録済みのメールアドレスを入力してください。パスワード再設定のリンクをお送りします。
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-xs font-semibold text-[var(--text2)] mb-1.5">メールアドレス</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full border border-[var(--border)] rounded-[var(--r-sm)] px-3.5 py-2.5 text-sm text-[var(--text)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-colors"
                  />
                </div>

                {error && (
                  <p className="bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] px-4 py-3 text-sm">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] py-[13px] font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  {loading ? '送信中...' : '再設定メールを送る'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-[var(--text3)] hover:text-[var(--text)] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  ← ログインに戻る
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
