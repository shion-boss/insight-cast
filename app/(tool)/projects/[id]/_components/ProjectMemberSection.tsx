'use client'

import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'

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

  const fetchMembers = async () => {
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
  }

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

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

  const handleRoleChange = async (userId: string, role: 'editor' | 'viewer') => {
    try {
      await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      await fetchMembers()
    } catch {
      // サイレントエラー（再取得で整合）
    }
  }

  const handleDeleteMember = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await fetch(`/api/projects/${projectId}/members/${confirmDelete.userId}`, {
        method: 'DELETE',
      })
      setConfirmDelete(null)
      await fetchMembers()
    } catch {
      // サイレントエラー
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelInvite = async () => {
    if (!confirmCancelInvite) return
    setCancelingInvite(true)
    try {
      await fetch(`/api/projects/${projectId}/invitations/${confirmCancelInvite.id}`, {
        method: 'DELETE',
      })
      setConfirmCancelInvite(null)
      await fetchMembers()
    } catch {
      // サイレントエラー
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
        {loading ? (
          <div className="p-6 text-sm text-[var(--text3)]">読み込み中...</div>
        ) : error ? (
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
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value as 'editor' | 'viewer')}
                        className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 min-h-[36px]"
                        aria-label={`${member.name ?? member.email ?? 'メンバー'}の権限`}
                      >
                        <option value="editor">編集者</option>
                        <option value="viewer">閲覧者</option>
                      </select>
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
          description="削除するとこの取材先にアクセスできなくなります。再度招待することで復元できます。"
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
