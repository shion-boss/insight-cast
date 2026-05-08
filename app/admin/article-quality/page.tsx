export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Breadcrumb } from '@/components/ui'
import type { DeterministicArticleCheck } from '@/lib/article-quality-check'
import type { ArticleSelfReview, ArticleSelfReviewScores } from '@/lib/article-self-review'

type QualityReview = {
  deterministic?: DeterministicArticleCheck | null
  ai_self?: ArticleSelfReview | null
} | null

type ArticleRow = {
  id: string
  title: string | null
  article_type: string | null
  audience: string | null
  source_theme: string | null
  created_at: string
  quality_review: QualityReview
  project: { id: string; name: string | null } | null
}

const ARTICLE_TYPE_LABEL: Record<string, string> = {
  client: 'ブログ',
  interviewer: 'レポート',
  conversation: '会話',
}

const AUDIENCE_LABEL: Record<string, string> = {
  new: '新規読者',
  existing: '既存顧客',
  considering: '検討中',
  peer: '同業者',
}

const AXIS_LABELS: Record<keyof ArticleSelfReviewScores, string> = {
  primary_info: '一次情報',
  perspective: '視点一貫',
  abstract_density: '具体性',
  title_quality: 'タイトル',
  excerpt_quality: '抜粋',
  structure: '構造',
  cta: 'CTA',
  internal_link: '内部リンク',
  first_person: '一人称',
  char_count: '文字数',
}

const AXIS_ORDER: Array<keyof ArticleSelfReviewScores> = [
  'primary_info',
  'perspective',
  'abstract_density',
  'title_quality',
  'excerpt_quality',
  'structure',
  'cta',
  'internal_link',
  'first_person',
  'char_count',
]

async function getArticles(): Promise<ArticleRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('articles')
    .select(
      `id, title, article_type, audience, source_theme, created_at, quality_review,
       project:project_id ( id, name )`,
    )
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) {
    console.error('[admin/article-quality] failed to load articles', error)
    return []
  }
  return (data ?? []) as unknown as ArticleRow[]
}

function judgeRating(percent: number | null): { label: string; tone: string } {
  if (percent === null) return { label: '未採点', tone: 'bg-stone-200 text-stone-600' }
  if (percent >= 0.9) return { label: '高品質', tone: 'bg-emerald-100 text-emerald-800' }
  if (percent >= 0.65) return { label: '改善余地', tone: 'bg-amber-100 text-amber-800' }
  return { label: '要改善', tone: 'bg-rose-100 text-rose-800' }
}

function formatPct(value: number | null): string {
  if (value === null) return '-'
  return `${(value * 100).toFixed(0)}%`
}

function formatScoreBar(score: number, max = 3): string {
  return '●'.repeat(score) + '○'.repeat(max - score)
}

export default async function AdminArticleQualityPage() {
  const rows = await getArticles()

  const withReview = rows.filter((r) => r.quality_review?.ai_self)
  const totalReview = withReview.length
  const avgPercent = totalReview > 0
    ? withReview.reduce((sum, r) => {
        const ai = r.quality_review!.ai_self!
        return sum + (ai.total_max > 0 ? ai.total / ai.total_max : 0)
      }, 0) / totalReview
    : null

  const lowQualityCount = withReview.filter((r) => {
    const ai = r.quality_review!.ai_self!
    return ai.total_max > 0 && ai.total / ai.total_max < 0.65
  }).length

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: '記事品質ログ' }]} />

      <header>
        <h1 className="text-xl font-bold text-[var(--text)]">記事品質ログ</h1>
        <p className="mt-1 text-sm text-[var(--text2)]">
          直近80件の記事と、生成直後に走る決定的チェック・AI自己採点の結果。詳細ルーブリックは{' '}
          <code className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-xs">docs/review-log/article-evaluation.md</code> 参照。
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text2)]">採点済み件数</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text)]">{totalReview} / {rows.length}</p>
        </div>
        <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text2)]">平均品質率</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text)]">{formatPct(avgPercent)}</p>
        </div>
        <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text2)]">要改善（65%未満）</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text)]">{lowQualityCount}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-xs uppercase tracking-[0.05em] text-[var(--text2)]">
            <tr>
              <th className="px-3 py-3 text-left">作成日</th>
              <th className="px-3 py-3 text-left">プロジェクト / タイトル</th>
              <th className="px-3 py-3 text-left">種類</th>
              <th className="px-3 py-3 text-left">読者像</th>
              <th className="px-3 py-3 text-left">合計</th>
              <th className="px-3 py-3 text-left">弱い軸</th>
              <th className="px-3 py-3 text-left">警告</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[12px]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[var(--text2)]">記事がまだありません</td>
              </tr>
            )}
            {rows.map((r) => {
              const ai = r.quality_review?.ai_self ?? null
              const det = r.quality_review?.deterministic ?? null
              const percent = ai && ai.total_max > 0 ? ai.total / ai.total_max : null
              const rating = judgeRating(percent)
              const articleHref = r.project?.id
                ? `/projects/${r.project.id}/articles/${r.id}`
                : null

              return (
                <tr key={r.id} className="border-b border-[var(--border)]/50">
                  <td className="px-3 py-3 align-top text-[var(--text2)]">
                    {new Date(r.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <p className="font-sans text-xs text-[var(--text2)]">{r.project?.name ?? '（プロジェクト不明）'}</p>
                    {articleHref ? (
                      <Link href={articleHref} className="font-sans text-sm font-medium text-[var(--accent)] hover:underline">
                        {r.title ?? '（無題）'}
                      </Link>
                    ) : (
                      <p className="font-sans text-sm font-medium text-[var(--text)]">{r.title ?? '（無題）'}</p>
                    )}
                    {r.source_theme && (
                      <p className="mt-1 font-sans text-xs text-[var(--text2)]">テーマ: {r.source_theme}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">{ARTICLE_TYPE_LABEL[r.article_type ?? ''] ?? r.article_type ?? '-'}</td>
                  <td className="px-3 py-3 align-top">{AUDIENCE_LABEL[r.audience ?? 'new'] ?? '-'}</td>
                  <td className="px-3 py-3 align-top">
                    {ai ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${rating.tone}`}>
                            {rating.label}
                          </span>
                          <span>{ai.total} / {ai.total_max}</span>
                          <span className="text-[var(--text2)]">({formatPct(percent)})</span>
                        </div>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-[var(--text2)] hover:text-[var(--accent)]">軸別</summary>
                          <ul className="mt-1 space-y-0.5">
                            {AXIS_ORDER.map((axis) => {
                              const score = ai.scores[axis]
                              return (
                                <li key={axis} className="flex items-center justify-between gap-2">
                                  <span className="text-[var(--text2)]">{AXIS_LABELS[axis]}</span>
                                  <span>{score === null ? 'N/A' : `${formatScoreBar(score)} ${score}`}</span>
                                </li>
                              )
                            })}
                          </ul>
                        </details>
                      </div>
                    ) : (
                      <span className="text-[var(--text2)]">未採点</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {ai && ai.weakest_axes.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-[11px]">
                          {ai.weakest_axes.map((a) => AXIS_LABELS[a as keyof ArticleSelfReviewScores] ?? a).join(' / ')}
                        </p>
                        {ai.comment && (
                          <p className="font-sans text-[11px] text-[var(--text2)]">{ai.comment}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[var(--text2)]">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {det && det.warnings.length > 0 ? (
                      <ul className="space-y-0.5 text-[11px] text-rose-700">
                        {det.warnings.map((w, i) => (
                          <li key={i}>⚠ {w}</li>
                        ))}
                      </ul>
                    ) : det ? (
                      <span className="text-emerald-700">OK</span>
                    ) : (
                      <span className="text-[var(--text2)]">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
