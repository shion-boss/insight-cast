'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useRef } from 'react'
import { TextInput, getButtonClass } from '@/components/ui'

type ArticleItem = {
  id: string
  title: string
  excerpt?: string
  articleTypeLabel: string
  createdAtLabel: string
  detailHref: string
  projectLabel?: string
  interviewerLabel?: string
}

type ProjectOption = { id: string; label: string }
type InterviewerOption = { id: string; label: string }

type Props = {
  items: ArticleItem[]
  totalCount: number
  currentPage: number
  totalPages: number
  projectOptions: ProjectOption[]
  interviewerOptions: InterviewerOption[]
  showProjectColumn?: boolean
  showInterviewerColumn?: boolean
  searchPlaceholder?: string
  noResultsTitle?: string
  noResultsDescription?: string
}

const ARTICLE_TYPE_OPTIONS = [
  { value: 'client', label: 'ブログ記事' },
  { value: 'interviewer', label: 'インタビュー形式' },
  { value: 'conversation', label: '会話込み' },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function selectClassName() {
  return cx(
    'min-h-11 w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150',
    'hover:border-[var(--border2)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40',
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={getButtonClass('secondary', 'px-4 py-2 text-sm disabled:opacity-40')}>
        ← 前へ
      </button>
      <span className="text-sm text-[var(--text3)]">{page} / {totalPages} ページ</span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className={getButtonClass('secondary', 'px-4 py-2 text-sm disabled:opacity-40')}>
        次へ →
      </button>
    </div>
  )
}

function ArticlesFilterContent({
  items,
  totalCount,
  currentPage,
  totalPages,
  projectOptions,
  interviewerOptions,
  showProjectColumn = false,
  showInterviewerColumn = false,
  searchPlaceholder = 'タイトルで検索',
  noResultsTitle = '条件に合う記事がありません。',
  noResultsDescription = '絞り込み条件をゆるめると、記事が表示されます。',
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlQ = searchParams.get('q') ?? ''
  const projectId = searchParams.get('projectId') ?? 'all'
  const articleType = searchParams.get('articleType') ?? 'all'
  const interviewId = searchParams.get('interviewId') ?? 'all'

  // キーワード入力: ローカル state で即座に UI 反映 → 400ms 後に URL へ反映
  const [localQ, setLocalQ] = useState(urlQ)
  const lastPushedQ = useRef(urlQ)

  useEffect(() => {
    if (localQ === lastPushedQ.current) return
    const timer = setTimeout(() => {
      lastPushedQ.current = localQ
      const params = new URLSearchParams(searchParams.toString())
      if (localQ) params.set('q', localQ)
      else params.delete('q')
      params.delete('page')
      router.push(`?${params.toString()}`)
    }, 400)
    return () => clearTimeout(timer)
  }, [localQ, searchParams, router])

  const hasFilter = urlQ !== '' || projectId !== 'all' || articleType !== 'all' || interviewId !== 'all'

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

  function resetFilters() {
    lastPushedQ.current = ''
    setLocalQ('')
    router.push('?')
  }

  const gridCols = [
    true,                                                          // keyword: always
    showProjectColumn && projectOptions.length > 0,               // project
    true,                                                          // article type
    showInterviewerColumn && interviewerOptions.length > 0,       // interviewer
  ].filter(Boolean).length

  const gridClass = gridCols >= 4
    ? 'grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]'
    : gridCols === 3
    ? 'grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid gap-3 grid-cols-1 sm:grid-cols-2'

  return (
    <>
      <section className="mb-5 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className={gridClass}>
          <div className={gridCols >= 4 ? 'sm:col-span-2 lg:col-span-1' : ''}>
            <label htmlFor="article-filter-query" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
              キーワード
            </label>
            <TextInput
              id="article-filter-query"
              type="search"
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>

          {showProjectColumn && projectOptions.length > 0 && (
            <div>
              <label htmlFor="article-filter-project" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
                取材先
              </label>
              <select
                id="article-filter-project"
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
            <label htmlFor="article-filter-type" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
              種別
            </label>
            <select
              id="article-filter-type"
              value={articleType}
              onChange={(e) => pushParams({ articleType: e.target.value })}
              className={selectClassName()}
            >
              <option value="all">すべて</option>
              {ARTICLE_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {showInterviewerColumn && interviewerOptions.length > 0 && (
            <div>
              <label htmlFor="article-filter-interviewer" className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
                インタビュアー
              </label>
              <select
                id="article-filter-interviewer"
                value={interviewId}
                onChange={(e) => pushParams({ interviewId: e.target.value })}
                className={selectClassName()}
              >
                <option value="all">すべて</option>
                {interviewerOptions.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--text3)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {totalCount} 件
            {totalPages > 1 && <span className="ml-1.5">（{currentPage} / {totalPages} ページ）</span>}
          </p>
          {hasFilter && (
            <button type="button" onClick={resetFilters} className={getButtonClass('secondary', 'px-3 py-2 text-xs')}>
              絞り込みを解除
            </button>
          )}
        </div>
      </section>

      {items.length === 0 ? (
        <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
          <p className="text-lg font-bold text-[var(--text)]">{noResultsTitle}</p>
          <p className="mt-2 text-sm text-[var(--text3)]">{noResultsDescription}</p>
        </section>
      ) : (
        <>
          {/* モバイル: カードリスト */}
          <div className="space-y-3 sm:hidden">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.detailHref}
                className="block rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                <p className="mb-1 line-clamp-2 font-semibold text-[var(--text)]">{item.title}</p>
                {item.excerpt && (
                  <p className="mb-2 line-clamp-2 text-xs text-[var(--text3)]">{item.excerpt}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-[var(--text3)]">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium">
                    {item.articleTypeLabel}
                  </span>
                  {showProjectColumn && item.projectLabel && <span>{item.projectLabel}</span>}
                  {showInterviewerColumn && item.interviewerLabel && <span>{item.interviewerLabel}</span>}
                  <span>{item.createdAtLabel}</span>
                </div>
              </Link>
            ))}
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={changePage} />
          </div>

          {/* PC: テーブル */}
          <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg2)]">
                  <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase">タイトル</th>
                  {showProjectColumn && (
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">取材先</th>
                  )}
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">種別</th>
                  {showInterviewerColumn && (
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">インタビュアー</th>
                  )}
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">作成日</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={cx(
                      'cursor-pointer transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40',
                      index < items.length - 1 && 'border-b border-[var(--border)]',
                    )}
                    tabIndex={0}
                    aria-label={item.title}
                    onClick={() => router.push(item.detailHref)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(item.detailHref) } }}
                  >
                    <td className="max-w-xs px-5 py-4">
                      <p className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[var(--text)]">{item.title}</p>
                      {item.excerpt && (
                        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--text3)]">{item.excerpt}</p>
                      )}
                    </td>
                    {showProjectColumn && (
                      <td className="px-4 py-4 text-xs text-[var(--text3)] whitespace-nowrap">{item.projectLabel ?? '—'}</td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text3)]">
                        {item.articleTypeLabel}
                      </span>
                    </td>
                    {showInterviewerColumn && (
                      <td className="px-4 py-4 text-xs text-[var(--text3)] whitespace-nowrap">{item.interviewerLabel ?? '—'}</td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-[var(--text3)]">{item.createdAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 pb-4">
              <Pagination page={currentPage} totalPages={totalPages} onPageChange={changePage} />
            </div>
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
