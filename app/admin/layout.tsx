import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminMobileNav } from '@/components/admin-mobile-nav'
import { AdminSidebarNav } from '@/components/admin-sidebar-nav'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

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
    <div className="min-h-dvh bg-[var(--bg)]">
      <aside className="hidden bg-[#1c1410] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[220px] lg:flex-col lg:border-r lg:border-r-white/8">
        <div className="border-b border-white/8 px-5 py-5">
          <Link href="/" className="font-serif text-[17px] font-bold text-white">
            Insight <span className="text-[var(--accent)]">Cast</span>{' '}
            <span className="text-[11px] text-white/50">Admin</span>
          </Link>
        </div>
        <AdminSidebarNav />
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
              <Link href="/"><Image src="/logo.jpg" alt="Insight Cast" width={120} height={32} className="h-8 w-auto" /></Link>
              <AdminMobileNav email={user.email ?? ''} />
            </div>
            {/* PC: メールアドレス（右寄せ） */}
            <div className="hidden lg:flex lg:w-full lg:items-center lg:justify-end">
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


