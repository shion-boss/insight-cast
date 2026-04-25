'use client'

import Link from 'next/link'
import { useDeferredValue, useState } from 'react'
import { CharacterAvatar, getButtonClass } from '@/components/ui'
import InterviewStatusPills from '@/components/interview-status-pills'

type InterviewItem = {
  id: string
  projectId: string
  projectLabel: string
  interviewerName: string
  interviewerEmoji: string
  icon48: Parameters<typeof CharacterAvatar>[0]['src']
  isDone: boolean
  hasSummary: boolean
  hasArticle: boolean
  hasUncreatedThemes: boolean
  articleStatus: string | null
  articleCount: number
  createdAtLabel: string
  href: string
}

function selectClassName() {
  return 'w-full min-h-11 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 hover:border-[var(--border2)] focus:border-[var(--accent)] focus:outline-none focus:ring-3 focus:ring-[var(--accent-l)]'
}

function getUniqueProjectOptions(items: InterviewItem[]) {
  const seen = new Map<string, string>()
  for (const item of items) {
    if (!seen.has(item.projectId)) seen.set(item.projectId, item.projectLabel)
  }
  return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ja'))
}

export function InterviewsFilterClient({ items }: { items: InterviewItem[] }) {
  const [projectId, setProjectId] = useState('all')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const normalized = deferredQuery.trim().toLowerCase()

  const projectOptions = getUniqueProjectOptions(items)

  const filtered = items.filter((item) => {
    if (projectId !== 'all' && item.projectId !== projectId) return false
    if (normalized && !item.projectLabel.toLowerCase().includes(normalized) && !item.interviewerName.toLowerCase().includes(normalized)) return false
    return true
  })

  const hasFilter = projectId !== 'all' || query.trim().length > 0

  return (
    <>
      {projectOptions.length > 1 && (
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">取材先</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={selectClassName()}>
              <option value="all">すべて</option>
              {projectOptions.map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          {hasFilter && (
            <button
              type="button"
              onClick={() => { setProjectId('all'); setQuery('') }}
              className={getButtonClass('secondary', 'px-3 py-2 text-xs')}
            >
              絞り込みを解除
            </button>
          )}
          <span className="ml-auto text-sm text-[var(--text3)]">{filtered.length} / {items.length} 件</span>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-4 sm:p-6 grid grid-cols-[40px_1fr] sm:grid-cols-[48px_1fr_auto] gap-3 sm:gap-4 items-start hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-shadow"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--bg2)]">
              <CharacterAvatar
                src={item.icon48}
                alt={`${item.interviewerName}のアイコン`}
                emoji={item.interviewerEmoji}
                size={48}
                className="bg-amber-50"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <p className="font-bold text-[var(--text)] text-base leading-[1.3]">
                  {item.projectLabel}
                </p>
                {item.isDone ? (
                  <span className="bg-[var(--ok-l)] text-[var(--ok)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">完了</span>
                ) : (
                  <span className="bg-[var(--warn-l)] text-[var(--warn)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">途中</span>
                )}
              </div>
              <p className="text-xs text-[var(--text2)] mb-3">
                {item.interviewerName} · {item.createdAtLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                <InterviewStatusPills
                  interviewId={item.id}
                  hasSummary={item.hasSummary}
                  hasArticle={item.hasArticle}
                  hasUncreatedThemes={item.hasUncreatedThemes}
                  articleStatus={item.articleStatus}
                  summaryLabel="取材メモあり"
                  articleLabel="記事あり"
                  creatingLabel="作成中"
                  uncreatedLabel="未作成テーマあり"
                />
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-2">
              <p className="text-xs text-[var(--text3)]">記事素材 {item.articleCount}本</p>
              {item.isDone ? (
                <span className="border border-[var(--border)] text-[var(--text2)] text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">
                  メモを見る →
                </span>
              ) : (
                <span className="bg-[var(--accent)] text-white text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">
                  続きを取材する →
                </span>
              )}
            </div>
            {/* モバイル用アクション（2カラムグリッドの下に展開） */}
            <div className="col-span-2 flex items-center justify-between gap-2 pt-2 sm:hidden">
              <p className="text-xs text-[var(--text3)]">記事素材 {item.articleCount}本</p>
              {item.isDone ? (
                <span className="border border-[var(--border)] text-[var(--text2)] text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">
                  メモを見る →
                </span>
              ) : (
                <span className="bg-[var(--accent)] text-white text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">
                  続きを取材する →
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
