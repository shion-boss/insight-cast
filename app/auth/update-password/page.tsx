'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('パスワードが一致しません')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('パスワードの更新に失敗しました。もう一度お試しください。')
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <Link href="/" className="font-serif text-[22px] font-bold text-[var(--text)]">
            Insight <span className="text-[var(--accent)]">Cast</span>
          </Link>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-12 w-full shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-l)]">
                <span className="text-2xl">✓</span>
              </div>
              <h1 className="font-serif text-[20px] font-bold text-[var(--text)] mb-3">パスワードを更新しました</h1>
              <p className="text-sm text-[var(--text2)]">ダッシュボードに移動します...</p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-[20px] font-bold text-[var(--text)] text-center mb-8">新しいパスワードを設定</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text2)] mb-1.5">新しいパスワード（8文字以上）</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full border border-[var(--border)] rounded-[var(--r-sm)] px-3.5 py-2.5 text-sm text-[var(--text)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text2)] mb-1.5">新しいパスワード（確認）</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
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
                  className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] py-[13px] font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '更新中...' : 'パスワードを更新する'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
