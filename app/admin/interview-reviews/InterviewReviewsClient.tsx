'use client'

import { useMemo, useState } from 'react'

export type ReviewRow = {
  id: string
  overall_score: number
  character_score: number | null
  question_quality_score: number | null
  enjoyment_score: number | null
  good_points: string | null
  improve_points: string | null
  reviewer_role: string
  created_at: string
  interviewer_type: string
  project_name: string | null
  themes: string[] | null
  interview_id: string | null
}

const ROLE_LABELS: Record<string, string> = {
  ai_self: 'AI 自己採点',
  respondent: '回答者',
  owner: 'オーナー',
  staff: '社内',
}

const ROLE_COLORS: Record<string, string> = {
  ai_self: 'bg-[var(--bg2)] text-[var(--text2)]',
  respondent: 'bg-[var(--accent-l)] text-[var(--on-primary-container)]',
  owner: 'bg-[var(--ok-l)] text-[var(--ok)]',
  staff: 'bg-[var(--bg2)] text-[var(--text2)]',
}

const ROLE_OPTIONS = [
  { value: '', label: 'すべての種別' },
  { value: 'ai_self', label: 'AI 自己採点' },
  { value: 'respondent', label: '回答者' },
  { value: 'owner', label: 'オーナー' },
  { value: 'staff', label: '社内' },
]

const SCORE_OPTIONS = [
  { value: '', label: 'スコア指定なし' },
  { value: '1', label: '1 以下' },
  { value: '2', label: '2 以下' },
  { value: '3', label: '3 以下' },
]

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[var(--text3)]">—</span>
  let color = 'text-[var(--text)]'
  if (value <= 2) color = 'text-[var(--err)]'
  else if (value === 3) color = 'text-[var(--text2)]'
  else color = 'text-[var(--ok)]'
  return <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
}

const selectClass =
  'min-h-10 rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] transition-colors duration-150 hover:border-[var(--border2)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40'

export function InterviewReviewsClient({
  rows,
  characterOptions,
}: {
  rows: ReviewRow[]
  characterOptions: { id: string; name: string }[]
}) {
  const [role, setRole] = useState('')
  const [character, setCharacter] = useState('')
  const [maxOverall, setMaxOverall] = useState('')

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (role && r.reviewer_role !== role) return false
      if (character && r.interviewer_type !== character) return false
      if (maxOverall) {
        const max = Number(maxOverall)
        if (r.overall_score > max) return false
      }
      return true
    })
  }, [rows, role, character, maxOverall])

  const characterNameMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of characterOptions) m[c.id] = c.name
    return m
  }, [characterOptions])

  return (
    <section aria-labelledby="reviews-list-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="reviews-list-title" className="text-sm font-semibold text-[var(--text)]">レビュー一覧</h2>
        <span className="text-xs text-[var(--text2)]">{filtered.length} / {rows.length} 件</span>
      </div>

      {/* フィルタ */}
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="filter-role">レビュー種別</label>
        <select id="filter-role" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-character">キャラ</label>
        <select id="filter-character" value={character} onChange={(e) => setCharacter(e.target.value)} className={selectClass}>
          <option value="">すべてのキャラ</option>
          {characterOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-max-overall">overall スコア上限</label>
        <select id="filter-max-overall" value={maxOverall} onChange={(e) => setMaxOverall(e.target.value)} className={selectClass}>
          {SCORE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border2)] bg-[var(--surface)] p-12 text-center">
          <p className="text-sm text-[var(--text2)]">
            {rows.length === 0 ? 'まだレビューがありません。' : '条件に合うレビューがありません。'}
          </p>
        </div>
      ) : (
        <>
          {/* モバイル: カードリスト */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((r) => (
              <ReviewCard key={r.id} row={r} characterName={characterNameMap[r.interviewer_type] ?? r.interviewer_type} />
            ))}
          </div>

          {/* PC: テーブル */}
          <div className="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] lg:block">
            <table className="w-full text-sm">
              <caption className="sr-only">取材レビュー一覧</caption>
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg2)]">
                  <Th>日付</Th>
                  <Th>キャラ</Th>
                  <Th>プロジェクト</Th>
                  <Th>種別</Th>
                  <Th align="center">overall</Th>
                  <Th align="center">キャラ</Th>
                  <Th align="center">問い</Th>
                  <Th align="center">楽しさ</Th>
                  <Th>コメント</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const last = i === filtered.length - 1
                  return (
                    <tr key={r.id} className={`align-top transition-colors hover:bg-[var(--bg2)] ${last ? '' : 'border-b border-[var(--border)]'}`}>
                      <Td className="whitespace-nowrap text-xs text-[var(--text2)]">{formatDate(r.created_at)}</Td>
                      <Td className="whitespace-nowrap text-xs text-[var(--text)]">{characterNameMap[r.interviewer_type] ?? r.interviewer_type}</Td>
                      <Td className="max-w-[160px] truncate text-xs text-[var(--text2)]">{r.project_name ?? '—'}</Td>
                      <Td>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_COLORS[r.reviewer_role] ?? 'bg-[var(--bg2)] text-[var(--text2)]'}`}>
                          {ROLE_LABELS[r.reviewer_role] ?? r.reviewer_role}
                        </span>
                      </Td>
                      <Td align="center"><ScoreCell value={r.overall_score} /></Td>
                      <Td align="center"><ScoreCell value={r.character_score} /></Td>
                      <Td align="center"><ScoreCell value={r.question_quality_score} /></Td>
                      <Td align="center"><ScoreCell value={r.enjoyment_score} /></Td>
                      <Td>
                        <CommentCell good={r.good_points} improve={r.improve_points} />
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
  return (
    <th scope="col" className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text2)] ${alignClass} whitespace-nowrap`}>
      {children}
    </th>
  )
}

function Td({ children, className = '', align = 'left' }: { children: React.ReactNode; className?: string; align?: 'left' | 'center' | 'right' }) {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
  return <td className={`px-3 py-3 ${alignClass} ${className}`}>{children}</td>
}

function CommentCell({ good, improve }: { good: string | null; improve: string | null }) {
  if (!good && !improve) return <span className="text-xs text-[var(--text3)]">—</span>
  return (
    <div className="max-w-[420px] space-y-1.5 text-xs">
      {improve && (
        <div>
          <span className="mr-1 inline-block rounded bg-[var(--err-l)] px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--err)]">改善</span>
          <span className="text-[var(--text)]">{improve}</span>
        </div>
      )}
      {good && (
        <div>
          <span className="mr-1 inline-block rounded bg-[var(--ok-l)] px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--ok)]">良かった</span>
          <span className="text-[var(--text2)]">{good}</span>
        </div>
      )}
    </div>
  )
}

function ReviewCard({ row, characterName }: { row: ReviewRow; characterName: string }) {
  return (
    <article className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_COLORS[row.reviewer_role] ?? 'bg-[var(--bg2)] text-[var(--text2)]'}`}>
          {ROLE_LABELS[row.reviewer_role] ?? row.reviewer_role}
        </span>
        <span className="text-[11px] text-[var(--text2)]">{formatDate(row.created_at)}</span>
      </div>
      <p className="mb-2 text-sm font-semibold text-[var(--text)]">
        {characterName}
        {row.project_name && <span className="ml-2 text-xs font-normal text-[var(--text2)]">/ {row.project_name}</span>}
      </p>
      <div className="mb-3 grid grid-cols-4 gap-2 text-center">
        <ScoreBlock label="overall" value={row.overall_score} />
        <ScoreBlock label="キャラ" value={row.character_score} />
        <ScoreBlock label="問い" value={row.question_quality_score} />
        <ScoreBlock label="楽しさ" value={row.enjoyment_score} />
      </div>
      {(row.improve_points || row.good_points) && (
        <div className="space-y-1.5 border-t border-[var(--border)] pt-3 text-xs">
          {row.improve_points && (
            <div>
              <span className="mr-1 inline-block rounded bg-[var(--err-l)] px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--err)]">改善</span>
              <span className="text-[var(--text)]">{row.improve_points}</span>
            </div>
          )}
          {row.good_points && (
            <div>
              <span className="mr-1 inline-block rounded bg-[var(--ok-l)] px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--ok)]">良かった</span>
              <span className="text-[var(--text2)]">{row.good_points}</span>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function ScoreBlock({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded bg-[var(--bg2)] px-2 py-1.5">
      <p className="text-xs uppercase tracking-wider text-[var(--text2)]">{label}</p>
      <p className="text-base"><ScoreCell value={value} /></p>
    </div>
  )
}
