import Link from 'next/link'

import LogoutButton from '@/app/dashboard/logout-button'
import { signOut } from '@/lib/actions/auth'

type HeaderSection = 'dashboard' | 'projects' | 'interviews' | 'articles' | 'settings'

const NAV_ITEMS: Array<{ href: string; label: string; key: HeaderSection }> = [
  { href: '/dashboard', label: 'ダッシュボード', key: 'dashboard' },
  { href: '/projects', label: '取材先一覧', key: 'projects' },
  { href: '/interviews', label: 'インタビュー履歴', key: 'interviews' },
  { href: '/articles', label: '記事一覧', key: 'articles' },
]

function navClass(active: boolean) {
  if (active) {
    return 'rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-950'
  }

  return 'rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-200 hover:bg-white/80 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40'
}

export default function AppHeaderActions({
  active,
  accountLabel,
}: {
  active: HeaderSection
  accountLabel: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      <nav className="hidden items-center gap-1 lg:flex">
        {NAV_ITEMS.map((item) => (
          <Link key={item.key} href={item.href} className={navClass(item.key === active)}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/settings"
        className={navClass(active === 'settings')}
      >
        {accountLabel}
      </Link>
      <form action={signOut}>
        <LogoutButton />
      </form>
    </div>
  )
}
