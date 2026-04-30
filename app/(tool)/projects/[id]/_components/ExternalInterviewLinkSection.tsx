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
  use_count: number
  max_use_count: number
  is_active: boolean
  created_at: string
}

const INTERVIEWER_OPTIONS = [
  { value: 'mint', label: 'ミント（ネコ）' },
  { value: 'claus', label: 'クラウス（フクロウ）' },
  { value: 'rain', label: 'レイン（キツネ）' },
]

export function ExternalInterviewLinkSection({ projectId }: { projectId: string }) {
  const [links, setLinks] = useState<ExternalLink[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // 発行フォーム
  const [interviewerType, setInterviewerType] = useState('mint')
  const [theme, setTheme] = useState('')
  const [targetName, setTargetName] = useState('')
  const [targetIndustry, setTargetIndustry] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [issueMessage, setIssueMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // コピー状態
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // 無効化確認ダイアログ
  const [confirmDeactivate, setConfirmDeactivate] = useState<{ token: string; theme: string } | null>(null)
  const [deactivating, setDeactivating] = useState(false)

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

  useEffect(() => {
    void fetchLinks()
  }, [fetchLinks])

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!theme.trim()) return

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
          targetName: targetName.trim() || undefined,
          targetIndustry: targetIndustry.trim() || undefined,
        }),
      })

      const json = await res.json() as { link?: ExternalLink; error?: string }

      if (res.ok && json.link) {
        setIssueMessage({ type: 'ok', text: '取材リンクを発行しました。' })
        setTheme('')
        setTargetName('')
        setTargetIndustry('')
        await fetchLinks()
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

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return
    setDeactivating(true)
    try {
      const res = await fetch(`/api/interview-links/${confirmDeactivate.token}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('failed')
      setConfirmDeactivate(null)
      await fetchLinks()
    } catch {
      setListError('無効化に失敗しました。もう一度お試しください。')
      setConfirmDeactivate(null)
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <section aria-labelledby="external-links-section-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="external-links-section-title" className="text-[16px] font-bold text-[var(--text)]">
          取材リンク
        </h2>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text2)]">
          法人プラン
        </span>
      </div>

      <p className="text-sm text-[var(--text3)] mb-4">
        リンクをSNSや知人に共有して、取材に答えてもらえます。1つのリンクで最大2回まで使えます。
      </p>

      {/* 発行フォーム */}
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 mb-4">
        <p className="text-sm font-semibold text-[var(--text)] mb-4">新しいリンクを発行する</p>
        <form onSubmit={handleIssue} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ext-interviewer-type" className="block text-xs font-medium text-[var(--text2)] mb-1.5">
                インタビュアー
              </label>
              <select
                id="ext-interviewer-type"
                value={interviewerType}
                onChange={(e) => setInterviewerType(e.target.value)}
                disabled={issuing}
                className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50"
              >
                {INTERVIEWER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ext-theme" className="block text-xs font-medium text-[var(--text2)] mb-1.5">
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
                className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ext-target-name" className="block text-xs font-medium text-[var(--text2)] mb-1.5">
                相手の名前（任意）
              </label>
              <input
                id="ext-target-name"
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="例: 山田太郎"
                maxLength={100}
                disabled={issuing}
                className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="ext-target-industry" className="block text-xs font-medium text-[var(--text2)] mb-1.5">
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
                className="w-full min-h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={issuing || !theme.trim()}
              className="min-h-[44px] rounded-[var(--r-sm)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer"
            >
              {issuing ? '発行中...' : 'リンクを発行する'}
            </button>
          </div>
          {issueMessage && (
            <p
              className={`text-sm ${issueMessage.type === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--err)]'}`}
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
          <div className="p-6 text-sm text-[var(--text3)] text-center">読み込み中...</div>
        ) : listError ? (
          <div className="p-6 text-sm text-[var(--err)]">{listError}</div>
        ) : links.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[var(--text3)]">
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
                    <p className="text-sm font-medium text-[var(--text)] truncate">{link.theme}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[var(--text3)]">
                        {link.use_count} / {link.max_use_count} 回使用
                      </span>
                      {isExpired && (
                        <span className="text-[11px] text-[var(--text3)] bg-[var(--bg2)] border border-[var(--border)] rounded-full px-2 py-0.5">
                          無効
                        </span>
                      )}
                      {link.target_name && (
                        <span className="text-[11px] text-[var(--text3)] truncate">{link.target_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(link.token)}
                      disabled={isExpired}
                      aria-label={`${link.theme}のリンクをコピー`}
                      className="min-h-[36px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 cursor-pointer transition-colors"
                    >
                      {copiedToken === link.token ? 'コピー済み' : 'リンクをコピー'}
                    </button>
                    {link.is_active && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeactivate({ token: link.token, theme: link.theme })}
                        aria-label={`${link.theme}のリンクを無効化`}
                        className="min-h-[36px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text3)] hover:border-[var(--err)]/40 hover:text-[var(--err)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40 cursor-pointer transition-colors"
                      >
                        無効化
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 無効化確認ダイアログ */}
      {confirmDeactivate && (
        <ConfirmDialog
          dialogId="deactivate-link"
          title="リンクを無効化しますか？"
          description="無効化すると、このリンクからの取材が受けられなくなります。"
          subject={confirmDeactivate.theme}
          confirmLabel="無効化する"
          confirmingLabel="処理中..."
          confirming={deactivating}
          onCancel={() => setConfirmDeactivate(null)}
          onConfirm={handleDeactivate}
        />
      )}
    </section>
  )
}
