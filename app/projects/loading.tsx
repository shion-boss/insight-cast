import Link from 'next/link'
import { getButtonClass } from '@/components/ui'
import { AppShellSkeleton } from '@/components/app-shell-skeleton'

export default function Loading() {
  return (
    <AppShellSkeleton
      title="取材先一覧"
      headerRight={
        <Link href="/projects/new" className={getButtonClass('primary', 'px-4 py-2 text-sm pointer-events-none')}>
          + 取材先を追加
        </Link>
      }
    />
  )
}
