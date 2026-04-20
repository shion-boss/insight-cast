'use client'

import React from 'react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

import { FieldLabel, TextInput } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

export default function SignupPage() {
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
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* 左パネル */}
        <LeftPanel mint={mint} claus={claus} rain={rain} />

        {/* 右パネル */}
        <div className="bg-white flex items-center justify-center p-[60px]">
          <div className="max-w-[420px] w-full text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-l)] ring-1 ring-[var(--border)]">
              <span className="text-3xl" aria-hidden="true">📬</span>
            </div>
            <h2 className="font-serif text-[28px] font-bold text-[var(--text)] mb-3">確認メールを送りました</h2>
            <p className="text-[14px] text-[var(--text2)] leading-[1.85] mb-8">
              <strong className="font-semibold text-[var(--text)]">{email}</strong> にメールを送りました。
              <br />
              リンクを開くとそのままログインできます。
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-8 py-[13px] font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              ダッシュボードへ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 左パネル */}
      <LeftPanel mint={mint} claus={claus} rain={rain} />

      {/* 右パネル */}
      <div className="bg-white flex items-center justify-center p-[60px]">
        <div className="max-w-[420px] w-full">
          <h1 className="font-serif text-[28px] font-bold text-[var(--text)] mb-2">無料で始める</h1>
          <p className="text-[14px] text-[var(--text2)] mb-8">
            すでにアカウントをお持ちの方は{' '}
            <Link
              href="/auth/login"
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
              {googleLoading ? 'Googleに移動中...' : 'Googleで新規登録'}
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
              <FieldLabel>パスワード（8文字以上）</FieldLabel>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <FieldLabel>パスワード（確認）</FieldLabel>
              <TextInput
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              {loading ? '登録中...' : '無料で始める'}
            </button>
          </form>

          <p className="mt-5 text-[12px] text-[var(--text3)] text-center leading-relaxed">
            登録すると{' '}
            <a href="/terms" className="text-[var(--accent)] underline">利用規約</a>
            {' '}と{' '}
            <a href="/privacy" className="text-[var(--accent)] underline">プライバシーポリシー</a>
            {' '}に同意したものとみなされます
          </p>
        </div>
      </div>
    </div>
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
    '記事素材をすぐダウンロードできる',
  ]

  return (
    <div className="bg-[var(--accent)] flex-col p-[60px] relative overflow-hidden hidden lg:flex">
      {/* 背景デコレーション */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* ロゴ */}
        <span className="font-serif text-[22px] text-white font-bold mb-12">
          Insight Cast
        </span>

        {/* 見出し */}
        <h2 className="font-serif text-[32px] font-bold text-white leading-[1.35] mb-5">
          あなたの当たり前が、<br />まだ伝わっていない<br />価値かもしれません。
        </h2>

        {/* 説明 */}
        <p className="text-[15px] text-white/80 leading-[1.85] mb-8">
          AIインタビュアーが話を聞き出し、<br />
          ホームページを少しずつ強くします。
        </p>

        {/* 特典リスト */}
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

        {/* キャスト紹介 */}
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
          <span className="text-[13px] text-white/80">3名のキャストが待っています</span>
        </div>
      </div>
    </div>
  )
}
