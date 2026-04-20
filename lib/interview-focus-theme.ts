export const INTERVIEW_FOCUS_THEME_MAX_LENGTH = 120
export const COMPETITOR_THEME_SUMMARY_MAX_LENGTH = 180

export const INTERVIEW_FOCUS_THEME_MODES = ['omakase', 'custom', 'suggested'] as const

export type InterviewFocusThemeMode = (typeof INTERVIEW_FOCUS_THEME_MODES)[number]
export type CompetitorInfluentialTopic = { theme: string; summary: string }
export type CompetitorThemeSource = { url: string | null; summary: string }
export type CompetitorThemeSuggestion = { theme: string; sources: CompetitorThemeSource[] }
export type CompetitorThemeCarrier = {
  raw_data: Record<string, unknown> | null
  competitors?: { url: string } | { url: string }[] | null
}

export const DEFAULT_INTERVIEW_FOCUS_THEME_MODE: InterviewFocusThemeMode = 'omakase'

export function isInterviewFocusThemeMode(value: unknown): value is InterviewFocusThemeMode {
  return typeof value === 'string' && INTERVIEW_FOCUS_THEME_MODES.includes(value as InterviewFocusThemeMode)
}

export function normalizeInterviewFocusTheme(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, INTERVIEW_FOCUS_THEME_MAX_LENGTH)
}

export function normalizeCompetitorThemeSummary(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, COMPETITOR_THEME_SUMMARY_MAX_LENGTH)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getInterviewSuggestedThemes(themes: string[] | null | undefined, limit = 5) {
  const seen = new Set<string>()
  const normalizedThemes: string[] = []

  for (const theme of themes ?? []) {
    const normalizedTheme = normalizeInterviewFocusTheme(theme)
    if (!normalizedTheme || seen.has(normalizedTheme)) continue
    seen.add(normalizedTheme)
    normalizedThemes.push(normalizedTheme)
    if (normalizedThemes.length >= limit) break
  }

  return normalizedThemes
}

export function getCompetitorInfluentialTopics(rawData: Record<string, unknown> | null | undefined) {
  if (!isRecord(rawData) || !Array.isArray(rawData.influential_topics)) return [] as CompetitorInfluentialTopic[]

  const topics: CompetitorInfluentialTopic[] = []
  const seen = new Set<string>()

  for (const item of rawData.influential_topics) {
    if (!isRecord(item)) continue
    const theme = normalizeInterviewFocusTheme(item.theme)
    const summary = normalizeCompetitorThemeSummary(item.summary)
    if (!theme || !summary) continue

    const key = `${theme.toLowerCase()}::${summary}`
    if (seen.has(key)) continue
    seen.add(key)
    topics.push({ theme, summary })
  }

  return topics
}

function getCompetitorUrl(competitor: CompetitorThemeCarrier['competitors']) {
  if (Array.isArray(competitor)) return competitor[0]?.url ?? null
  return competitor?.url ?? null
}

function collectCompetitorThemeSuggestions(rows: CompetitorThemeCarrier[]) {
  const suggestions: CompetitorThemeSuggestion[] = []
  const suggestionMap = new Map<string, CompetitorThemeSuggestion>()

  for (const row of rows) {
    const url = getCompetitorUrl(row.competitors)
    const topics = getCompetitorInfluentialTopics(row.raw_data)

    for (const topic of topics) {
      const key = topic.theme.toLowerCase()
      const existing = suggestionMap.get(key)

      if (!existing) {
        const nextSuggestion: CompetitorThemeSuggestion = {
          theme: topic.theme,
          sources: [{ url, summary: topic.summary }],
        }
        suggestions.push(nextSuggestion)
        suggestionMap.set(key, nextSuggestion)
        continue
      }

      const alreadyIncluded = existing.sources.some((source) => source.url === url && source.summary === topic.summary)
      if (alreadyIncluded) continue
      existing.sources.push({ url, summary: topic.summary })
    }
  }

  return suggestions
}

export function getCompetitorInterviewThemeSuggestions(rows: CompetitorThemeCarrier[], limit = 5) {
  return collectCompetitorThemeSuggestions(rows)
    .map((suggestion) => ({ ...suggestion, sources: suggestion.sources.slice(0, 2) }))
    .slice(0, limit)
}

export function getCompetitorThemeSourcesForTheme(
  rows: CompetitorThemeCarrier[],
  theme: unknown,
  maxSources = 2,
) {
  const normalizedTheme = normalizeInterviewFocusTheme(theme).toLowerCase()
  if (!normalizedTheme) return [] as CompetitorThemeSource[]

  const matchingSuggestion = collectCompetitorThemeSuggestions(rows)
    .find((suggestion) => suggestion.theme.toLowerCase() === normalizedTheme)

  return matchingSuggestion?.sources.slice(0, maxSources) ?? []
}

export function getInterviewFocusThemeLabel(mode: unknown, theme: unknown) {
  const normalizedMode = isInterviewFocusThemeMode(mode) ? mode : DEFAULT_INTERVIEW_FOCUS_THEME_MODE
  const normalizedTheme = normalizeInterviewFocusTheme(theme)

  if (normalizedMode === 'omakase') return 'テーマ: お任せ'
  if (!normalizedTheme) return null
  return normalizedMode === 'suggested'
    ? `おすすめテーマ: ${normalizedTheme}`
    : `テーマ: ${normalizedTheme}`
}

export function buildInterviewFocusThemeContext(mode: unknown, theme: unknown) {
  const normalizedMode = isInterviewFocusThemeMode(mode) ? mode : DEFAULT_INTERVIEW_FOCUS_THEME_MODE
  const normalizedTheme = normalizeInterviewFocusTheme(theme)

  if (normalizedMode === 'omakase') {
    return `【今回のインタビューの進め方】
テーマはお任せです。これまで通り、会話の流れと調査結果をもとに、価値が見つかる方向へ自然に深掘りしてください。`
  }

  if (!normalizedTheme) return ''

  return normalizedMode === 'suggested'
    ? `【今回のインタビューの進め方】
ユーザーはAIのおすすめテーマの中から「${normalizedTheme}」を選びました。このテーマを起点に自然な会話で深掘りしてください。最初の質問もこのテーマに沿って始めてください。`
    : `【今回のインタビューの進め方】
ユーザーは「${normalizedTheme}」をテーマに選びました。このテーマを起点に自然な会話で深掘りしてください。最初の質問もこのテーマに沿って始めてください。`
}
