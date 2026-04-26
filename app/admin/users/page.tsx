export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { UsersTableClient, type UserRow } from './UsersTableClient'
import type { PlanKey } from '@/lib/plans'

async function getUsersWithPlans(): Promise<UserRow[]> {
  const adminClient = createAdminClient()

  const [authResult, subResult] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    adminClient.from('subscriptions').select('user_id, plan'),
  ])

  if (authResult.error) throw authResult.error

  const planMap = new Map<string, PlanKey>()
  for (const row of subResult.data ?? []) {
    planMap.set(row.user_id, row.plan as PlanKey)
  }

  return authResult.data.users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    plan: planMap.get(u.id) ?? 'free',
  }))
}

export default async function AdminUsersPage() {
  const users = await getUsersWithPlans()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">ユーザー管理</h1>
        <p className="mt-1 text-sm text-[var(--text2)]">登録ユーザー {users.length} 件</p>
      </div>
      <UsersTableClient initialUsers={users} />
    </div>
  )
}
