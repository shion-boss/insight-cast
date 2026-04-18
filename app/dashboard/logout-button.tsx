'use client'

import { useFormStatus } from 'react-dom'

export default function LogoutButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-w-24 cursor-pointer items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-900/20 hover:bg-stone-50 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
    >
      {pending ? 'ログアウト中...' : 'ログアウト'}
    </button>
  )
}
