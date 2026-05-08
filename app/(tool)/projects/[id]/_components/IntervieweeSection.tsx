'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'

type Interviewee = {
  id: string
  name: string
  industry: string | null
  role: string | null
  notes: string | null
  linked_user_id: string | null
  created_at: string
  updated_at: string
  interview_count: number
  article_count: number
  last_interview_at: string | null
}

type EditState = {
  id: string
  name: string
  industry: string
  role: string
  notes: string
} | null

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value)).replace(/\//g, '.')
}

export function IntervieweeSection({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Interviewee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 新規追加フォーム
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createIndustry, setCreateIndustry] = useState('')
  const [createRole, setCreateRole] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMessage, setCreateMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // 編集モーダル
  const [edit, setEdit] = useState<EditState>(null)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // 削除確認
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchList = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/projects/${projectId}/interviewees`)
      if (!res.ok) throw new Error('failed')
      const json = await res.json() as { interviewees: Interviewee[] }
      setItems(json.interviewees)
    } catch {
      setError('取材先を読み込めませんでした。')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) return
    setCreating(true)
    setCreateMessage(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/interviewees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          industry: createIndustry.trim() || undefined,
          role: createRole.trim() || undefined,
        }),
      })
      const json = await res.json() as { error?: string }
      if (res.ok) {
        setCreateName('')
        setCreateIndustry('')
        setCreateRole('')
        setShowCreate(false)
        await fetchList()
      } else {
        const msg = json.error === 'duplicate_name'
          ? '同じ名前の取材先がすでに登録されています。'
          : '追加に失敗しました。もう一度お試しください。'
        setCreateMessage({ type: 'err', text: msg })
      }
    } catch {
      setCreateMessage({ type: 'err', text: '追加に失敗しました。もう一度お試しください。' })
    } finally {
      setCreating(false)
    }
  }

  const handleEditSave = async () => {
    if (!edit) return
    setEditing(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/interviewees/${edit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: edit.name.trim(),
          industry: edit.industry.trim() || null,
          role: edit.role.trim() || null,
          notes: edit.notes.trim() || null,
        }),
      })
      const json = await res.json() as { error?: string }
      if (res.ok) {
        setEdit(null)
        await fetchList()
      } else {
        const msg = json.error === 'duplicate_name'
          ? '同じ名前の取材先がすでに登録されています。'
          : '更新に失敗しました。'
        setEditError(msg)
      }
    } catch {
      setEditError('更新に失敗しました。')
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/interviewees/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      setConfirmDelete(null)
      await fetchList()
    } catch {
      setError('削除に失敗しました。')
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section aria-labelledby="interviewees-section-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="interviewees-section-title" className="text-[16px] font-bold text-[var(--text)]">
          取材先
        </h2>
        {!showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="text-[13px] font-semibold text-[var(--accent)] hover:text-[var(--accent-h)] transition-colors rounded"
          >
            ＋ 新しい取材先を追加
          </button>
        )}
      </div>

      <p className="text-base text-[var(--text2)] mb-4">
        取材リンクで何度か話を聞きたい相手を登録できます。同じ取材先でリンクを発行すると、前回の話を踏まえた取材になります。
      </p>

      {/* 新規追加フォーム */}
      {showCreate && (
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 mb-4">
          <p className="text-base font-semibold text-[var(--text)] mb-4">取材先を追加する</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="iv-create-name" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                  名前 <span className="text-[var(--err)]">*</span>
                </label>
                <input
                  id="iv-create-name"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="例: 山田太郎"
                  required
                  maxLength={100}
                  disabled={creating}
                  className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] placeholder-[var(--text3)] disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="iv-create-role" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                  役職・関係（任意）
                </label>
                <input
                  id="iv-create-role"
                  type="text"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  placeholder="例: 代表"
                  maxLength={100}
                  disabled={creating}
                  className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] placeholder-[var(--text3)] disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="iv-create-industry" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                  業種（任意）
                </label>
                <input
                  id="iv-create-industry"
                  type="text"
                  value={createIndustry}
                  onChange={(e) => setCreateIndustry(e.target.value)}
                  placeholder="例: 飲食業"
                  maxLength={100}
                  disabled={creating}
                  className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] placeholder-[var(--text3)] disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateMessage(null) }}
                disabled={creating}
                className="min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-base font-semibold text-[var(--text2)] hover:bg-[var(--bg2)] disabled:opacity-50 cursor-pointer transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={creating || !createName.trim()}
                className="min-h-[44px] rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {creating ? '追加中...' : '追加する'}
              </button>
            </div>
            {createMessage && (
              <p
                className={`text-base ${createMessage.type === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--err)]'}`}
                role="status"
                aria-live="polite"
              >
                {createMessage.text}
              </p>
            )}
          </form>
        </div>
      )}

      {/* 取材先一覧 */}
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {loading ? (
          <div className="p-6 text-base text-[var(--text2)] text-center">読み込み中...</div>
        ) : error ? (
          <div className="p-6 text-base text-[var(--err)]">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-8 text-center text-base text-[var(--text2)]">
            まだ取材先が登録されていません。
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {items.map((iv) => (
              <div key={iv.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-semibold text-[var(--text)] truncate">{iv.name}</p>
                    {iv.role && (
                      <span className="text-[11px] text-[var(--text2)]">{iv.role}</span>
                    )}
                    {iv.industry && (
                      <span className="text-[11px] bg-[var(--bg2)] text-[var(--text2)] px-2 py-0.5 rounded-full">{iv.industry}</span>
                    )}
                    {iv.linked_user_id && (
                      <span className="text-[11px] bg-[var(--accent-l)] text-[var(--on-primary-container)] px-2 py-0.5 rounded-full">メンバー</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[13px] text-[var(--text2)]">
                    <span>取材 <span className="font-semibold text-[var(--text)]">{iv.interview_count}</span> 回</span>
                    <span>記事 <span className="font-semibold text-[var(--text)]">{iv.article_count}</span> 本</span>
                    <span>最終取材: {formatDate(iv.last_interview_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEdit({
                      id: iv.id,
                      name: iv.name,
                      industry: iv.industry ?? '',
                      role: iv.role ?? '',
                      notes: iv.notes ?? '',
                    })}
                    aria-label={`${iv.name}を編集`}
                    className="min-h-[36px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer transition-colors"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ id: iv.id, name: iv.name })}
                    aria-label={`${iv.name}を削除`}
                    className="min-h-[36px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] text-[var(--text2)] hover:border-[var(--err)]/40 hover:text-[var(--err)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40 cursor-pointer transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {edit && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="iv-edit-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEdit(null) }}
        >
          <div className="w-full max-w-md rounded-[var(--r-lg)] bg-[var(--surface)] p-6 shadow-[var(--elevation-3)]">
            <h3 id="iv-edit-title" className="text-base font-bold text-[var(--text)] mb-4">取材先を編集</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="iv-edit-name" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                  名前 <span className="text-[var(--err)]">*</span>
                </label>
                <input
                  id="iv-edit-name"
                  type="text"
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  maxLength={100}
                  disabled={editing}
                  className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="iv-edit-role" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                  役職・関係（任意）
                </label>
                <input
                  id="iv-edit-role"
                  type="text"
                  value={edit.role}
                  onChange={(e) => setEdit({ ...edit, role: e.target.value })}
                  maxLength={100}
                  disabled={editing}
                  className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="iv-edit-industry" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                  業種（任意）
                </label>
                <input
                  id="iv-edit-industry"
                  type="text"
                  value={edit.industry}
                  onChange={(e) => setEdit({ ...edit, industry: e.target.value })}
                  maxLength={100}
                  disabled={editing}
                  className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="iv-edit-notes" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                  メモ（任意）
                </label>
                <textarea
                  id="iv-edit-notes"
                  value={edit.notes}
                  onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                  rows={3}
                  maxLength={1000}
                  disabled={editing}
                  className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] disabled:opacity-50"
                />
              </div>
              {editError && (
                <p role="alert" className="text-base text-[var(--err)]">{editError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEdit(null)}
                  disabled={editing}
                  className="min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-base font-semibold text-[var(--text2)] hover:bg-[var(--bg2)] disabled:opacity-50 cursor-pointer transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={editing || !edit.name.trim()}
                  className="min-h-[44px] rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {editing ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      {confirmDelete && (
        <ConfirmDialog
          dialogId="delete-interviewee"
          title="取材先を削除しますか？"
          description="削除しても過去の取材メモ・記事は残りますが、新しい取材リンクからは選べなくなります。"
          subject={confirmDelete.name}
          confirmLabel="削除する"
          confirmingLabel="処理中..."
          confirming={deleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  )
}
