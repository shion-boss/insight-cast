'use client'

import Link from 'next/link'
import { useState, useRef, useLayoutEffect } from 'react'
import type { StaticImageData } from 'next/image'
import { CharacterAvatar, getButtonClass } from '@/components/ui'
import InterviewStatusPills from '@/components/interview-status-pills'

const PER_PAGE = 5

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--text3)]">
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
}: {
  items: UncreatedThemeItem[]
  projectId: string
}) {
  const [page, setPage] = useState(1)
  const [bodyMinHeight, setBodyMinHeight] = useState(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(items.length / PER_PAGE)
  const visible = items.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const placeholderCount = PER_PAGE - visible.length

  // ページ描画後に実際の高さを計測し、これまでの最大値を minHeight として保持する。
  // テーマ文字が長くて行高が増えても、最初のページの高さに固定できる。
  useLayoutEffect(() => {
    if (!bodyRef.current) return
    const h = bodyRef.current.offsetHeight
    setBodyMinHeight((prev) => Math.max(prev, h))
  }, [visible])

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
      <div ref={bodyRef} style={{ minHeight: bodyMinHeight || undefined }}>
        {visible.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <CharacterAvatar src={item.icon48} alt={item.interviewerName} emoji={item.emoji} size={28} />
            <p className="flex-1 text-sm text-[var(--text)]">{item.theme}</p>
            <Link
              href={`/projects/${projectId}/article?interviewId=${item.interviewId}&theme=${encodeURIComponent(item.theme)}`}
              className={getButtonClass('secondary', 'text-xs px-3 py-1.5 flex-shrink-0')}
            >
              記事を作る
            </Link>
          </div>
        ))}
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <div key={`ph-${i}`} aria-hidden className="flex items-center gap-3 px-5 py-3.5 invisible">
            <div className="h-7 w-7 rounded-full" />
            <div className="flex-1" />
            <div className="h-8 w-16 rounded" />
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

// ── 取材履歴 ────────────────────────────────────────────────────

export type InterviewHistoryItem = {
  id: string
  charName: string
  charEmoji: string
  charIcon48: StaticImageData | undefined
  themes: string[] | null
  hasSummary: boolean
  hasArticle: boolean
  hasUncreatedThemes: boolean
  articleStatus: string | null
  createdAt: string
  articleCount: number
  articleHref: string | null
  articleLabel: string
  managementHref: string
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function PaginatedInterviewHistory({
  items,
}: {
  items: InterviewHistoryItem[]
}) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / PER_PAGE)
  const visible = items.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const placeholderCount = PER_PAGE - visible.length

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] px-5 py-1">
      {visible.map((item, i) => (
        <div
          key={item.id}
          className={`flex flex-col sm:flex-row sm:items-center gap-3 py-4 ${i < visible.length - 1 || totalPages > 1 ? 'border-b border-[var(--border)]' : ''} -mx-5 px-5`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
              <CharacterAvatar
                src={item.charIcon48}
                alt={`${item.charName}のアイコン`}
                emoji={item.charEmoji}
                size={38}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[var(--text)] mb-0.5">
                {item.charName}<span aria-hidden="true"> · </span>{formatDateTime(item.createdAt)}
              </div>
              <div className="text-[12px] text-[var(--text3)] truncate">
                {item.themes && item.themes.length > 0
                  ? item.themes.join('、')
                  : 'テーマ未確定'}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {item.articleCount > 0 && (
              <span className="text-[11px] text-[var(--text3)]">記事 {item.articleCount}本</span>
            )}
            <InterviewStatusPills
              interviewId={item.id}
              hasSummary={item.hasSummary}
              hasArticle={item.hasArticle}
              hasUncreatedThemes={item.hasUncreatedThemes}
              articleStatus={item.articleStatus}
            />
            {item.articleHref && (
              <Link href={item.articleHref} className={getButtonClass('secondary', 'text-xs px-3 min-h-[44px] flex items-center')}>
                {item.articleLabel}
              </Link>
            )}
            <Link href={item.managementHref} className={getButtonClass('secondary', 'text-xs px-3 min-h-[44px] flex items-center')}>
              メモを見る
            </Link>
          </div>
        </div>
      ))}
      {Array.from({ length: placeholderCount }).map((_, i) => (
        <div key={`ph-${i}`} aria-hidden className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-[var(--border)] -mx-5 px-5 invisible">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-[38px] h-[38px] rounded-full" />
            <div className="flex-1">
              <div className="h-5 mb-0.5" />
              <div className="h-4" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-[44px] w-16 rounded" />
            <div className="h-[44px] w-20 rounded" />
          </div>
        </div>
      ))}
      <div className="-mx-5">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}

// ── 記事素材 ────────────────────────────────────────────────────

export type ArticleSectionItem = {
  id: string
  title: string | null
  articleType: string | null
  createdAt: string
  href: string
}

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'ブログ記事',
  interviewer: 'インタビュー形式',
  conversation: '会話込み',
}

export function PaginatedArticles({ items }: { items: ArticleSectionItem[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / PER_PAGE)
  const visible = items.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const placeholderCount = PER_PAGE - visible.length

  return (
    <>
      {/* モバイル: カードリスト */}
      <div className="space-y-3 sm:hidden">
        {visible.map((article) => (
          <div key={article.id} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="mb-2 line-clamp-2 font-semibold text-[var(--text)]">{article.title || '記事'}</p>
            <div className="mb-3 flex flex-wrap gap-2 text-xs text-[var(--text3)]">
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text2)]">
                {ARTICLE_TYPE_LABEL[article.articleType ?? ''] ?? '記事'}
              </span>
              <span>{formatDateTime(article.createdAt)}</span>
            </div>
            <Link href={article.href} className="inline-flex min-h-[44px] items-center rounded-[var(--r-sm)] border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
              詳細
            </Link>
          </div>
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

      {/* PC: テーブル */}
      <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] sm:block">
        <table className="w-full">
          <caption className="sr-only">記事素材一覧</caption>
          <thead className="bg-[var(--bg2)]">
            <tr>
              <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">タイトル</th>
              <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">種類</th>
              <th scope="col" className="text-left px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">作成日</th>
              <th scope="col" className="px-5 py-3"><span className="sr-only">操作</span></th>
            </tr>
          </thead>
          <tbody className="bg-[var(--surface)]">
            {visible.map((article, i) => (
              <tr key={article.id} className={i < visible.length - 1 || totalPages > 1 ? 'border-b border-[var(--border)]' : ''}>
                <td className="px-5 py-3 text-[14px] font-semibold text-[var(--text)] max-w-[320px]">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{article.title || '記事'}</div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[11px] bg-[var(--bg2)] text-[var(--text2)] px-2.5 py-1 rounded-full font-semibold">
                    {ARTICLE_TYPE_LABEL[article.articleType ?? ''] ?? '記事'}
                  </span>
                </td>
                <td className="px-5 py-3 text-[12px] text-[var(--text3)]">{formatDateTime(article.createdAt)}</td>
                <td className="px-5 py-3">
                  <Link href={article.href} className={getButtonClass('secondary', 'text-xs px-3 py-1.5')}>
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
            {Array.from({ length: placeholderCount }).map((_, i) => (
              <tr key={`ph-${i}`} aria-hidden className="invisible">
                <td className="px-5 py-3"><div className="h-5 max-w-[320px]" /></td>
                <td className="px-5 py-3"><div className="h-5 w-16" /></td>
                <td className="px-5 py-3"><div className="h-5 w-24" /></td>
                <td className="px-5 py-3"><div className="h-8 w-10" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  )
}
