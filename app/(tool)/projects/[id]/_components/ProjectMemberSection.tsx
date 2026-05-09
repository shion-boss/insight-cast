'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { showToast } from '@/lib/client/toast'
import { dispatchIntervieweesChanged } from '@/lib/interviewees-events'

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
        className="min-h-[36px] inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] text-[var(--text)] hover:bg-[var(--bg2)] disabled:opacity-50 disabled:pointer-events-none"
      >
        <span>{currentLabel}</span>
        <span aria-hidden="true" className="text-[var(--text2)]">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-10 w-64 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[var(--elevation-3)]"
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
                className={`w-full flex items-start gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:bg-[var(--bg2)] ${
                  isCurrent ? 'cursor-default' : ''
                }`}
              >
                <span aria-hidden="true" className={`flex-shrink-0 w-4 pt-0.5 text-center ${isCurrent ? 'text-[var(--on-primary-container)]' : 'text-transparent'}`}>
                  ✓
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-[var(--text)]">{role.label}</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--text2)]">{role.description}</span>
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

export function ProjectMemberSection({
  projectId,
  // メンバー招待が現在のプランで許可されているか。サーバー側 API
  // (POST /api/projects/[id]/members) は business プランしか受け付けないため、
  // UI でも事前に disabled + 案内するのが整合的。
  memberInvitesAllowed = true,
}: { projectId: string; memberInvitesAllowed?: boolean }) {
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

  // メンバー編集モーダル（プロジェクト内のメタデータ）
  const [editTarget, setEditTarget] = useState<{ userId: string; displayName: string } | null>(null)
  const [editForm, setEditForm] = useState<{ industry: string; role: string; notes: string }>({ industry: '', role: '', notes: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const openEdit = useCallback(async (userId: string, displayName: string) => {
    setEditTarget({ userId, displayName })
    setEditError(null)
    setEditForm({ industry: '', role: '', notes: '' })
    setEditLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}/interviewee`)
      if (res.ok) {
        const json = await res.json() as { interviewee: { industry: string | null; role: string | null; notes: string | null } | null }
        const iv = json.interviewee
        if (iv) {
          setEditForm({
            industry: iv.industry ?? '',
            role: iv.role ?? '',
            notes: iv.notes ?? '',
          })
        }
      }
    } catch {
      // 取得失敗時は空のまま
    } finally {
      setEditLoading(false)
    }
  }, [projectId])

  const handleEditSave = async () => {
    if (!editTarget) return
    setEditSaving(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${editTarget.userId}/interviewee`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: editForm.industry.trim() || null,
          role: editForm.role.trim() || null,
          notes: editForm.notes.trim() || null,
        }),
      })
      if (!res.ok) {
        setEditError('保存できませんでした。もう一度お試しください。')
        return
      }
      setEditTarget(null)
      dispatchIntervieweesChanged(projectId)
    } catch {
      setEditError('保存できませんでした。もう一度お試しください。')
    } finally {
      setEditSaving(false)
    }
  }

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
          プロジェクトのメンバー
        </h2>
        {data && (
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] font-medium text-[var(--text2)]">
            {data.total} / {data.max} 名
          </span>
        )}
      </div>

      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {loading ? null : error ? (
          <div className="p-6 text-base text-[var(--err)]">{error}</div>
        ) : (
          <>
            {/* メンバー一覧 */}
            {data && data.members.length > 0 && (
              <div className="divide-y divide-[var(--border)]">
                {data.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-[var(--text)] truncate">
                        {member.name ?? member.email ?? member.userId}
                      </p>
                      {member.name && member.email && (
                        <p className="text-[13px] text-[var(--text2)] truncate">{member.email}</p>
                      )}
                      <p className="text-[11px] text-[var(--text2)] mt-0.5">
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
                        onClick={() => openEdit(member.userId, member.name ?? member.email ?? 'メンバー')}
                        className="min-h-[36px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                        aria-label={`${member.name ?? member.email ?? 'メンバー'}の取材情報を編集`}
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ userId: member.userId, name: member.name ?? member.email ?? 'メンバー' })}
                        className="min-h-[36px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] text-[var(--text2)] hover:border-[var(--err)]/40 hover:text-[var(--err)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
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
                  <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text2)] uppercase">招待保留中</p>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {data.invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-[var(--text2)] truncate">{inv.email}</p>
                        <p className="text-[11px] text-[var(--text2)] mt-0.5">
                          {ROLE_LABELS[inv.role] ?? inv.role} · 期限: {formatExpiry(inv.expires_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmCancelInvite({ id: inv.id, email: inv.email })}
                        className="min-h-[36px] flex-shrink-0 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] text-[var(--text2)] hover:border-[var(--err)]/40 hover:text-[var(--err)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
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
              <div className="px-5 py-8 text-center text-base text-[var(--text2)]">
                まだメンバーがいません。下のフォームから招待できます。
              </div>
            )}

            {/* 招待フォーム */}
            <div className="border-t border-[var(--border)] px-5 py-5">
              <p className="text-base font-semibold text-[var(--text)] mb-3">メンバーを招待する</p>
              {!memberInvitesAllowed ? (
                <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-4">
                  <p className="text-base text-[var(--text2)] leading-relaxed">
                    メンバー招待は<strong className="font-semibold text-[var(--text)]">法人プラン</strong>でご利用いただけます。
                  </p>
                  <a
                    href="/pricing?reason=member_invites"
                    className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-base font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    プランを見る <span aria-hidden="true">→</span>
                  </a>
                </div>
              ) : isAtLimit ? (
                <p className="text-base text-[var(--text2)]">
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
                    className="flex-1 min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] placeholder-[var(--text3)] disabled:opacity-50"
                    aria-label="招待するメールアドレス"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    disabled={inviting}
                    className="min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] disabled:opacity-50"
                    aria-label="権限"
                  >
                    <option value="editor">編集者（取材・記事生成）</option>
                    <option value="viewer">閲覧者（閲覧のみ）</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="min-h-[44px] rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {inviting ? '送信中...' : '招待する'}
                  </button>
                </form>
              )}
              {inviteMessage && (
                <p
                  className={`mt-2 text-base ${inviteMessage.type === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--err)]'}`}
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

      {/* メンバー取材情報編集モーダル */}
      {editTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-edit-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !editSaving) setEditTarget(null) }}
        >
          <div className="w-full max-w-md rounded-[var(--r-lg)] bg-[var(--surface)] p-6 shadow-[var(--elevation-3)]">
            <h3 id="member-edit-title" className="text-base font-bold text-[var(--text)] mb-1">取材情報を編集</h3>
            <p className="text-[13px] text-[var(--text2)] mb-4">
              プロジェクト内のメモです。
            </p>
            {editLoading ? (
              <p className="text-base text-[var(--text2)] py-6 text-center">読み込み中...</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="member-edit-name" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                    名前
                  </label>
                  <input
                    id="member-edit-name"
                    type="text"
                    value={editTarget.displayName}
                    readOnly
                    aria-readonly="true"
                    className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-base text-[var(--text3)] cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-[13px] text-[var(--text3)]">名前は本人がプロフィールから変更できます。</p>
                </div>
                <div>
                  <label htmlFor="member-edit-role" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                    役職・関係（任意）
                  </label>
                  <input
                    id="member-edit-role"
                    type="text"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    placeholder="例: 代表、店長"
                    maxLength={100}
                    disabled={editSaving}
                    className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] placeholder-[var(--text3)] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="member-edit-industry" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                    業種（任意）
                  </label>
                  <input
                    id="member-edit-industry"
                    type="text"
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    placeholder="例: 飲食業"
                    maxLength={100}
                    disabled={editSaving}
                    className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] placeholder-[var(--text3)] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="member-edit-notes" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                    メモ（任意）
                  </label>
                  <textarea
                    id="member-edit-notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    maxLength={1000}
                    disabled={editSaving}
                    className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] disabled:opacity-50"
                  />
                </div>
                {editError && (
                  <p role="alert" className="text-base text-[var(--err)]">{editError}</p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    disabled={editSaving}
                    className="min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-base font-semibold text-[var(--text2)] hover:bg-[var(--bg2)] disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleEditSave}
                    disabled={editSaving}
                    className="min-h-[44px] rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {editSaving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
