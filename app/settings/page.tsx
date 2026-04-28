export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
export const metadata: Metadata = { robots: { index: false, follow: false } }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getIsAdmin } from '@/lib/actions/auth'
import { normalizeNotificationPreferences } from '@/lib/notification-preferences'
import { type PlanKey } from '@/lib/plans'
import { SettingsClient } from '@/app/settings/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const [
    { data: profile },
    { data: userProjects },
    { data: subscription },
    isAdmin,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, avatar_url, notification_preferences')
      .eq('id', user.id)
      .single(),
    supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .is('deleted_at', null),
    supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single(),
    getIsAdmin(),
  ])

  const planKey: PlanKey =
    subscription?.plan === 'business' ? 'business'
    : subscription?.plan === 'personal' ? 'personal'
    : subscription?.plan === 'lightning' ? 'lightning'
    : 'free'

  const projectIds = (userProjects ?? []).map((p) => p.id)
  const projectCount = projectIds.length

  let interviewCount = 0
  if (projectIds.length > 0) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count } = await supabase
      .from('interviews')
      .select('id', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .is('deleted_at', null)
      .gte('created_at', monthStart)
    interviewCount = count ?? 0
  }

  return (
    <SettingsClient
      initialName={profile?.name ?? ''}
      email={user.email ?? ''}
      planKey={planKey}
      avatarUrl={profile?.avatar_url ?? null}
      initialNotifications={normalizeNotificationPreferences(profile?.notification_preferences)}
      userId={user.id}
      isAdmin={isAdmin}
      interviewCount={interviewCount}
      projectCount={projectCount}
      isEmailUser={user.app_metadata?.provider === 'email'}
    />
  )
}
