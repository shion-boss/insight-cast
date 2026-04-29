'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
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

type ProjectOption = { id: string; label: string }
type CastOption = { type: string; name: string }

type Props = {
  items: InterviewItem[]
  totalCount: number
  currentPage: number
  totalPages: number
  projectOptions: ProjectOption[]
  castOptions: CastOption[]
  alwaysShowProjectFilter?: boolean
}

function selectClassName() {
  return 'w-full min-h-11 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 hover:border-[var(--border2)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40'
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="ページネーション" className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="前のページへ" className={getButtonClass('secondary', 'px-4 py-2 text-sm')}>
        <span aria-hidden="true">←</span> 前へ
      </button>
      <span className="text-sm text-[var(--text3)]" aria-live="polite">{page} / {totalPages} ページ</span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="次のページへ" className={getButtonClass('secondary', 'px-4 py-2 text-sm')}>
        次へ <span aria-hidden="true">→</span>
      </button>
    </nav>
  )
}

function FilterContent({
  items,
  totalCount,
  currentPage,
  totalPages,
  projectOptions,
  castOptions,
  alwaysShowProjectFilter = false,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const projectId = searchParams.get('projectId') ?? 'all'
  const cast = searchParams.get('cast') ?? 'all'
  const status = searchParams.get('status') ?? 'all'

  const showProjectFilter = alwaysShowProjectFilter || projectOptions.length > 1
  const hasFilter = projectId !== 'all' || cast !== 'all' || status !== 'all'

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    for (const [key, value] of Object.entries(updates)) {
      if (value === 'all' || value === '') params.delete(key)
      else params.set(key, value)
    }
    router.push(`?${params.toString()}`)
  }

  function changePage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) params.delete('page')
    else params.set('page', String(page))
    router.push(`?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <section className="mb-5 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 ${showProjectFilter ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {showProjectFilter && (
            <div>
              <label htmlFor="filter-project" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
                取材先
              </label>
              <select
                id="filter-project"
                value={projectId}
                onChange={(e) => pushParams({ projectId: e.target.value })}
                className={selectClassName()}
              >
                <option value="all">すべて</option>
                {projectOptions.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="filter-cast" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
              キャスト
            </label>
            <select
              id="filter-cast"
              value={cast}
              onChange={(e) => pushParams({ cast: e.target.value })}
              className={selectClassName()}
            >
              <option value="all">すべて</option>
              {castOptions.map(({ type, name }) => (
                <option key={type} value={type}>{name}</option>
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
              onChange={(e) => pushParams({ status: e.target.value })}
              className={selectClassName()}
            >
              <option value="all">すべて</option>
              <option value="done">完了</option>
              <option value="in_progress">途中</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--text3)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {totalCount} 件
            {totalPages > 1 && <span className="ml-1.5">（{currentPage} / {totalPages} ページ）</span>}
          </p>
          {hasFilter && (
            <button
              type="button"
              onClick={() => router.push('?')}
              className={getButtonClass('secondary', 'px-3 py-2 text-xs')}
            >
              絞り込みを解除
            </button>
          )}
        </div>
      </section>

      {items.length === 0 ? (
        <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
          <p className="text-lg font-bold text-[var(--text)]">条件に合う取材メモが見つかりません。</p>
          <p className="mt-2 text-sm text-[var(--text3)]">絞り込み条件を変えると、取材メモが表示されます。</p>
        </section>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
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
                  <p className="truncate font-bold text-[var(--text)] text-base leading-[1.3]">{item.projectLabel}</p>
                  {item.isDone ? (
                    <span className="bg-[var(--ok-l)] text-[var(--ok)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">完了</span>
                  ) : (
                    <span className="bg-[var(--warn-l)] text-[var(--warn)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">途中</span>
                  )}
                </div>
                <p className="text-xs text-[var(--text2)] mb-3">{item.interviewerName}<span aria-hidden="true"> · </span>{item.createdAtLabel}</p>
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
                <p className="text-xs text-[var(--text3)]">記事 {item.articleCount}本</p>
                {item.isDone ? (
                  <span className="border border-[var(--border)] text-[var(--text2)] text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">メモを見る <span aria-hidden="true">→</span></span>
                ) : (
                  <span className="bg-[var(--accent)] text-white text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">続きを取材する <span aria-hidden="true">→</span></span>
                )}
              </div>
              <div className="col-span-2 flex items-center justify-between gap-2 pt-2 sm:hidden">
                <p className="text-xs text-[var(--text3)]">記事 {item.articleCount}本</p>
                {item.isDone ? (
                  <span className="border border-[var(--border)] text-[var(--text2)] text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">メモを見る <span aria-hidden="true">→</span></span>
                ) : (
                  <span className="bg-[var(--accent)] text-white text-[11px] font-semibold px-3 py-1 rounded-[var(--r-sm)]">続きを取材する <span aria-hidden="true">→</span></span>
                )}
              </div>
            </Link>
          ))}
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={changePage} />
        </div>
      )}
    </>
  )
}

export function InterviewsFilterClient(props: Props) {
  return (
    <Suspense>
      <FilterContent {...props} />
    </Suspense>
  )
}
