import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SiteBrand } from '@/components/ui'

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
    redirect('/')
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (!adminEmails.includes(user.email ?? '')) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-4">
            <SiteBrand href="/admin" subtitle="管理画面" />
            <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Admin
            </span>
          </div>
          <span className="text-xs text-stone-400">{user.email}</span>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-0">
        {/* サイドバー */}
        <aside className="w-52 shrink-0 border-r border-stone-200 bg-white">
          <nav className="sticky top-[57px] flex flex-col gap-1 p-4">
            {NAV_LINKS.map((link) => (
              <AdminNavLink key={link.href} href={link.href} label={link.label} />
            ))}
            <div className="my-3 border-t border-stone-100" />
            <Link
              href="/dashboard"
              className="rounded-xl px-3 py-2 text-sm text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
            >
              ← 顧客画面へ
            </Link>
          </nav>
        </aside>

        {/* メインコンテンツ */}
        <main className="min-w-0 flex-1 p-8">
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
      className="rounded-xl px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
    >
      {label}
    </Link>
  )
}
