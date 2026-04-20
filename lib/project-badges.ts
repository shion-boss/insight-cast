import { resolveProjectAnalysisStatus } from '@/lib/analysis/project-readiness'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'info'

export function getProjectAnalysisBadge(status: string, analysisReady: boolean): {
  label: string
  tone: BadgeTone
} {
  const resolvedStatus = resolveProjectAnalysisStatus(status, analysisReady)

  if (resolvedStatus === 'analyzing') {
    return { label: '分析中', tone: 'warning' }
  }

  if (resolvedStatus === 'report_ready') {
    return { label: '調査済み', tone: 'info' }
  }

  return { label: '未調査', tone: 'neutral' }
}

export function getProjectContentBadge(input: {
  status: string
  interviewCount: number
  articleCount: number
}): { label: string; tone: BadgeTone } | null {
  if (input.articleCount > 0 || input.status === 'article_ready') {
    return {
      label: input.articleCount > 0 ? `記事 ${input.articleCount}本` : '記事あり',
      tone: 'success',
    }
  }

  if (input.interviewCount > 0 || input.status === 'interview_done') {
    return { label: '取材メモあり', tone: 'neutral' }
  }

  return null
}
