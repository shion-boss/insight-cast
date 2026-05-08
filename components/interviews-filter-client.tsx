'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState, useTransition } from 'react'
import { CharacterAvatar, StatusPill, getButtonClass } from '@/components/ui'
import { FilterProgressBar } from '@/components/filter-progress-bar'
import { loadMoreInterviews } from '@/app/(tool)/interviews/actions'
import type { InterviewItem } from '@/app/(tool)/interviews/constants'

type ProjectOption = { id: string; label: string }
type CastOption = { type: string; name: string }

type Props = {
  initialItems: InterviewItem[]
  initialHasMore: boolean
  totalCount: number
  projectOptions: ProjectOption[]
  castOptions: CastOption[]
  alwaysShowProjectFilter?: boolean
}

function selectClassName() {
  return 'w-full min-h-11 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 hover:border-[var(--border2)] focus-visible:border-[var(--accent)]'
}

function FilterContent({
  initialItems,
  initialHasMore,
  totalCount,
  projectOptions,
  castOptions,
  alwaysShowProjectFilter = false,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // select は URL 更新を待たずに即時反映するため local state を持つ。
  // URL（戻る/進む等）の変化には useEffect で追従する。
  const [projectId, setProjectId] = useState(searchParams.get('projectId') ?? 'all')
  const [cast, setCast] = useState(searchParams.get('cast') ?? 'all')
  const [status, setStatus] = useState(searchParams.get('status') ?? 'all')

  useEffect(() => {
    setProjectId(searchParams.get('projectId') ?? 'all')
    setCast(searchParams.get('cast') ?? 'all')
    setStatus(searchParams.get('status') ?? 'all')
  }, [searchParams])

  const showProjectFilter = alwaysShowProjectFilter || projectOptions.length > 1
  const hasFilter = projectId !== 'all' || cast !== 'all' || status !== 'all'

  // 真のサーバ paginated 無限スクロール
  const [items, setItems] = useState<InterviewItem[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)

  const visibleItems = items

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef({ items, hasMore, isLoading, projectId, cast, status })
  stateRef.current = { items, hasMore, isLoading, projectId, cast, status }

  useEffect(() => {
    if (!hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting) return
        const { items: cur, hasMore: curHasMore, isLoading: curLoading, projectId, cast, status } = stateRef.current
        if (curLoading || !curHasMore) return
        setIsLoading(true)
        try {
          const { items: more, hasMore: nextHasMore } = await loadMoreInterviews({
            cursor: cur.length,
            projectId,
            cast,
            status,
          })
          setItems((prev) => [...prev, ...more])
          setHasMore(nextHasMore)
        } finally {
          setIsLoading(false)
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore])

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    for (const [key, value] of Object.entries(updates)) {
      if (value === 'all' || value === '') params.delete(key)
      else params.set(key, value)
    }
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  function changeProject(v: string) {
    setProjectId(v)
    pushParams({ projectId: v })
  }
  function changeCast(v: string) {
    setCast(v)
    pushParams({ cast: v })
  }
  function changeStatus(v: string) {
    setStatus(v)
    pushParams({ status: v })
  }

  return (
    <>
      <section className="mb-5 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 ${showProjectFilter ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {showProjectFilter && (
            <div>
              <label htmlFor="filter-project" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text2)] uppercase">
                プロジェクト
              </label>
              <select
                id="filter-project"
                value={projectId}
                onChange={(e) => changeProject(e.target.value)}
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
            <label htmlFor="filter-cast" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text2)] uppercase">
              キャスト
            </label>
            <select
              id="filter-cast"
              value={cast}
              onChange={(e) => changeCast(e.target.value)}
              className={selectClassName()}
            >
              <option value="all">すべて</option>
              {castOptions.map(({ type, name }) => (
                <option key={type} value={type}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text2)] uppercase">
              ステータス
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => changeStatus(e.target.value)}
              className={selectClassName()}
            >
              <option value="all">すべて</option>
              <option value="done">完了</option>
              <option value="in_progress">途中</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--text2)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {totalCount} 件
            {hasMore && <span className="ml-1.5">（{visibleItems.length} 件表示中）</span>}
            {isLoading && <span className="ml-1.5 text-[var(--text3)]">読み込み中...</span>}
          </p>
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setProjectId('all')
                setCast('all')
                setStatus('all')
                startTransition(() => router.push('?'))
              }}
              className={getButtonClass('secondary', 'px-3 py-2 text-xs')}
            >
              絞り込みを解除
            </button>
          )}
        </div>
      </section>

      <FilterProgressBar pending={isPending} />

      {visibleItems.length === 0 ? (
        <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
          <p className="text-lg font-bold text-[var(--text)]">条件に合う取材メモが見つかりません。</p>
          <p className="mt-2 text-sm text-[var(--text2)]">絞り込み条件を変えると、取材メモが表示されます。</p>
        </section>
      ) : (
        <>
          {/* モバイル: カードリスト */}
          <div className="space-y-3 sm:hidden">
            {visibleItems.map((item) => {
              const isViewerInProgress = !item.isDone && item.canContinue === false
              const cardInner = (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-[32px] h-[32px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                      <CharacterAvatar
                        src={item.icon48}
                        alt={`${item.interviewerName}のアイコン`}
                        emoji={item.interviewerEmoji}
                        size={32}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-[var(--text)] text-[14px] leading-[1.3] transition-colors group-hover:text-[var(--accent)]">{item.projectLabel}</p>
                        {item.isShared && <StatusPill tone="info" className="flex-shrink-0">共有</StatusPill>}
                      </div>
                      <p className="text-[11px] text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">{item.interviewerName}<span aria-hidden="true"> · </span>{item.createdAtLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">
                    <span>記事 <span className="font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.articleCount}</span></span>
                    <span>未作成 <span className="font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.uncreatedThemeCount}</span></span>
                  </div>
                </>
              )

              if (isViewerInProgress) {
                return (
                  <div
                    key={item.id}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-4 opacity-60 cursor-default"
                  >
                    {cardInner}
                  </div>
                )
              }

              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="group block bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-4 transition-shadow hover:shadow-[var(--elevation-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
                >
                  {cardInner}
                </a>
              )
            })}
          </div>

          {/* PC: テーブル */}
          <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] sm:block">
            <table className="w-full table-fixed">
              <caption className="sr-only">取材メモ一覧</caption>
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[28%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="bg-[var(--bg2)]">
                <tr>
                  <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">取材日時</th>
                  <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">キャスト</th>
                  <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">プロジェクト</th>
                  <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">ステータス</th>
                  <th scope="col" className="text-right px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">記事</th>
                  <th scope="col" className="text-right px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">未作成テーマ</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--surface)]">
                {visibleItems.map((item, i) => {
                  const isViewerInProgress = !item.isDone && item.canContinue === false
                  const rowCells = (
                    <>
                      <td className="px-5 py-3 text-[12px] text-[var(--text2)] tabular-nums whitespace-nowrap transition-colors group-hover:text-[var(--accent)]">{item.createdAtLabel}</td>
                      <td className="px-5 py-3 transition-colors group-hover:text-[var(--accent)]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                            <CharacterAvatar
                              src={item.icon48}
                              alt={`${item.interviewerName}のアイコン`}
                              emoji={item.interviewerEmoji}
                              size={28}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <span className="truncate text-[13px] text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.interviewerName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 transition-colors group-hover:text-[var(--accent)]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate text-[13px] font-bold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.projectLabel}</span>
                          {item.isShared && <StatusPill tone="info" className="flex-shrink-0">共有</StatusPill>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {item.isDone ? (
                          <span className="bg-[var(--ok-l)] text-[var(--ok)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">完了</span>
                        ) : (
                          <span className="bg-[var(--warn-l)] text-[var(--warn)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">途中</span>
                        )}
                      </td>
                      <td className={`px-5 py-3 text-right text-[13px] tabular-nums transition-colors group-hover:text-[var(--accent)] ${item.articleCount > 0 ? 'font-semibold text-[var(--text)]' : 'text-[var(--text3)]'}`}>{item.articleCount}</td>
                      <td className={`px-5 py-3 text-right text-[13px] tabular-nums transition-colors group-hover:text-[var(--accent)] ${item.uncreatedThemeCount > 0 ? 'font-semibold text-[var(--text)]' : 'text-[var(--text3)]'}`}>{item.uncreatedThemeCount}</td>
                    </>
                  )

                  const borderCls = i < visibleItems.length - 1 || hasMore ? 'border-b border-[var(--border)]' : ''

                  if (isViewerInProgress) {
                    return (
                      <tr key={item.id} className={`opacity-60 ${borderCls}`}>{rowCells}</tr>
                    )
                  }

                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      aria-label={`${item.projectLabel} の取材メモを見る`}
                      className={`group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40 ${borderCls}`}
                      onClick={(e) => {
                        if ((e.target as Element).closest('a[href]')) return
                        router.push(item.href)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(item.href)
                        }
                      }}
                    >
                      {rowCells}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-4" />}
        </>
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
