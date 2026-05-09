'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { StaticImageData } from 'next/image'
import { CharacterAvatar } from '@/components/ui'

function SeeAllFooter({
  href,
  totalCount,
  embedded = false,
}: {
  href: string
  totalCount: number
  embedded?: boolean
}) {
  const base = 'group flex items-center justify-end gap-1.5 bg-[var(--surface)] px-5 py-3 text-[13px] font-medium text-[var(--text2)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40'
  const variant = embedded
    ? 'border-t border-[var(--border)]'
    : 'rounded-[var(--r-lg)] border border-[var(--border)]'
  return (
    <Link href={href} className={`${base} ${variant}`}>
      <span>すべて見る</span>
      <span className="text-[var(--text3)] transition-colors group-hover:text-[var(--accent)]">（全 {totalCount} 件）</span>
      <span aria-hidden="true" className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
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

export function InterviewHistoryList({
  items,
  seeAllHref,
  totalCount,
}: {
  items: InterviewHistoryItem[]
  seeAllHref?: string
  totalCount?: number
}) {
  const router = useRouter()
  const showFooter = !!seeAllHref && typeof totalCount === 'number' && totalCount > items.length

  return (
    <>
      {/* モバイル: カードリスト */}
      <div className="space-y-3 sm:hidden">
        {items.map((item) => (
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
                    <span className="bg-[var(--ok-l)] text-[var(--ok)] text-[13px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">完了</span>
                  ) : (
                    <span className="bg-[var(--warn-l)] text-[var(--warn)] text-[13px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">途中</span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">{formatDateTime(item.createdAt)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">
              <span>記事 <span className="font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.articleCount}</span></span>
              <span>記事候補（未作成） <span className="font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{item.uncreatedThemeCount}</span></span>
            </div>
          </div>
        ))}
        {showFooter && <SeeAllFooter href={seeAllHref!} totalCount={totalCount!} />}
      </div>

      {/* PC: テーブル（/interviews と同じ構成。プロジェクト列だけ省略） */}
      <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] sm:block">
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
              <th scope="col" className="text-right px-5 py-3 text-[12px] font-semibold text-[var(--text2)]">記事候補（未作成）</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--surface)]">
            {items.map((item, i) => (
              <tr
                key={item.id}
                tabIndex={0}
                aria-label={`${item.charName} の取材メモを見る`}
                className={`group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40 ${i < items.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
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
                <td className={`px-5 py-3 text-right text-[13px] tabular-nums transition-colors group-hover:text-[var(--accent)] ${item.uncreatedThemeCount > 0 ? 'font-semibold text-[var(--text)]' : 'text-[var(--text3)]'}`}>{item.uncreatedThemeCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {showFooter && <SeeAllFooter href={seeAllHref!} totalCount={totalCount!} embedded />}
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

export function ArticleList({
  items,
  seeAllHref,
  totalCount,
}: {
  items: ArticleSectionItem[]
  seeAllHref?: string
  totalCount?: number
}) {
  const router = useRouter()
  const showFooter = !!seeAllHref && typeof totalCount === 'number' && totalCount > items.length

  return (
    <>
      {/* モバイル: カードリスト */}
      <div className="space-y-3 sm:hidden">
        {items.map((article) => (
          <Link
            key={article.id}
            href={article.href}
            className="group block rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-shadow hover:shadow-[var(--elevation-2)]"
          >
            <p className="mb-2 line-clamp-2 font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{article.title || '記事'}</p>
            <div className="flex flex-wrap gap-2 text-[13px] text-[var(--text2)] transition-colors group-hover:text-[var(--accent)]">
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
        {showFooter && <SeeAllFooter href={seeAllHref!} totalCount={totalCount!} />}
      </div>

      {/* PC: テーブル（/articles と同じ構成。プロジェクト列だけ省略） */}
      <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] sm:block">
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
            {items.map((article, i) => (
              <tr
                key={article.id}
                tabIndex={0}
                className={`group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40 ${i < items.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
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
          </tbody>
        </table>
        {showFooter && <SeeAllFooter href={seeAllHref!} totalCount={totalCount!} embedded />}
      </div>
    </>
  )
}
