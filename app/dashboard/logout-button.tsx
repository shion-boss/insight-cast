'use client'

import { useFormStatus } from 'react-dom'

export default function LogoutButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-w-24 items-center justify-center rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors cursor-pointer"
    >
      {pending ? 'ログアウト中...' : 'ログアウト'}
    </button>
  )
}
