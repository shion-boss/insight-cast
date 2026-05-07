'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useLayoutEffect } from 'react'
import type { StaticImageData } from 'next/image'
import { CharacterAvatar, getButtonClass } from '@/components/ui'

const PER_PAGE = 5

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--text2)]">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={getButtonClass('secondary', 'px-3 py-1.5 text-xs')}
      >
        <span aria-hidden="true">←</span> 前へ
      </button>
      <span>{page} / {totalPages}</span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={getButtonClass('secondary', 'px-3 py-1.5 text-xs')}
      >
        次へ <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

// ── 未作成テーマ ────────────────────────────────────────────────

export type UncreatedThemeItem = {
  theme: string
  interviewId: string
  interviewerName: string
  icon48: StaticImageData | undefined
  emoji: string | undefined
}

export function PaginatedUncreatedThemes({
  items,
  projectId,
  canEdit = true,
}: {
  items: UncreatedThemeItem[]
  projectId: string
  canEdit?: boolean
}) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(items.length / PER_PAGE)
  const visible = items.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const placeholderCount = PER_PAGE - visible.length

  const ROW_CLASS = 'flex items-center gap-3 px-5 py-3.5 min-h-[72px]'

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
      <div className="divide-y divide-[var(--border)]">
        {visible.map((item, i) => {
          if (!canEdit) {
            return (
              <div key={i} className={ROW_CLASS}>
                <CharacterAvatar src={item.icon48} alt={item.interviewerName} emoji={item.emoji} size={28} />
                <p className="flex-1 truncate text-sm text-[var(--text)]" title={item.theme}>{item.theme}</p>
              </div>
            )
          }
          return (
            <Link
              key={i}
              href={`/projects/${projectId}/article?interviewId=${item.interviewId}&theme=${encodeURIComponent(item.theme)}`}
              className={`group ${ROW_CLASS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40`}
            >
              <CharacterAvatar src={item.icon48} alt={item.interviewerName} emoji={item.emoji} size={28} />
              <p className="flex-1 truncate text-sm text-[var(--text)] transition-colors group-hover:text-[var(--accent)]" title={item.theme}>{item.theme}</p>
              <span aria-hidden="true" className="text-[12px] font-semibold text-[var(--text2)] transition-colors group-hover:text-[var(--accent)] flex-shrink-0">記事を作る →</span>
            </Link>
          )
        })}
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <div key={`ph-${i}`} aria-hidden className={`${ROW_CLASS} invisible`}>
            <div className="h-7 w-7 rounded-full" />
            <div className="flex-1" />
            <div className="h-5 w-24 rounded" />
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

// ── 取材メモ ────────────────────────────────────────────────────

export type InterviewHistoryItem = {
  id: string
  charName: string
  charEmoji: string
  charIcon48: StaticImageData | undefined
  createdAt: string
  isDone: boolean
  articleCount: number
  uncreatedThemeCount: number
  managementHref: string
}

function formatDateTime(value: string) {
  const d = new Date(value)
  const datePart = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d).replace(/\//g, '.')
  const timePart = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${datePart} ${timePart}`
}

export function PaginatedInterviewHistory({
  items,
}: {
  items: InterviewHistoryItem[]
}) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / PER_PAGE)
  const visible = items.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const placeholderCount = PER_PAGE - visible.length

  // PC テーブルの最小高さを保持（最後のページで縮まないように）
  const tableRef = useRef<HTMLDivElement | null>(null)
  const [tableMinHeight, setTableMinHeight] = useState(0)
  useLayoutEffect(() => {
    if (!tableRef.current) return
    const h = tableRef.current.offsetHeight
    setTableMinHeight((prev) => Math.max(prev, h))
  }, [visible])

  return (
    <>
      {/* モバイル: カードリスト */}
      <div className="space-y-3 sm:hidden">
        {visible.map((item) => (
          <div
            key={item.id}
            role="link"
            tabIndex={0}
            aria-label={`${item.charName} の取材メモを見る`}
            className="group cursor-pointer rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-shadow hover:shadow-[var(--elevation-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
            onClick={(e) => {
              if ((e.target as Element).closest('a[href]')) return
              router.push(item.managementHref)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push(item.managementHref)
              }
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-[32px] h-[32px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                <CharacterAvatar
                  src={item.charIcon48}
                  alt={`${item.charName}のアイコン`}
                  emoji={item.charEmoji}
                  size={32}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[13px] font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)] truncate">
                    {item.charName}
                  </div>
                  {item.isDone ? (
                    <span className="bg-[var(--ok-l)] text-[var(--ok)] text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">完了</span>
                  ) : (
                    <span className="bg-[var(--warn-l)] text-[var(--warn)] text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">途中</span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">{formatDateTime(item.createdAt)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">
              <span>記事 <span className="font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.articleCount}</span></span>
              <span>未作成テーマ <span className="font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.uncreatedThemeCount}</span></span>
            </div>
          </div>
        ))}
        {totalPages > 1 && (
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* PC: テーブル（/interviews と同じ構成。プロジェクト列だけ省略） */}
      <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] sm:block">
        <div ref={tableRef} style={{ minHeight: tableMinHeight || undefined }}>
          <table className="w-full table-fixed">
            <caption className="sr-only">取材メモ一覧</caption>
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[26%]" />
              <col className="w-[16%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead className="bg-[var(--bg2)]">
              <tr>
                <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">取材日時</th>
                <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">キャスト</th>
                <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">ステータス</th>
                <th scope="col" className="text-right px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">記事</th>
                <th scope="col" className="text-right px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">未作成テーマ</th>
              </tr>
            </thead>
            <tbody className="bg-[var(--surface)]">
              {visible.map((item, i) => (
                <tr
                  key={item.id}
                  tabIndex={0}
                  aria-label={`${item.charName} の取材メモを見る`}
                  className={`group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40 ${i < visible.length - 1 || totalPages > 1 ? 'border-b border-[var(--border)]' : ''}`}
                  onClick={(e) => {
                    if ((e.target as Element).closest('a[href]')) return
                    router.push(item.managementHref)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(item.managementHref)
                    }
                  }}
                >
                  <td className="px-5 py-3 text-[12px] text-[var(--text2)] tabular-nums whitespace-nowrap transition-colors group-hover:text-[var(--accent)]">{formatDateTime(item.createdAt)}</td>
                  <td className="px-5 py-3 transition-colors group-hover:text-[var(--accent)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                        <CharacterAvatar
                          src={item.charIcon48}
                          alt={`${item.charName}のアイコン`}
                          emoji={item.charEmoji}
                          size={28}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <span className="truncate text-[13px] text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.charName}</span>
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
                  <td className={`px-5 py-3 text-right text-[13px] tabular-nums transition-colors group-hover:text-[var(--accent)] ${item.uncreatedThemeCount > 0 ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text3)]'}`}>{item.uncreatedThemeCount}</td>
                </tr>
              ))}
              {Array.from({ length: placeholderCount }).map((_, i) => (
                <tr key={`ph-${i}`} aria-hidden className="invisible">
                  <td className="px-5 py-3"><div className="h-5" /></td>
                  <td className="px-5 py-3"><div className="h-[28px]" /></td>
                  <td className="px-5 py-3"><div className="h-5" /></td>
                  <td className="px-5 py-3"><div className="h-5" /></td>
                  <td className="px-5 py-3"><div className="h-5" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  )
}

// ── 記事 ────────────────────────────────────────────────────

export type ArticleSectionItem = {
  id: string
  title: string | null
  articleType: string | null
  createdAt: string
  href: string
  interviewerName: string | null
  interviewerIcon48: StaticImageData | undefined
  interviewerEmoji: string | undefined
}

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'ブログ記事',
  interviewer: 'レポート記事',
  conversation: '会話記事',
}

export function PaginatedArticles({ items }: { items: ArticleSectionItem[] }) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / PER_PAGE)
  const visible = items.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const placeholderCount = PER_PAGE - visible.length
  const [tableMinHeight, setTableMinHeight] = useState(0)
  const tableRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!tableRef.current) return
    const h = tableRef.current.offsetHeight
    setTableMinHeight((prev) => Math.max(prev, h))
  }, [visible])

  return (
    <>
      {/* モバイル: カードリスト */}
      <div className="space-y-3 sm:hidden">
        {visible.map((article) => (
          <Link
            key={article.id}
            href={article.href}
            className="group block rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-shadow hover:shadow-[var(--elevation-2)]"
          >
            <p className="mb-2 line-clamp-2 font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{article.title || '記事'}</p>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">
                {ARTICLE_TYPE_LABEL[article.articleType ?? ''] ?? '記事'}
              </span>
              {article.interviewerName && (
                <span className="transition-colors group-hover:text-[var(--accent)]">{article.interviewerName}</span>
              )}
              <span className="transition-colors group-hover:text-[var(--accent)]">{formatDateTime(article.createdAt)}</span>
            </div>
          </Link>
        ))}
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <div key={`ph-${i}`} aria-hidden className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 invisible">
            <div className="h-6 mb-2" />
            <div className="h-4 mb-3" />
            <div className="h-[44px] w-14 rounded" />
          </div>
        ))}
        {totalPages > 1 && (
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* PC: テーブル（/articles と同じ構成。プロジェクト列だけ省略） */}
      <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] sm:block">
        <div ref={tableRef} style={{ minHeight: tableMinHeight || undefined }}>
          <table className="w-full table-fixed">
            <caption className="sr-only">記事一覧</caption>
            <colgroup>
              <col className="w-[48%]" />
              <col className="w-[22%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead className="bg-[var(--bg2)]">
              <tr>
                <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">タイトル</th>
                <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">インタビュアー</th>
                <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">種別</th>
                <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">作成日</th>
              </tr>
            </thead>
            <tbody className="bg-[var(--surface)]">
              {visible.map((article, i) => (
                <tr
                  key={article.id}
                  tabIndex={0}
                  className={`group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40 ${i < visible.length - 1 || totalPages > 1 ? 'border-b border-[var(--border)]' : ''}`}
                  onClick={(e) => {
                    if ((e.target as Element).closest('a[href]')) return
                    router.push(article.href)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(article.href)
                    }
                  }}
                >
                  <td className="px-5 py-3 text-[14px] font-semibold text-[var(--text)] truncate transition-colors group-hover:text-[var(--accent)]">
                    {article.title || '記事'}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">
                    {article.interviewerName ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-[24px] h-[24px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                          <CharacterAvatar
                            src={article.interviewerIcon48}
                            alt={`${article.interviewerName}のアイコン`}
                            emoji={article.interviewerEmoji}
                            size={24}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <span className="truncate transition-colors group-hover:text-[var(--accent)]">{article.interviewerName}</span>
                      </div>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[11px] bg-[var(--bg2)] text-[var(--text2)] px-2.5 py-1 rounded-full font-semibold transition-colors group-hover:text-[var(--accent)]">
                      {ARTICLE_TYPE_LABEL[article.articleType ?? ''] ?? '記事'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-[var(--text2)] tabular-nums whitespace-nowrap transition-colors group-hover:text-[var(--accent)]">{formatDateTime(article.createdAt)}</td>
                </tr>
              ))}
              {Array.from({ length: placeholderCount }).map((_, i) => (
                <tr key={`ph-${i}`} aria-hidden className="invisible">
                  <td className="px-5 py-3"><div className="h-5" /></td>
                  <td className="px-5 py-3"><div className="h-[24px]" /></td>
                  <td className="px-5 py-3"><div className="h-5 w-16" /></td>
                  <td className="px-5 py-3"><div className="h-5 w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  )
}
