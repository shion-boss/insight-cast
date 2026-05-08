'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CharacterAvatar } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

type ExternalLink = {
  id: string
  token: string
  interviewer_type: string
  theme: string
  target_name: string | null
  target_industry: string | null
  interviewee_id: string | null
  use_count: number
  max_use_count: number
  is_active: boolean
  created_at: string
}

type IntervieweeOption = {
  id: string
  name: string
  industry: string | null
}

export type CastOption = {
  id: string
  name: string
  species: string
}

const NEW_INTERVIEWEE_VALUE = '__new__'

export function ExternalInterviewLinkSection({
  projectId,
  casts,
}: {
  projectId: string
  casts: CastOption[]
}) {
  const [links, setLinks] = useState<ExternalLink[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // 取材先の選択肢
  const [interviewees, setInterviewees] = useState<IntervieweeOption[]>([])

  // 発行フォーム
  const [interviewerType, setInterviewerType] = useState(casts[0]?.id ?? 'mint')
  const [theme, setTheme] = useState('')
  const [intervieweeChoice, setIntervieweeChoice] = useState<string>(NEW_INTERVIEWEE_VALUE)
  const [targetName, setTargetName] = useState('')
  const [targetIndustry, setTargetIndustry] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [issueMessage, setIssueMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // コピー状態
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // 削除確認ダイアログ
  const [confirmDelete, setConfirmDelete] = useState<{ token: string; theme: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/interview-links?projectId=${projectId}`)
      if (!res.ok) throw new Error('failed')
      const json = await res.json() as { links: ExternalLink[] }
      setLinks(json.links)
    } catch {
      setListError('取材リンクの一覧を読み込めませんでした。')
    } finally {
      setLoadingList(false)
    }
  }, [projectId])

  const fetchInterviewees = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/interviewees`)
      if (!res.ok) return
      const json = await res.json() as { interviewees: IntervieweeOption[] }
      setInterviewees(json.interviewees)
    } catch {
      // 取材先が取れなくてもリンク発行は新規追加で続行できる
    }
  }, [projectId])

  useEffect(() => {
    void fetchLinks()
    void fetchInterviewees()
  }, [fetchLinks, fetchInterviewees])

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!theme.trim()) return

    const useExisting = intervieweeChoice !== NEW_INTERVIEWEE_VALUE

    setIssuing(true)
    setIssueMessage(null)

    try {
      const res = await fetch('/api/interview-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          interviewerType,
          theme: theme.trim(),
          ...(useExisting
            ? { intervieweeId: intervieweeChoice }
            : {
                targetName: targetName.trim() || undefined,
                targetIndustry: targetIndustry.trim() || undefined,
              }),
        }),
      })

      const json = await res.json() as { link?: ExternalLink; error?: string }

      if (res.ok && json.link) {
        setIssueMessage({ type: 'ok', text: '取材リンクを発行しました。' })
        setTheme('')
        setTargetName('')
        setTargetIndustry('')
        setIntervieweeChoice(NEW_INTERVIEWEE_VALUE)
        await Promise.all([fetchLinks(), fetchInterviewees()])
      } else {
        const msg = json.error === 'plan_not_supported'
          ? '取材リンクの発行は法人プランのみ利用できます。'
          : '発行に失敗しました。もう一度お試しください。'
        setIssueMessage({ type: 'err', text: msg })
      }
    } catch {
      setIssueMessage({ type: 'err', text: '発行に失敗しました。もう一度お試しください。' })
    } finally {
      setIssuing(false)
    }
  }

  const handleCopy = async (token: string) => {
    const url = `${window.location.origin}/interview/ext/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch {
      // clipboard API が使えない場合のフォールバック
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/interview-links/${confirmDelete.token}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('failed')
      setConfirmDelete(null)
      await fetchLinks()
    } catch {
      setListError('削除に失敗しました。もう一度お試しください。')
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const isNewInterviewee = intervieweeChoice === NEW_INTERVIEWEE_VALUE

  return (
    <section aria-labelledby="external-links-section-title">
      <h2 id="external-links-section-title" className="text-[16px] font-bold text-[var(--text)] mb-3">
        取材リンク
      </h2>

      <p className="text-base text-[var(--text2)] mb-4">
        リンクをSNSや知人に共有して、取材に答えてもらえます。1つのリンクで最大2回まで使えます。同じ取材先を選んで発行すると、2回目以降は前回の話を踏まえた取材になります。
      </p>

      {/* 発行フォーム */}
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 mb-4">
        <p className="text-base font-semibold text-[var(--text)] mb-4">新しいリンクを発行する</p>
        <form onSubmit={handleIssue} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ext-interviewer-type" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                インタビュアー
              </label>
              <select
                id="ext-interviewer-type"
                value={interviewerType}
                onChange={(e) => setInterviewerType(e.target.value)}
                disabled={issuing || casts.length === 0}
                className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] disabled:opacity-50"
              >
                {casts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}（{c.species}）</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ext-theme" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                テーマ <span className="text-[var(--err)]">*</span>
              </label>
              <input
                id="ext-theme"
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="例: サービスへの思い"
                required
                maxLength={200}
                disabled={issuing}
                className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] placeholder-[var(--text3)] disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ext-interviewee-choice" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
              取材先
            </label>
            <select
              id="ext-interviewee-choice"
              value={intervieweeChoice}
              onChange={(e) => setIntervieweeChoice(e.target.value)}
              disabled={issuing}
              className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] disabled:opacity-50"
            >
              <option value={NEW_INTERVIEWEE_VALUE}>＋ 新しい取材先</option>
              {interviewees.length > 0 && <option disabled>──────</option>}
              {interviewees.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}{i.industry ? `（${i.industry}）` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[13px] text-[var(--text2)]">
              既存の取材先を選ぶと、過去の取材を踏まえて続きを聞いてもらえます。
            </p>
          </div>

          {isNewInterviewee && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ext-target-name" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                  相手の名前（任意）
                </label>
                <input
                  id="ext-target-name"
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="例: 山田"
                  maxLength={100}
                  disabled={issuing}
                  className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] placeholder-[var(--text3)] disabled:opacity-50"
                />
                <p className="mt-1.5 text-[13px] text-[var(--text2)]">入力すると「○○さん」と呼びかけながら取材を進めます。</p>
              </div>
              <div>
                <label htmlFor="ext-target-industry" className="block text-[13px] font-medium text-[var(--text2)] mb-1.5">
                  相手の業種（任意）
                </label>
                <input
                  id="ext-target-industry"
                  type="text"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  placeholder="例: 飲食業"
                  maxLength={100}
                  disabled={issuing}
                  className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--text)] placeholder-[var(--text3)] disabled:opacity-50"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={issuing || !theme.trim()}
              className="min-h-[44px] rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {issuing ? '発行中...' : 'リンクを発行する'}
            </button>
          </div>
          {issueMessage && (
            <p
              className={`text-base ${issueMessage.type === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--err)]'}`}
              role="status"
              aria-live="polite"
            >
              {issueMessage.text}
            </p>
          )}
        </form>
      </div>

      {/* 発行済みリンク一覧 */}
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {loadingList ? (
          <div className="p-6 text-base text-[var(--text2)] text-center">読み込み中...</div>
        ) : listError ? (
          <div className="p-6 text-base text-[var(--err)]">{listError}</div>
        ) : links.length === 0 ? (
          <div className="px-5 py-8 text-center text-base text-[var(--text2)]">
            まだリンクがありません。上のフォームから発行できます。
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {links.map((link) => {
              const isExpired = !link.is_active || link.use_count >= link.max_use_count
              const char = getCharacter(link.interviewer_type)
              return (
                <div
                  key={link.id}
                  className={`flex items-center gap-3 px-5 py-4 ${isExpired ? 'opacity-50' : ''}`}
                >
                  <CharacterAvatar
                    src={char?.icon48}
                    alt={char?.name ?? link.interviewer_type}
                    emoji={char?.emoji}
                    size={32}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-[var(--text)] truncate">{link.theme}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[var(--text2)]">
                        {link.use_count} / {link.max_use_count} 回使用
                      </span>
                      {isExpired && (
                        <span className="text-[11px] text-[var(--text2)] bg-[var(--bg2)] border border-[var(--border)] rounded-full px-2 py-0.5">
                          無効
                        </span>
                      )}
                      {link.target_name && (
                        <span className="text-[11px] text-[var(--text2)] truncate">{link.target_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(link.token)}
                      disabled={isExpired}
                      aria-label={`${link.theme}のリンクをコピー`}
                      className="min-h-[36px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                      {copiedToken === link.token ? 'コピー済み' : 'リンクをコピー'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ token: link.token, theme: link.theme })}
                      aria-label={`${link.theme}のリンクを削除`}
                      className="min-h-[36px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[13px] text-[var(--text2)] hover:border-[var(--err)]/40 hover:text-[var(--err)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40 cursor-pointer transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      {confirmDelete && (
        <ConfirmDialog
          dialogId="delete-link"
          title="リンクを削除しますか？"
          description="削除すると、このリンクからは取材を受けられなくなります。過去にこのリンクで行われた取材メモは残ります。"
          subject={confirmDelete.theme}
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
