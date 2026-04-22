import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function FooterAccountLinks() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = Boolean(user)
  } catch { /* ignore */ }

  const links = isLoggedIn
    ? [
        { href: '/dashboard', label: 'ダッシュボード' },
        { href: '/settings', label: '設定' },
        { href: '/tokushoho', label: '特定商取引法に基づく表記' },
      ]
    : [
        { href: '/auth/signup', label: '無料で始める' },
        { href: '/auth/login', label: 'ログイン' },
        { href: '/tokushoho', label: '特定商取引法に基づく表記' },
      ]

  return (
    <>
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="text-xs text-[var(--text2)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none">
            {link.label}
          </Link>
        </li>
      ))}
    </>
  )
}
