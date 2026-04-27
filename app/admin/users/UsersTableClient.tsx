'use client'

import { useState } from 'react'
import type { PlanKey } from '@/lib/plans'

export type UserRow = {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  plan: PlanKey
}

const PLAN_OPTIONS: { value: PlanKey; label: string }[] = [
  { value: 'free', label: '無料' },
  { value: 'personal', label: '個人向け' },
  { value: 'business', label: '法人向け' },
]

const PLAN_BADGE: Record<PlanKey, string> = {
  free: 'bg-[var(--bg2)] text-[var(--text3)] border border-[var(--border)]',
  personal: 'bg-[var(--accent-l)] text-[var(--accent)]',
  business: 'bg-[var(--teal-l)] text-[var(--teal)]',
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function PlanSelect({
  userId,
  currentPlan,
  onChanged,
}: {
  userId: string
  currentPlan: PlanKey
  onChanged: (plan: PlanKey) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as PlanKey
    if (next === currentPlan) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: next }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        throw new Error(data.message ?? '更新に失敗しました')
      }
      onChanged(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={currentPlan}
        onChange={handleChange}
        disabled={saving}
        aria-label="プランを変更"
        className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] transition-colors hover:border-[var(--border2)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50"
      >
        {PLAN_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {saving && <p className="text-[10px] text-[var(--text3)]">更新中...</p>}
      {error && <p role="alert" className="text-[10px] text-[var(--err)]">{error}</p>}
    </div>
  )
}

function CreateUserForm({ onCreated }: { onCreated: (user: UserRow) => void }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState<PlanKey>('free')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, plan }),
      })
      const data = (await res.json()) as { ok?: boolean; user?: { id: string; email: string; created_at: string }; plan?: PlanKey; message?: string }
      if (!res.ok) throw new Error(data.message ?? '作成に失敗しました')
      onCreated({
        id: data.user!.id,
        email: data.user!.email ?? null,
        created_at: data.user!.created_at,
        last_sign_in_at: null,
        plan: data.plan ?? 'free',
      })
      setEmail('')
      setPassword('')
      setPlan('free')
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-[var(--r-sm)] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)]"
      >
        + ユーザーを作成
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text)]">ユーザーを作成</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-[var(--text3)] hover:text-[var(--text)]">キャンセル</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="create-email" className="block text-xs font-semibold text-[var(--text2)] mb-1">メールアドレス</label>
          <input
            id="create-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@example.com"
            className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          />
        </div>
        <div>
          <label htmlFor="create-password" className="block text-xs font-semibold text-[var(--text2)] mb-1">パスワード（8文字以上）</label>
          <input
            id="create-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="password123"
            className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          />
        </div>
        <div>
          <label htmlFor="create-plan" className="block text-xs font-semibold text-[var(--text2)] mb-1">プラン</label>
          <select
            id="create-plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanKey)}
            className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            {PLAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-[var(--err)]">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-10 items-center gap-2 rounded-[var(--r-sm)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] disabled:opacity-50"
      >
        {saving ? '作成中...' : 'メール確認なしで作成'}
      </button>
    </form>
  )
}

export function UsersTableClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers)

  function handlePlanChange(userId: string, plan: PlanKey) {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan } : u))
  }

  return (
    <div className="space-y-6">
      <CreateUserForm onCreated={(user) => setUsers((prev) => [user, ...prev])} />

      {users.length === 0 ? (
        <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border2)] bg-[var(--surface)] p-10 text-center">
          <p className="text-sm text-[var(--text3)]">登録ユーザーがいません</p>
        </div>
      ) : (
        <>
      {/* モバイル: カードリスト */}
      <div className="space-y-3 sm:hidden">
        {users.map((user) => (
          <div key={user.id} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="mb-2 break-all font-medium text-[var(--text)]">{user.email ?? '—'}</p>
            <div className="mb-3 space-y-1 text-xs text-[var(--text3)]">
              <p>作成日: {formatDateTime(user.created_at)}</p>
              <p>最終ログイン: {formatDateTime(user.last_sign_in_at)}</p>
            </div>
            <PlanSelect
              userId={user.id}
              currentPlan={user.plan}
              onChanged={(plan) => handlePlanChange(user.id, plan)}
            />
          </div>
        ))}
      </div>

      {/* PC: テーブル */}
      <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg2)] text-left">
              <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text3)]">メールアドレス</th>
              <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text3)]">プラン</th>
              <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text3)]">作成日</th>
              <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text3)]">最終ログイン</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr
                key={user.id}
                className={`transition-colors hover:bg-[var(--bg2)] ${i < users.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
              >
                <td className="px-5 py-3.5 font-medium text-[var(--text)]">{user.email ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PLAN_BADGE[user.plan]}`}>
                      {PLAN_OPTIONS.find((o) => o.value === user.plan)?.label ?? user.plan}
                    </span>
                    <PlanSelect
                      userId={user.id}
                      currentPlan={user.plan}
                      onChanged={(plan) => handlePlanChange(user.id, plan)}
                    />
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[var(--text2)]">{formatDateTime(user.created_at)}</td>
                <td className="px-5 py-3.5 text-[var(--text2)]">{formatDateTime(user.last_sign_in_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  )
}
