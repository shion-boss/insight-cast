export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'

async function getUsers() {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  return data.users
}

function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]">ユーザー管理</h1>
        <p className="mt-1 text-sm text-[var(--text2)]">登録ユーザー {users.length} 件</p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border2)] bg-[var(--surface)] p-10 text-center">
          <p className="text-sm text-[var(--text3)]">登録ユーザーがいません</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="px-5 py-3 font-semibold text-[var(--text3)] text-xs uppercase tracking-[0.12em]">メールアドレス</th>
                <th className="px-5 py-3 font-semibold text-[var(--text3)] text-xs uppercase tracking-[0.12em]">作成日</th>
                <th className="px-5 py-3 font-semibold text-[var(--text3)] text-xs uppercase tracking-[0.12em]">最終ログイン</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className={i < users.length - 1 ? 'border-b border-[var(--border)]' : ''}
                >
                  <td className="px-5 py-3.5 font-medium text-[var(--text)]">{user.email ?? '—'}</td>
                  <td className="px-5 py-3.5 text-[var(--text2)]">{formatDateTime(user.created_at)}</td>
                  <td className="px-5 py-3.5 text-[var(--text2)]">{formatDateTime(user.last_sign_in_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
