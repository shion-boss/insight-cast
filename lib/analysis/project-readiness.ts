import { buildProjectAnalysisSignature } from '@/lib/analysis/cache'

type ProjectStatus =
  | 'analysis_pending'
  | 'analyzing'
  | 'report_ready'
  | 'interview_ready'
  | 'interview_done'
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
} | null | undefined

type CompetitorAnalysisLike = {
  competitor_id: string
  raw_data?: JsonLike
}

function readInputSignature(rawData: JsonLike) {
  return rawData && typeof rawData === 'object'
    ? rawData.input_signature
    : null
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

  const hasFreshAudit = readInputSignature(input.audit?.raw_data) === inputSignature
  const validCompetitorIds = new Set(input.competitors.map((competitor) => competitor.id))
  const matchedCompetitorIds = new Set(
    input.competitorAnalyses
      .filter((row) => validCompetitorIds.has(row.competitor_id))
      .filter((row) => readInputSignature(row.raw_data) === inputSignature)
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

export function resolveProjectAnalysisStatus(
  status: ProjectStatus | string,
  isReady: boolean,
) {
  if (status === 'report_ready' && !isReady) return 'analysis_pending'
  if (status === 'analysis_pending' && isReady) return 'report_ready'
  return status
}
