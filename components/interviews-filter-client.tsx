'use client'

import Link from 'next/link'
import { useState } from 'react'
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
  return 'w-full min-h-11 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 hover:border-[var(--border2)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40'
}

function getUniqueProjectOptions(items: InterviewItem[]) {
  const seen = new Map<string, string>()
  for (const item of items) {
    if (!seen.has(item.projectId)) seen.set(item.projectId, item.projectLabel)
  }
  return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ja'))
}

function getUniqueInterviewerOptions(items: InterviewItem[]) {
  return [...new Set(items.map((item) => item.interviewerName))].sort((a, b) => a.localeCompare(b, 'ja'))
}

export function InterviewsFilterClient({
  items,
  alwaysShowProjectFilter = false,
}: {
  items: InterviewItem[]
  alwaysShowProjectFilter?: boolean
}) {
  const [projectId, setProjectId] = useState('all')
  const [interviewer, setInterviewer] = useState('all')
  const [status, setStatus] = useState('all')
  const projectOptions = getUniqueProjectOptions(items)
  const interviewerOptions = getUniqueInterviewerOptions(items)
  const showProjectFilter = alwaysShowProjectFilter || projectOptions.length > 1

  const filtered = items.filter((item) => {
    if (projectId !== 'all' && item.projectId !== projectId) return false
    if (interviewer !== 'all' && item.interviewerName !== interviewer) return false
    if (status === 'done' && !item.isDone) return false
    if (status === 'in_progress' && item.isDone) return false
    return true
  })

  const hasFilter = projectId !== 'all' || interviewer !== 'all' || status !== 'all'

  function resetFilters() {
    setProjectId('all')
    setInterviewer('all')
    setStatus('all')
  }

  return (
    <>
      <section className="mb-5 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {showProjectFilter && (
            <div>
              <label htmlFor="filter-project" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
                取材先
              </label>
              <select
                id="filter-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={selectClassName()}
              >
                <option value="all">すべて</option>
                {projectOptions.map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="filter-interviewer" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
              担当
            </label>
            <select
              id="filter-interviewer"
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              className={selectClassName()}
            >
              <option value="all">すべて</option>
              {interviewerOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
              ステータス
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClassName()}
            >
              <option value="all">すべて</option>
              <option value="done">完了</option>
              <option value="in_progress">途中</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--text3)] sm:flex-row sm:items-center sm:justify-between">
          <p>{filtered.length} / {items.length} 件を表示中</p>
          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className={getButtonClass('secondary', 'px-3 py-2 text-xs')}
            >
              絞り込みを解除
            </button>
          )}
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
          <p className="text-lg font-bold text-[var(--text)]">条件に合う取材メモが見つかりません。</p>
          <p className="mt-2 text-sm text-[var(--text3)]">絞り込み条件を変えると、取材メモが表示されます。</p>
        </section>
      ) : (
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
                  className="bg-[var(--accent-l)]"
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
      )}
    </>
  )
}
