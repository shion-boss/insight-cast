import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminMobileNav } from '@/components/admin-mobile-nav'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const NAV_LINKS = [
  { href: '/admin', label: 'ダッシュボード' },
  { href: '/admin/posts', label: '記事管理' },
  { href: '/admin/cast-talk', label: 'Cast Talk' },
  { href: '/admin/users', label: 'ユーザー管理' },
  { href: '/admin/costs', label: 'コスト管理' },
  { href: '/admin/services', label: '関連サービス' },
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
      <aside className="hidden bg-[#1c1410] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[220px] lg:flex-col lg:border-r lg:border-r-white/8">
        <div className="border-b border-white/8 px-5 py-5">
          <Link href="/" className="font-serif text-[17px] font-bold text-white">
            Insight <span className="text-[var(--accent)]">Cast</span>{' '}
            <span className="text-[11px] text-white/50">Admin</span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
          {NAV_LINKS.map((link) => (
            <AdminNavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>
        <div className="border-t border-white/8 px-3 py-4">
          <p className="truncate text-xs text-white/50">{user.email}</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-flex w-full items-center justify-center rounded-[var(--r-sm)] border border-white/10 px-4 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-white/6 hover:text-white"
          >
            ← 顧客画面へ
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
            {/* モバイル: ロゴ（左）+ ハンバーガー（右） */}
            <div className="flex w-full items-center justify-between lg:hidden">
              <Link href="/"><img src="/logo.jpg" alt="Insight Cast" className="h-8 w-auto" /></Link>
              <AdminMobileNav navLinks={NAV_LINKS} email={user.email ?? ''} />
            </div>
            {/* PC: 管理画面ラベル + メール */}
            <div className="hidden lg:flex lg:w-full lg:items-center lg:justify-between">
              <p className="font-serif text-base font-bold text-[var(--text)]">管理画面</p>
              <span className="text-xs text-[var(--text3)]">{user.email}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto min-w-0 max-w-7xl p-4 sm:p-6 lg:p-8">
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
      className="flex rounded-[var(--r-sm)] px-3 py-2.5 text-sm font-medium text-white/58 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
    >
      {label}
    </Link>
  )
}

