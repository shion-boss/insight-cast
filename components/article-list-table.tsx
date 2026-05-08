'use client'

import Link from 'next/link'
import { useDeferredValue, useEffect, useRef, useState } from 'react'

import { TextInput, getButtonClass } from '@/components/ui'

type ArticleListItem = {
  id: string
  title: string
  excerpt?: string
  articleTypeLabel: string
  createdAtLabel: string
  detailHref: string
  projectLabel?: string
  interviewerLabel?: string
}

const PER_PAGE = 20

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getUniqueOptions(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort((left, right) => left.localeCompare(right, 'ja'))
}

function selectClassName() {
  return cx(
    'min-h-11 w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150',
    'hover:border-[var(--border2)] focus-visible:border-[var(--accent)]',
  )
}

export function ArticleListTable({
  items,
  showProjectColumn = false,
  alwaysShowProjectFilter = false,
  initialProjectLabel,
  initialInterviewerLabel,
  showInterviewerColumn = false,
  searchPlaceholder = 'タイトルで検索',
  noResultsTitle = '条件に合う記事がありません。',
  noResultsDescription = '絞り込み条件をゆるめると、記事が表示されます。',
}: {
  items: ArticleListItem[]
  showProjectColumn?: boolean
  alwaysShowProjectFilter?: boolean
  initialProjectLabel?: string
  initialInterviewerLabel?: string
  showInterviewerColumn?: boolean
  searchPlaceholder?: string
  noResultsTitle?: string
  noResultsDescription?: string
}) {
  const [query, setQuery] = useState('')
  const [articleType, setArticleType] = useState('all')
  const [interviewerLabel, setInterviewerLabel] = useState(initialInterviewerLabel ?? 'all')
  const [projectLabel, setProjectLabel] = useState(initialProjectLabel ?? 'all')
  const [displayCount, setDisplayCount] = useState(PER_PAGE)

  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()
  const articleTypeOptions = getUniqueOptions(items.map((item) => item.articleTypeLabel))
  const interviewerOptions = getUniqueOptions(items.map((item) => item.interviewerLabel ?? ''))
  const projectOptions = getUniqueOptions(items.map((item) => item.projectLabel ?? ''))

  const filteredItems = items.filter((item) => {
    if (articleType !== 'all' && item.articleTypeLabel !== articleType) return false
    if (interviewerLabel !== 'all' && item.interviewerLabel !== interviewerLabel) return false
    if (projectLabel !== 'all' && item.projectLabel !== projectLabel) return false

    if (!normalizedQuery) return true

    const haystacks = [
      item.title,
      item.excerpt ?? '',
      item.projectLabel ?? '',
      item.interviewerLabel ?? '',
      item.articleTypeLabel,
    ]

    return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery))
  })

  const hasActiveFilters = query.trim().length > 0 || articleType !== 'all' || interviewerLabel !== 'all' || projectLabel !== 'all'

  const visibleItems = filteredItems.slice(0, displayCount)
  const hasMore = filteredItems.length > displayCount

  // フィルタ変更時に表示件数をリセット
  useEffect(() => {
    setDisplayCount(PER_PAGE)
  }, [normalizedQuery, articleType, interviewerLabel, projectLabel])

  // 無限スクロール: 末尾の sentinel が viewport に入ったら次の chunk を読み込む
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setDisplayCount((prev) => prev + PER_PAGE)
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore])

  return (
    <>
      <section className="mb-5 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="article-filter-query" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
              キーワード
            </label>
            <TextInput
              id="article-filter-query"
              type="search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setDisplayCount(PER_PAGE) }}
              placeholder={searchPlaceholder}
            />
          </div>

          {showProjectColumn && (alwaysShowProjectFilter || projectOptions.length > 1) && (
            <div>
              <label htmlFor="article-filter-project" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
                プロジェクト
              </label>
              <select
                id="article-filter-project"
                value={projectLabel}
                onChange={(event) => { setProjectLabel(event.target.value); setDisplayCount(PER_PAGE) }}
                className={selectClassName()}
              >
                <option value="all">すべて</option>
                {projectOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="article-filter-type" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
              種別
            </label>
            <select
              id="article-filter-type"
              value={articleType}
              onChange={(event) => { setArticleType(event.target.value); setDisplayCount(PER_PAGE) }}
              className={selectClassName()}
            >
              <option value="all">すべて</option>
              {articleTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {showInterviewerColumn && (
            <div>
              <label htmlFor="article-filter-interviewer" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
                インタビュアー
              </label>
              <select
                id="article-filter-interviewer"
                value={interviewerLabel}
                onChange={(event) => { setInterviewerLabel(event.target.value); setDisplayCount(PER_PAGE) }}
                className={selectClassName()}
                disabled={interviewerOptions.length === 0}
              >
                <option value="all">すべて</option>
                {interviewerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--text3)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {filteredItems.length} / {items.length} 件
            {hasMore && <span className="ml-1.5">（{visibleItems.length} 件表示中）</span>}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setArticleType('all')
                setInterviewerLabel('all')
                setProjectLabel('all')
                setDisplayCount(PER_PAGE)
              }}
              className={getButtonClass('secondary', 'px-3 py-2 text-xs')}
            >
              絞り込みを解除
            </button>
          )}
        </div>
      </section>

      {filteredItems.length === 0 ? (
        <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
          <p className="text-lg font-bold text-[var(--text)]">
            {noResultsTitle}
          </p>
          <p className="mt-2 text-sm text-[var(--text3)]">{noResultsDescription}</p>
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
                <p className="mb-1 line-clamp-2 font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.title}</p>
                {item.excerpt && (
                  <p className="mb-2 line-clamp-2 text-xs text-[var(--text3)]">{item.excerpt}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-[var(--text3)]">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium">
                    {item.articleTypeLabel}
                  </span>
                  {showProjectColumn && item.projectLabel && (
                    <span>{item.projectLabel}</span>
                  )}
                  {showInterviewerColumn && item.interviewerLabel && (
                    <span>{item.interviewerLabel}</span>
                  )}
                  <span>{item.createdAtLabel}</span>
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
                  <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase">タイトル</th>
                  {showProjectColumn && (
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">
                      プロジェクト
                    </th>
                  )}
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">種別</th>
                  {showInterviewerColumn && (
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">
                      インタビュアー
                    </th>
                  )}
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">作成日</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, index) => (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    aria-label={item.title}
                    className={cx(
                      'group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40',
                      index < visibleItems.length - 1 && 'border-b border-[var(--border)]',
                    )}
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
                    <td className="max-w-xs px-5 py-4">
                      <Link href={item.detailHref} className="mb-1 block overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--link)]">
                        {item.title}
                      </Link>
                      {item.excerpt && (
                        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--text3)]">
                          {item.excerpt}
                        </p>
                      )}
                    </td>
                    {showProjectColumn && (
                      <td className="px-4 py-4 text-xs text-[var(--text3)] whitespace-nowrap">
                        {item.projectLabel ?? '—'}
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text3)]">
                        {item.articleTypeLabel}
                      </span>
                    </td>
                    {showInterviewerColumn && (
                      <td className="px-4 py-4 text-xs text-[var(--text3)] whitespace-nowrap">
                        {item.interviewerLabel ?? '—'}
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-[var(--text3)]">
                      {item.createdAtLabel}
                    </td>
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
