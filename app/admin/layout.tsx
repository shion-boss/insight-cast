import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const NAV_LINKS = [
  { href: '/admin', label: 'ダッシュボード' },
  { href: '/admin/posts', label: '記事管理' },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getAdminUser()

  // ミドルウェアで弾いているが、サーバーコンポーネントでも念のため確認
  if (!user) {
    redirect('/dashboard')
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (!adminEmails.includes(user.email ?? '')) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <aside className="border-b border-white/8 bg-[#1c1410] lg:fixed lg:inset-y-0 lg:left-0 lg:w-[220px] lg:border-b-0 lg:border-r lg:border-r-white/8">
        <div className="mx-auto flex max-w-6xl flex-col lg:h-full lg:max-w-none">
          <div className="border-b border-white/8 px-6 py-5 lg:px-5">
            <Link href="/admin" className="font-serif text-[17px] font-bold text-white">
              Insight <span className="text-[var(--accent)]">Cast</span>{' '}
              <span className="text-[11px] text-white/50">Admin</span>
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-3 lg:py-3">
            {NAV_LINKS.map((link) => (
              <AdminNavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
          <div className="border-t border-white/8 px-4 py-4 lg:px-3">
            <p className="truncate text-xs text-white/50">{user.email}</p>
            <Link
              href="/dashboard"
              className="mt-3 inline-flex w-full items-center justify-center rounded-[var(--r-sm)] border border-white/10 px-4 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-white/6 hover:text-white"
            >
              ← 顧客画面へ
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <p className="font-serif text-base font-bold text-[var(--text)]">管理画面</p>
            <span className="text-xs text-[var(--text3)]">{user.email}</span>
          </div>
        </header>

        <main className="mx-auto min-w-0 max-w-7xl p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

// サイドバーリンク（クライアント不要・シンプルにhrefで管理）
function AdminNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-[var(--r-sm)] px-3 py-2.5 text-sm font-medium text-white/58 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
    >
      {label}
    </Link>
  )
}
