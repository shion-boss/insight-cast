'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getCharacter } from '@/lib/characters'

export default function InviteAcceptButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const mint = getCharacter('mint')

  async function handleAccept() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' })
      const json = await res.json() as { ok?: boolean; projectId?: string; error?: string }
      if (res.ok && json.projectId) {
        document.dispatchEvent(new Event('cross-area-navigate'))
        router.push(`/projects/${json.projectId}`)
        return
      }
      if (json.error === 'email_mismatch') {
        setError('ログイン中のアカウントはこの招待の対象ではありません。招待先のメールアドレスでログインしてください。')
      } else if (json.error === 'invalid_or_expired') {
        setError('招待リンクが無効か期限切れです。招待者に再招待を依頼してください。')
      } else {
        setError('参加処理に失敗しました。しばらく待ってからもう一度お試しください。')
      }
    } catch {
      setError('参加処理に失敗しました。もう一度お試しください。')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3">
          {mint?.icon48 && (
            <Image src={mint.icon48} alt={mint.name} width={32} height={32} className="rounded-full flex-shrink-0 mt-0.5" sizes="32px" />
          )}
          <p className="text-sm text-[var(--err)]">{error}</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '参加しています...' : 'このまま参加する'}
      </button>
    </div>
  )
}
