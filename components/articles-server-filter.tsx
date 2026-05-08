'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useRef, useTransition } from 'react'
import { CharacterAvatar, StatusPill, getButtonClass } from '@/components/ui'
import { FilterProgressBar } from '@/components/filter-progress-bar'
import { loadMoreArticles } from '@/app/(tool)/articles/actions'
import type { ArticleItem } from '@/app/(tool)/articles/constants'

type ProjectOption = { id: string; label: string }
type InterviewOption = { id: string; label: string }
type CastOption = { id: string; label: string }

type Props = {
  initialItems: ArticleItem[]
  initialHasMore: boolean
  totalCount: number
  projectOptions: ProjectOption[]
  interviewOptions: InterviewOption[]
  castOptions?: CastOption[]
  showProjectColumn?: boolean
  showInterviewColumn?: boolean
  showCastColumn?: boolean
  noResultsTitle?: string
  noResultsDescription?: string
}

const ARTICLE_TYPE_OPTIONS = [
  { value: 'client', label: 'ブログ記事' },
  { value: 'interviewer', label: 'レポート記事' },
  { value: 'conversation', label: '会話記事' },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function selectClassName() {
  return cx(
    'min-h-11 w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150',
    'hover:border-[var(--border2)] focus-visible:border-[var(--accent)]',
  )
}

function ArticlesFilterContent({
  initialItems,
  initialHasMore,
  totalCount,
  projectOptions,
  interviewOptions,
  castOptions = [],
  showProjectColumn = false,
  showInterviewColumn = false,
  showCastColumn = false,
  noResultsTitle = '条件に合う記事がありません。',
  noResultsDescription = '絞り込み条件をゆるめると、記事が表示されます。',
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // select は URL 更新を待たずに即時反映するため local state を持つ。
  // URL（戻る/進む等）の変化には useEffect で追従する。
  const [projectId, setProjectId] = useState(searchParams.get('projectId') ?? 'all')
  const [articleType, setArticleType] = useState(searchParams.get('articleType') ?? 'all')
  const [interviewId, setInterviewId] = useState(searchParams.get('interviewId') ?? 'all')
  const [cast, setCast] = useState(searchParams.get('cast') ?? 'all')

  useEffect(() => {
    setProjectId(searchParams.get('projectId') ?? 'all')
    setArticleType(searchParams.get('articleType') ?? 'all')
    setInterviewId(searchParams.get('interviewId') ?? 'all')
    setCast(searchParams.get('cast') ?? 'all')
  }, [searchParams])

  const hasFilter = projectId !== 'all' || articleType !== 'all' || interviewId !== 'all' || cast !== 'all'

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
  function changeArticleType(v: string) {
    setArticleType(v)
    pushParams({ articleType: v })
  }
  function changeInterview(v: string) {
    setInterviewId(v)
    pushParams({ interviewId: v })
  }
  function changeCast(v: string) {
    setCast(v)
    pushParams({ cast: v })
  }

  // 無限スクロール（true server-paginated）
  const [items, setItems] = useState<ArticleItem[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)

  const visibleItems = items

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  // 最新値参照用（Observer callback の closure 問題を回避）
  const stateRef = useRef({ items, hasMore, isLoading, projectId, articleType, interviewId, cast })
  stateRef.current = { items, hasMore, isLoading, projectId, articleType, interviewId, cast }

  useEffect(() => {
    if (!hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting) return
        const { items: cur, hasMore: curHasMore, isLoading: curLoading, projectId, articleType, interviewId, cast } = stateRef.current
        if (curLoading || !curHasMore) return
        setIsLoading(true)
        try {
          const { items: more, hasMore: nextHasMore } = await loadMoreArticles({
            cursor: cur.length,
            projectId,
            articleType,
            interviewId,
            cast,
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

  function resetFilters() {
    setProjectId('all')
    setArticleType('all')
    setInterviewId('all')
    setCast('all')
    startTransition(() => router.push('?'))
  }

  const visibleSelectCount = [
    showProjectColumn && projectOptions.length > 0,
    true, // article type は常に表示
    showCastColumn && castOptions.length > 0,
    showInterviewColumn && interviewOptions.length > 0,
  ].filter(Boolean).length

  const gridClass = visibleSelectCount >= 4
    ? 'grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    : visibleSelectCount === 3
    ? 'grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : visibleSelectCount === 2
    ? 'grid gap-3 grid-cols-1 sm:grid-cols-2'
    : 'grid gap-3 grid-cols-1'

  return (
    <>
      <section className="mb-5 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className={gridClass}>
          {showProjectColumn && projectOptions.length > 0 && (
            <div>
              <label htmlFor="article-filter-project" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text2)] uppercase">
                プロジェクト
              </label>
              <select
                id="article-filter-project"
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
            <label htmlFor="article-filter-type" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text2)] uppercase">
              種別
            </label>
            <select
              id="article-filter-type"
              value={articleType}
              onChange={(e) => changeArticleType(e.target.value)}
              className={selectClassName()}
            >
              <option value="all">すべて</option>
              {ARTICLE_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {showCastColumn && castOptions.length > 0 && (
            <div>
              <label htmlFor="article-filter-cast" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text2)] uppercase">
                インタビュアー
              </label>
              <select
                id="article-filter-cast"
                value={cast}
                onChange={(e) => changeCast(e.target.value)}
                className={selectClassName()}
              >
                <option value="all">すべて</option>
                {castOptions.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {showInterviewColumn && interviewOptions.length > 0 && (
            <div>
              <label htmlFor="article-filter-interview" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text2)] uppercase">
                取材メモ
              </label>
              <select
                id="article-filter-interview"
                value={interviewId}
                onChange={(e) => changeInterview(e.target.value)}
                className={selectClassName()}
              >
                <option value="all">すべて</option>
                {interviewOptions.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--text2)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {totalCount} 件
            {hasMore && <span className="ml-1.5">（{visibleItems.length} 件表示中）</span>}
            {isLoading && <span className="ml-1.5 text-[var(--text3)]">読み込み中...</span>}
          </p>
          {hasFilter && (
            <button type="button" onClick={resetFilters} className={getButtonClass('secondary', 'px-3 py-2 text-xs')}>
              絞り込みを解除
            </button>
          )}
        </div>
      </section>

      <FilterProgressBar pending={isPending} />

      {visibleItems.length === 0 ? (
        <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
          <p className="text-lg font-bold text-[var(--text)]">{noResultsTitle}</p>
          <p className="mt-2 text-sm text-[var(--text2)]">{noResultsDescription}</p>
        </section>
      ) : (
        <>
          {/* モバイル: カードリスト */}
          <div className="space-y-3 sm:hidden">
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                href={item.detailHref}
                className="group block rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <p className="mb-1 line-clamp-2 font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--link)]">{item.title}</p>
                {item.excerpt && (
                  <p className="mb-2 line-clamp-2 text-xs text-[var(--text2)] transition-colors group-hover:text-[var(--link)]">{item.excerpt}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-[var(--text2)] transition-colors group-hover:text-[var(--link)]">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium transition-colors group-hover:text-[var(--link)]">
                    {item.articleTypeLabel}
                  </span>
                  {showProjectColumn && item.projectLabel && (
                    <span className="flex items-center gap-1.5">
                      <span className="transition-colors group-hover:text-[var(--link)]">{item.projectLabel}</span>
                      {item.isShared && <StatusPill tone="info" className="flex-shrink-0">共有</StatusPill>}
                    </span>
                  )}
                  {showInterviewColumn && item.interviewerLabel && <span className="transition-colors group-hover:text-[var(--link)]">{item.interviewerLabel}</span>}
                  <span className="transition-colors group-hover:text-[var(--link)]">{item.createdAtLabel}</span>
                </div>
              </Link>
            ))}
            {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-4" />}
          </div>

          {/* PC: テーブル */}
          <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] sm:block">
            <table className="w-full text-sm">
              <caption className="sr-only">記事一覧</caption>
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg2)]">
                  <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text2)] uppercase">タイトル</th>
                  {showInterviewColumn && (
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text2)] uppercase whitespace-nowrap">インタビュアー</th>
                  )}
                  {showProjectColumn && (
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text2)] uppercase whitespace-nowrap">プロジェクト</th>
                  )}
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text2)] uppercase whitespace-nowrap">種別</th>
                  <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text2)] uppercase whitespace-nowrap">作成日</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={cx(
                      'group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40',
                      index < visibleItems.length - 1 && 'border-b border-[var(--border)]',
                    )}
                    tabIndex={0}
                    aria-label={item.title}
                    onClick={(e) => {
                      if ((e.target as Element).closest('a[href]')) return
                      const a = e.currentTarget.querySelector('a[href]') as HTMLAnchorElement | null
                      if (a) a.click()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        const a = e.currentTarget.querySelector('a[href]') as HTMLAnchorElement | null
                        if (a) a.click()
                      }
                    }}
                  >
                    <td className="max-w-xs px-5 py-4 transition-colors group-hover:text-[var(--link)]">
                      <Link href={item.detailHref} className="mb-1 block overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--link)]">{item.title}</Link>
                      {item.excerpt && (
                        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--text2)] transition-colors group-hover:text-[var(--link)]">{item.excerpt}</p>
                      )}
                    </td>
                    {showInterviewColumn && (
                      <td className="px-4 py-4 text-xs text-[var(--text2)] whitespace-nowrap transition-colors group-hover:text-[var(--link)]">
                        {item.interviewerLabel && item.interviewerLabel !== '—' ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-[24px] h-[24px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                              <CharacterAvatar
                                src={item.interviewerIcon48}
                                alt={`${item.interviewerLabel}のアイコン`}
                                emoji={item.interviewerEmoji}
                                size={24}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                            <span className="truncate transition-colors group-hover:text-[var(--link)]">{item.interviewerLabel}</span>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    )}
                    {showProjectColumn && (
                      <td className="px-4 py-4 text-xs text-[var(--text2)] whitespace-nowrap transition-colors group-hover:text-[var(--link)]">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate transition-colors group-hover:text-[var(--link)]">{item.projectLabel ?? '—'}</span>
                          {item.isShared && <StatusPill tone="info" className="flex-shrink-0">共有</StatusPill>}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text2)] transition-colors group-hover:text-[var(--link)]">
                        {item.articleTypeLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-[var(--text2)] tabular-nums transition-colors group-hover:text-[var(--link)]">{item.createdAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-4" />}
          </div>
        </>
      )}
    </>
  )
}

export function ArticlesServerFilter(props: Props) {
  return (
    <Suspense>
      <ArticlesFilterContent {...props} />
    </Suspense>
  )
}
