import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkIsAdmin } from '@/lib/auth-utils.server'
import { AppShell } from '@/components/app-shell'
import ProjectAnalysisNotifier from '@/components/project-analysis-notifier'
// tool 系専用の演出 CSS（ローディング・取材準備・進行表示）。
// site (marketing) 配下では参照しないので、(tool)/layout.tsx でのみ import
// することで marketing CSS bundle から外し、LP の初回ロードを軽くする。
import '../tool.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'Insight Cast',
    template: '%s | Insight Cast',
  },
  robots: { index: false, follow: false },
}

export default async function ToolLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const accountLabel = profile?.name ?? user.email ?? '設定'
  const isAdmin = checkIsAdmin(user.email)

  return (
    <AppShell
      accountLabel={accountLabel}
      avatarUrl={profile?.avatar_url ?? null}
      isAdmin={isAdmin}
    >
      <ProjectAnalysisNotifier />
      {children}
    </AppShell>
  )
}
