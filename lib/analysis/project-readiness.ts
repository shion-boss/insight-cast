import { buildProjectAnalysisSignature } from '@/lib/analysis/cache'

type ProjectStatus =
  | 'analysis_pending'
  | 'analyzing'
  | 'fetch_failed'
  | 'report_ready'
  | 'interview_ready'
  | 'interview_done'
  | 'article_generating'
  | 'article_ready'

type ProjectLike = {
  hp_url: string
  status: ProjectStatus | string
}

type CompetitorLike = {
  id: string
  url: string
}

type JsonLike = Record<string, unknown> | null | undefined

type AuditLike = {
  raw_data?: JsonLike
  /** 軽量化: raw_data 全体ではなく input_signature だけを jsonb path で抜いた値 */
  input_signature?: string | null
} | null | undefined

type CompetitorAnalysisLike = {
  competitor_id: string
  raw_data?: JsonLike
  /** 軽量化: raw_data 全体ではなく input_signature だけを jsonb path で抜いた値 */
  input_signature?: string | null
}

function readSignature(row: { raw_data?: JsonLike; input_signature?: string | null } | null | undefined): unknown {
  if (!row) return null
  if (typeof row.input_signature === 'string') return row.input_signature
  if (row.raw_data && typeof row.raw_data === 'object') return row.raw_data.input_signature
  return null
}

export function isProjectAnalysisReady(input: {
  project: ProjectLike
  competitors: CompetitorLike[]
  audit: AuditLike
  competitorAnalyses: CompetitorAnalysisLike[]
}) {
  const inputSignature = buildProjectAnalysisSignature({
    hpUrl: input.project.hp_url,
    competitorUrls: input.competitors.map((competitor) => competitor.url),
  })

  const hasFreshAudit = readSignature(input.audit) === inputSignature
  const validCompetitorIds = new Set(input.competitors.map((competitor) => competitor.id))
  const matchedCompetitorIds = new Set(
    input.competitorAnalyses
      .filter((row) => validCompetitorIds.has(row.competitor_id))
      .filter((row) => readSignature(row) === inputSignature)
      .map((row) => row.competitor_id),
  )

  const hasFreshCompetitorAnalyses = matchedCompetitorIds.size === validCompetitorIds.size

  return {
    inputSignature,
    hasFreshAudit,
    hasFreshCompetitorAnalyses,
    isReady: hasFreshAudit && hasFreshCompetitorAnalyses,
  }
}

const LOCKED_STATUSES = ['interview_ready', 'interview_done', 'article_generating', 'article_ready', 'fetch_failed'] as const

export function resolveProjectAnalysisStatus(
  status: ProjectStatus | string,
  isReady: boolean,
) {
  // インタビュー以降のステータスと fetch_failed はダウングレードしない
  if ((LOCKED_STATUSES as readonly string[]).includes(status)) return status
  if (status === 'report_ready' && !isReady) return 'analysis_pending'
  if (status === 'analysis_pending' && isReady) return 'report_ready'
  return status
}
