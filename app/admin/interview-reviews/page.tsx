export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Breadcrumb } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'
import { InterviewReviewsClient, type ReviewRow } from './InterviewReviewsClient'

type Summary = {
  total: number
  avg: {
    overall: number | null
    character: number | null
    question: number | null
    enjoyment: number | null
  }
  byRole: Record<string, number>
  byCharacter: Record<string, number>
}

async function getReviews(): Promise<{ rows: ReviewRow[]; summary: Summary }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('interview_reviews')
    .select(
      `id, overall_score, character_score, question_quality_score, enjoyment_score,
       good_points, improve_points, reviewer_role, created_at,
       interviews:interview_id ( id, interviewer_type, themes, status, created_at,
         projects:project_id ( id, name )
       )`,
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[admin/interview-reviews] failed to load reviews', error)
    return {
      rows: [],
      summary: {
        total: 0,
        avg: { overall: null, character: null, question: null, enjoyment: null },
        byRole: {},
        byCharacter: {},
      },
    }
  }

  type Raw = {
    id: string
    overall_score: number
    character_score: number | null
    question_quality_score: number | null
    enjoyment_score: number | null
    good_points: string | null
    improve_points: string | null
    reviewer_role: string
    created_at: string
    interviews: {
      id: string
      interviewer_type: string
      themes: string[] | null
      status: string
      created_at: string
      projects: { id: string; name: string | null } | null
    } | null
  }

  const raws = (data ?? []) as unknown as Raw[]

  const rows: ReviewRow[] = raws.map((r) => ({
    id: r.id,
    overall_score: r.overall_score,
    character_score: r.character_score,
    question_quality_score: r.question_quality_score,
    enjoyment_score: r.enjoyment_score,
    good_points: r.good_points,
    improve_points: r.improve_points,
    reviewer_role: r.reviewer_role,
    created_at: r.created_at,
    interviewer_type: r.interviews?.interviewer_type ?? '',
    project_name: r.interviews?.projects?.name ?? null,
    themes: r.interviews?.themes ?? null,
    interview_id: r.interviews?.id ?? null,
  }))

  // 集計
  const total = rows.length
  function avg(key: keyof Pick<ReviewRow, 'overall_score' | 'character_score' | 'question_quality_score' | 'enjoyment_score'>): number | null {
    const nums = rows.map((r) => r[key]).filter((v): v is number => typeof v === 'number')
    if (nums.length === 0) return null
    return nums.reduce((a, b) => a + b, 0) / nums.length
  }
  const byRole: Record<string, number> = {}
  const byCharacter: Record<string, number> = {}
  for (const r of rows) {
    byRole[r.reviewer_role] = (byRole[r.reviewer_role] ?? 0) + 1
    if (r.interviewer_type) {
      byCharacter[r.interviewer_type] = (byCharacter[r.interviewer_type] ?? 0) + 1
    }
  }

  return {
    rows,
    summary: {
      total,
      avg: {
        overall: avg('overall_score'),
        character: avg('character_score'),
        question: avg('question_quality_score'),
        enjoyment: avg('enjoyment_score'),
      },
      byRole,
      byCharacter,
    },
  }
}

const ROLE_LABELS: Record<string, string> = {
  ai_self: 'AI 自己採点',
  respondent: '回答者',
  owner: 'オーナー',
  staff: '社内',
}

function formatAvg(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(2)
}

export default async function AdminInterviewReviewsPage() {
  const { rows, summary } = await getReviews()

  const characterOptions = CHARACTERS.map((c) => ({ id: c.id, name: c.name }))
  const maxRoleCount = Math.max(1, ...Object.values(summary.byRole))

  return (
    <>
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: '取材レビュー' }]} />

      <h1 className="mb-1 text-2xl font-bold text-[var(--text)]">取材レビュー</h1>
      <p className="mb-6 text-sm text-[var(--text2)]">
        AI 自己採点と回答者・オーナー・社内レビューを直近 200 件まで一覧します。改善ループの入口として使ってください。
      </p>

      {/* サマリー */}
      <section aria-labelledby="summary-title" className="mb-8">
        <h2 id="summary-title" className="sr-only">サマリー</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="件数" value={summary.total.toString()} />
          <SummaryCard label="平均 overall" value={formatAvg(summary.avg.overall)} />
          <SummaryCard label="平均 キャラらしさ" value={formatAvg(summary.avg.character)} />
          <SummaryCard label="平均 問いの質" value={formatAvg(summary.avg.question)} />
        </div>
      </section>

      {/* 種別ごとの件数 */}
      <section aria-labelledby="role-title" className="mb-8 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 id="role-title" className="mb-4 text-sm font-semibold text-[var(--text)]">レビュー種別ごとの件数</h2>
        {Object.keys(summary.byRole).length === 0 ? (
          <p className="text-sm text-[var(--text2)]">まだレビューがありません。</p>
        ) : (
          <ul className="space-y-2">
            {(['ai_self', 'respondent', 'owner', 'staff'] as const).map((role) => {
              const count = summary.byRole[role] ?? 0
              const ratio = count / maxRoleCount
              return (
                <li key={role} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-[var(--text2)]">{ROLE_LABELS[role]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg2)]">
                    <div
                      className="h-full bg-[var(--accent)] transition-[width] duration-300"
                      style={{ width: `${Math.max(ratio * 100, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-[var(--text)]">{count}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 一覧 */}
      <InterviewReviewsClient rows={rows} characterOptions={characterOptions} />
    </>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text2)]">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-[var(--text)]">{value}</p>
    </div>
  )
}
