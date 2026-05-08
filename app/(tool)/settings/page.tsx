export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
export const metadata: Metadata = { robots: { index: false, follow: false } }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getIsAdmin } from '@/lib/actions/auth'
import { normalizeNotificationPreferences } from '@/lib/notification-preferences'
import { type PlanKey, getJstMonthKey } from '@/lib/plans'
import { SettingsClient } from '@/app/(tool)/settings/SettingsClient'

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
      .select('name, avatar_url, notification_preferences, first_person')
      .eq('id', user.id)
      .single(),
    supabase
      .from('projects')
      .select('id, name, hp_url')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
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

  const userProjectList = (userProjects ?? []) as Array<{ id: string; name: string | null; hp_url: string }>
  const projectIds = userProjectList.map((p) => p.id)
  const projectCount = projectIds.length

  // 「今月の取材回数」はカウンター値（削除済みも含む新規作成本数）から取得する。
  // 削除で枠は回復しない方針のため、進捗表示も判定と同じ値に揃える。
  const { data: monthlyUsage } = await supabase
    .from('usage_counters')
    .select('interviews_created')
    .eq('user_id', user.id)
    .eq('month_key', getJstMonthKey())
    .maybeSingle()
  const interviewCount = monthlyUsage?.interviews_created ?? 0

  return (
    <SettingsClient
      initialName={profile?.name ?? ''}
      initialFirstPerson={profile?.first_person ?? ''}
      email={user.email ?? ''}
      planKey={planKey}
      avatarUrl={profile?.avatar_url ?? null}
      initialNotifications={normalizeNotificationPreferences(profile?.notification_preferences)}
      userId={user.id}
      isAdmin={isAdmin}
      interviewCount={interviewCount}
      projectCount={projectCount}
      isEmailUser={user.app_metadata?.provider === 'email'}
      projects={userProjectList.map((p) => ({ id: p.id, name: p.name as string | null, hp_url: p.hp_url as string }))}
    />
  )
}
