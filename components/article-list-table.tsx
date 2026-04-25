'use client'

import Link from 'next/link'
import { useDeferredValue, useState } from 'react'

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getUniqueOptions(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort((left, right) => left.localeCompare(right, 'ja'))
}

function selectClassName() {
  return cx(
    'min-h-11 w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150',
    'hover:border-[var(--border2)] focus:border-[var(--accent)] focus:outline-none focus:ring-3 focus:ring-[var(--accent-l)]',
  )
}

export function ArticleListTable({
  items,
  showProjectColumn = false,
  showInterviewerColumn = false,
  searchPlaceholder = 'タイトルで検索',
  noResultsTitle = '条件に合う記事がありません。',
  noResultsDescription = '絞り込み条件をゆるめると、記事が表示されます。',
}: {
  items: ArticleListItem[]
  showProjectColumn?: boolean
  showInterviewerColumn?: boolean
  searchPlaceholder?: string
  noResultsTitle?: string
  noResultsDescription?: string
}) {
  const [query, setQuery] = useState('')
  const [articleType, setArticleType] = useState('all')
  const [interviewerLabel, setInterviewerLabel] = useState('all')
  const [projectLabel, setProjectLabel] = useState('all')

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

  return (
    <>
      <section className="mb-5 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
              キーワード
            </label>
            <TextInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>

          {showProjectColumn && projectOptions.length > 1 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
                取材先
              </label>
              <select
                value={projectLabel}
                onChange={(event) => setProjectLabel(event.target.value)}
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
            <label className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
              種別
            </label>
            <select
              value={articleType}
              onChange={(event) => setArticleType(event.target.value)}
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
              <label className="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase">
                担当
              </label>
              <select
                value={interviewerLabel}
                onChange={(event) => setInterviewerLabel(event.target.value)}
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
            {filteredItems.length} / {items.length} 件を表示中
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setArticleType('all')
                setInterviewerLabel('all')
                setProjectLabel('all')
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
          <p className="font-[family-name:var(--font-noto-serif-jp)] text-lg font-bold text-[var(--text)]">
            {noResultsTitle}
          </p>
          <p className="mt-2 text-sm text-[var(--text3)]">{noResultsDescription}</p>
        </section>
      ) : (
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg2)]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase">タイトル</th>
                  {showProjectColumn && (
                    <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">
                      取材先
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">種別</th>
                  {showInterviewerColumn && (
                    <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">
                      担当
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.10em] text-[var(--text3)] uppercase whitespace-nowrap">作成日</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={cx(
                      'transition-colors hover:bg-[var(--bg2)]',
                      index < filteredItems.length - 1 && 'border-b border-[var(--border)]',
                    )}
                  >
                    <td className="max-w-xs px-5 py-4">
                      <p className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[var(--text)]">
                        {item.title}
                      </p>
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link
                        href={item.detailHref}
                        className="rounded text-xs font-medium text-[var(--text3)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
