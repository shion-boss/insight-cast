'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { showToast } from '@/lib/client/toast'

type RoleKey = 'editor' | 'viewer'

const ROLE_DEFS: Array<{ key: RoleKey; label: string; description: string }> = [
  { key: 'editor', label: '編集者', description: '取材・記事生成・再調査ができます' },
  { key: 'viewer', label: '閲覧者', description: '取材結果と記事を見るだけです' },
]

function RoleMenu({
  currentRole,
  memberName,
  disabled,
  onChange,
}: {
  currentRole: RoleKey
  memberName: string
  disabled: boolean
  onChange: (next: RoleKey) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const currentLabel = ROLE_DEFS.find((r) => r.key === currentRole)?.label ?? currentRole

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${memberName}の権限を変更`}
        className="min-h-[36px] inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text)] hover:bg-[var(--bg2)] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        <span>{currentLabel}</span>
        <span aria-hidden="true" className="text-[var(--text3)]">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-10 w-64 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
        >
          {ROLE_DEFS.map((role) => {
            const isCurrent = role.key === currentRole
            return (
              <button
                key={role.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  if (!isCurrent) onChange(role.key)
                }}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:bg-[var(--bg2)] ${
                  isCurrent ? 'cursor-default' : ''
                }`}
              >
                <span aria-hidden="true" className={`flex-shrink-0 w-4 pt-0.5 text-center ${isCurrent ? 'text-[var(--accent)]' : 'text-transparent'}`}>
                  ✓
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-[var(--text)]">{role.label}</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--text3)]">{role.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

type MemberInfo = {
  id: string
  userId: string
  email: string | null
  name: string | null
  role: string
  createdAt: string
}

type InvitationInfo = {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
}

type MembersData = {
  members: MemberInfo[]
  invitations: InvitationInfo[]
  total: number
  max: number
}

const ROLE_LABELS: Record<string, string> = {
  editor: '編集者',
  viewer: '閲覧者',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(value))
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ProjectMemberSection({ projectId }: { projectId: string }) {
  const [data, setData] = useState<MembersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 招待フォーム
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [inviting, setInviting] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // 削除確認ダイアログ
  const [confirmDelete, setConfirmDelete] = useState<{ userId: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 招待キャンセル確認
  const [confirmCancelInvite, setConfirmCancelInvite] = useState<{ id: string; email: string } | null>(null)
  const [cancelingInvite, setCancelingInvite] = useState(false)

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`)
      if (!res.ok) throw new Error('failed')
      const json = await res.json() as MembersData
      setData(json)
    } catch {
      setError('メンバー情報を読み込めませんでした。')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void fetchMembers()
  }, [fetchMembers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setInviteMessage(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const json = await res.json() as { ok?: boolean; error?: string; message?: string }
      if (res.ok) {
        setInviteMessage({ type: 'ok', text: `${inviteEmail} に招待メールを送りました。` })
        setInviteEmail('')
        await fetchMembers()
      } else {
        const msg = json.message ?? (
          json.error === 'already_member' ? 'このユーザーはすでにメンバーです。'
          : json.error === 'already_invited' ? 'このメールアドレスはすでに招待中です。'
          : json.error === 'self_invite' ? '自分自身は招待できません。'
          : json.error === 'member_limit_reached' ? 'メンバー上限（10名）に達しています。'
          : json.error === 'plan_not_supported' ? 'メンバー共有は法人プランのみ利用できます。'
          : '招待に失敗しました。もう一度お試しください。'
        )
        setInviteMessage({ type: 'err', text: msg })
      }
    } catch {
      setInviteMessage({ type: 'err', text: '招待に失敗しました。もう一度お試しください。' })
    } finally {
      setInviting(false)
    }
  }

  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, role: RoleKey, memberName: string) => {
    // 楽観的 UI: 即座に表示を更新してから API を叩く
    const prevData = data
    setData((current) => current ? {
      ...current,
      members: current.members.map((m) => m.userId === userId ? { ...m, role } : m),
    } : current)
    setUpdatingRoleUserId(userId)

    try {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('failed')
      const roleLabel = ROLE_DEFS.find((r) => r.key === role)?.label ?? role
      showToast({
        id: `role-change-${userId}`,
        title: '権限を変更しました',
        description: `${memberName} を${roleLabel}にしました。`,
        tone: 'success',
      })
      await fetchMembers()
    } catch {
      // ロールバック
      setData(prevData)
      showToast({
        id: `role-change-error-${userId}`,
        title: '権限を変更できませんでした',
        description: 'しばらく待ってからもう一度お試しください。',
        tone: 'warning',
      })
    } finally {
      setUpdatingRoleUserId(null)
    }
  }

  const handleDeleteMember = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${confirmDelete.userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('failed')
      setConfirmDelete(null)
      await fetchMembers()
    } catch {
      setError('メンバーを削除できませんでした。もう一度お試しください。')
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelInvite = async () => {
    if (!confirmCancelInvite) return
    setCancelingInvite(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/invitations/${confirmCancelInvite.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('failed')
      setConfirmCancelInvite(null)
      await fetchMembers()
    } catch {
      setError('招待をキャンセルできませんでした。もう一度お試しください。')
      setConfirmCancelInvite(null)
    } finally {
      setCancelingInvite(false)
    }
  }

  const isAtLimit = data ? data.total >= data.max : false

  return (
    <section aria-labelledby="members-section-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="members-section-title" className="text-[16px] font-bold text-[var(--text)]">
          取材チームのメンバー
        </h2>
        {data && (
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text2)]">
            {data.total} / {data.max} 名
          </span>
        )}
      </div>

      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {loading ? null : error ? (
          <div className="p-6 text-sm text-[var(--err)]">{error}</div>
        ) : (
          <>
            {/* メンバー一覧 */}
            {data && data.members.length > 0 && (
              <div className="divide-y divide-[var(--border)]">
                {data.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">
                        {member.name ?? member.email ?? member.userId}
                      </p>
                      {member.name && member.email && (
                        <p className="text-xs text-[var(--text3)] truncate">{member.email}</p>
                      )}
                      <p className="text-[11px] text-[var(--text3)] mt-0.5">
                        追加日: {formatDate(member.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <RoleMenu
                        currentRole={(member.role as RoleKey) ?? 'editor'}
                        memberName={member.name ?? member.email ?? 'メンバー'}
                        disabled={updatingRoleUserId === member.userId}
                        onChange={(next) => handleRoleChange(member.userId, next, member.name ?? member.email ?? 'メンバー')}
                      />
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ userId: member.userId, name: member.name ?? member.email ?? 'メンバー' })}
                        className="min-h-[36px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text3)] hover:border-[var(--err)]/40 hover:text-[var(--err)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
                        aria-label={`${member.name ?? member.email ?? 'メンバー'}を削除`}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 招待保留中 */}
            {data && data.invitations.length > 0 && (
              <div className="border-t border-[var(--border)]">
                <div className="px-5 py-3 bg-[var(--bg2)]">
                  <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">招待保留中</p>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {data.invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text2)] truncate">{inv.email}</p>
                        <p className="text-[11px] text-[var(--text3)] mt-0.5">
                          {ROLE_LABELS[inv.role] ?? inv.role} · 期限: {formatExpiry(inv.expires_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmCancelInvite({ id: inv.id, email: inv.email })}
                        className="min-h-[36px] flex-shrink-0 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text3)] hover:border-[var(--err)]/40 hover:text-[var(--err)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
                        aria-label={`${inv.email}への招待をキャンセル`}
                      >
                        取消
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data && data.members.length === 0 && data.invitations.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[var(--text3)]">
                まだメンバーがいません。下のフォームから招待できます。
              </div>
            )}

            {/* 招待フォーム */}
            <div className="border-t border-[var(--border)] px-5 py-5">
              <p className="text-sm font-semibold text-[var(--text)] mb-3">メンバーを招待する</p>
              {isAtLimit ? (
                <p className="text-sm text-[var(--text3)]">
                  メンバー上限（{data?.max}名）に達しています。メンバーを削除してから招待してください。
                </p>
              ) : (
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={emailRef}
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="メールアドレス"
                    required
                    disabled={inviting}
                    className="flex-1 min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50"
                    aria-label="招待するメールアドレス"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    disabled={inviting}
                    className="min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50"
                    aria-label="権限"
                  >
                    <option value="editor">編集者（取材・記事生成）</option>
                    <option value="viewer">閲覧者（閲覧のみ）</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="min-h-[44px] rounded-[var(--r-sm)] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    {inviting ? '送信中...' : '招待する'}
                  </button>
                </form>
              )}
              {inviteMessage && (
                <p
                  className={`mt-2 text-sm ${inviteMessage.type === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--err)]'}`}
                  role="status"
                  aria-live="polite"
                >
                  {inviteMessage.text}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* メンバー削除確認ダイアログ */}
      {confirmDelete && (
        <ConfirmDialog
          dialogId="delete-member"
          title="メンバーを削除しますか？"
          description="削除するとこのプロジェクトにアクセスできなくなります。再度招待することで復元できます。"
          subject={confirmDelete.name}
          confirmLabel="削除する"
          confirmingLabel="削除中..."
          confirming={deleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDeleteMember}
        />
      )}

      {/* 招待キャンセル確認ダイアログ（将来実装用） */}
      {confirmCancelInvite && (
        <ConfirmDialog
          dialogId="cancel-invite"
          title="招待をキャンセルしますか？"
          subject={confirmCancelInvite.email}
          confirmLabel="キャンセルする"
          confirmingLabel="処理中..."
          confirming={cancelingInvite}
          onCancel={() => setConfirmCancelInvite(null)}
          onConfirm={handleCancelInvite}
        />
      )}
    </section>
  )
}
