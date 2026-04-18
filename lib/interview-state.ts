export type InterviewStateSource = {
  id: string
  project_id: string
  status: string | null
  summary: string | null
  themes: string[] | null
}

export type InterviewArticleRef = {
  interview_id: string | null
}

export function getInterviewThemeCount(themes: string[] | null) {
  if (!Array.isArray(themes)) return 0

  return themes.filter((theme) => typeof theme === 'string' && theme.trim().length > 0).length
}

export function buildArticleCountByInterview(articles: InterviewArticleRef[]) {
  const articleInterviewIds = new Set<string>()
  const articleCountByInterview = new Map<string, number>()

  for (const article of articles) {
    if (!article.interview_id) continue
    articleInterviewIds.add(article.interview_id)
    articleCountByInterview.set(article.interview_id, (articleCountByInterview.get(article.interview_id) ?? 0) + 1)
  }

  return { articleInterviewIds, articleCountByInterview }
}

export function getInterviewFlags(
  interview: InterviewStateSource,
  articleCountByInterview: Map<string, number>,
) {
  const hasSummary = Boolean(interview.summary || interview.status === 'completed')
  const articleCount = articleCountByInterview.get(interview.id) ?? 0
  const hasArticle = articleCount > 0
  const hasUncreatedThemes = getInterviewThemeCount(interview.themes) > articleCount

  return {
    hasSummary,
    hasArticle,
    hasUncreatedThemes,
    articleCount,
  }
}

export function getInterviewManagementHref(
  interview: InterviewStateSource,
  articleCountByInterview: Map<string, number>,
  from: 'dashboard' | 'project' = 'dashboard',
) {
  const { hasSummary, hasArticle, hasUncreatedThemes } = getInterviewFlags(interview, articleCountByInterview)
  const suffix = from === 'dashboard' ? '&from=dashboard' : ''

  if (hasSummary || hasArticle || hasUncreatedThemes) {
    return `/projects/${interview.project_id}/summary?interviewId=${interview.id}${suffix}`
  }

  return `/projects/${interview.project_id}/interview?interviewId=${interview.id}${suffix}`
}
