'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavLink = { href: string; label: string }

export const NAV_LINKS: NavLink[] = [
  { href: '/admin', label: 'ダッシュボード' },
  { href: '/admin/posts', label: '記事管理' },
  { href: '/admin/cast-talk', label: 'Cast Talk' },
  { href: '/admin/users', label: 'ユーザー管理' },
  { href: '/admin/costs', label: 'コスト管理' },
  { href: '/admin/services', label: '関連サービス' },
]

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

export function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="管理ナビゲーション" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`flex rounded-[var(--r-sm)] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
              active
                ? 'bg-white/12 text-white'
                : 'text-white/58 hover:bg-white/8 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
