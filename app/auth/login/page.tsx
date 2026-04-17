'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FieldLabel, PrimaryButton, TextInput } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold text-stone-800 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300">
            Insight Cast
          </Link>
          <p className="text-sm text-stone-400 mt-2">おかえりなさい</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
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
            <FieldLabel>パスワード</FieldLabel>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <PrimaryButton
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm"
          >
            {loading ? 'ログイン中...' : 'ログインする'}
          </PrimaryButton>
        </form>

        <p className="text-center text-sm text-stone-400 mt-4">
          アカウントをお持ちでない方は
          <Link href="/auth/signup" className="text-stone-600 underline ml-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  )
}
