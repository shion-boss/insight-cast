'use client'

import { useFormStatus } from 'react-dom'
import { getButtonClass } from '@/components/ui'

export default function LogoutButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={getButtonClass('secondary', 'min-w-24 font-medium')}
    >
      {pending ? 'ログアウト中...' : 'ログアウト'}
    </button>
  )
}
