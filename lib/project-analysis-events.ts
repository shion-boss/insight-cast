// プロジェクト調査・取材メモ・記事生成の「保留中タスク」を localStorage で
// 追跡するための pure helpers。
//
// このモジュールは Supabase / React をいっさい import しない純粋ヘルパー集
// として `components/project-analysis-notifier.tsx` から切り出されている。
//
// 切り出しの理由:
//   旧構成では `project-analysis-notifier.tsx` が
//   - default export: ProjectAnalysisNotifier (React + Supabase 依存)
//   - named exports: 純粋ヘルパー (localStorage のみ)
//   を同居させていた。これを `(tool)/layout.tsx` で
//   `next/dynamic({ ssr: false })` で読み込みつつ、他のファイルからは
//   名前付き import で参照していた結果、Webpack の chunk graph が分裂し
//   `TypeError: e[n] is not a function` の温床になっていた
//   （2026-05-09 のモニター監査で /dashboard で集中観測）。
//
//   コンポーネント本体と pure helpers を別モジュールに分けることで、
//   helpers は marketing pages にも安全に取り込まれる軽量モジュール、
//   Notifier は Supabase を抱えた重量級コンポーネントとしてそれぞれ
//   独立した chunk になる。
//
// 注意:
//   この helpers は **クライアント専用**。`window.localStorage` を参照する
//   ので SSR では呼ばないこと。

type PendingProjectMap = Record<string, { name: string }>
type PendingSummaryMap = Record<string, { projectId: string; projectName: string }>
export type PendingArticleJob = {
  projectId: string
  projectName: string
  interviewId: string
  articleType: string
  articleLabel: string
  style?: string
  volume?: string
  theme?: string
  polishAnswers?: boolean
  requestedAt: string
}
type PendingArticleMap = Record<string, PendingArticleJob>

const ANALYSIS_STORAGE_KEY = 'insight-cast:pending-project-analyses'
const SUMMARY_STORAGE_KEY = 'insight-cast:pending-interview-summaries'
const ARTICLE_STORAGE_KEY = 'insight-cast:pending-article-generations'
export const TASK_QUEUE_EVENT = 'insight-cast:task-queue-changed'

function notifyTaskQueueChanged() {
  window.dispatchEvent(new Event(TASK_QUEUE_EVENT))
}

function readJsonRecord<T>(storageKey: string): T {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return {} as T
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed as T : {} as T
  } catch {
    return {} as T
  }
}

function writeJsonRecord(storageKey: string, value: unknown) {
  window.localStorage.setItem(storageKey, JSON.stringify(value))
}

export function readPendingProjects(): PendingProjectMap {
  return readJsonRecord<PendingProjectMap>(ANALYSIS_STORAGE_KEY)
}

export function writePendingProjects(value: PendingProjectMap) {
  writeJsonRecord(ANALYSIS_STORAGE_KEY, value)
}

export function readPendingSummaries(): PendingSummaryMap {
  return readJsonRecord<PendingSummaryMap>(SUMMARY_STORAGE_KEY)
}

export function writePendingSummaries(value: PendingSummaryMap) {
  writeJsonRecord(SUMMARY_STORAGE_KEY, value)
}

export function readPendingArticles(): PendingArticleMap {
  return readJsonRecord<PendingArticleMap>(ARTICLE_STORAGE_KEY)
}

export function writePendingArticles(value: PendingArticleMap) {
  writeJsonRecord(ARTICLE_STORAGE_KEY, value)
}

export function trackPendingProjectAnalysis(projectId: string, name: string) {
  const next = readPendingProjects()
  next[projectId] = { name }
  writePendingProjects(next)
  notifyTaskQueueChanged()
}

export function clearPendingProjectAnalysis(projectId: string) {
  const next = readPendingProjects()
  if (!next[projectId]) return
  delete next[projectId]
  writePendingProjects(next)
  notifyTaskQueueChanged()
}

export function trackPendingInterviewSummary(input: {
  interviewId: string
  projectId: string
  projectName: string
}) {
  const next = readPendingSummaries()
  next[input.interviewId] = {
    projectId: input.projectId,
    projectName: input.projectName,
  }
  writePendingSummaries(next)
  notifyTaskQueueChanged()
}

export function clearPendingInterviewSummary(interviewId: string) {
  const next = readPendingSummaries()
  if (!next[interviewId]) return
  delete next[interviewId]
  writePendingSummaries(next)
  notifyTaskQueueChanged()
}

export function hasPendingInterviewSummary(interviewId: string) {
  return Boolean(readPendingSummaries()[interviewId])
}

export function trackPendingArticleGeneration(input: {
  jobId: string
  projectId: string
  projectName: string
  interviewId: string
  articleType: string
  articleLabel: string
  style?: string
  volume?: string
  theme?: string
  polishAnswers?: boolean
  requestedAt: string
}) {
  const next = readPendingArticles()
  next[input.jobId] = {
    projectId: input.projectId,
    projectName: input.projectName,
    interviewId: input.interviewId,
    articleType: input.articleType,
    articleLabel: input.articleLabel,
    style: input.style,
    volume: input.volume,
    theme: input.theme,
    polishAnswers: input.polishAnswers,
    requestedAt: input.requestedAt,
  }
  writePendingArticles(next)
  notifyTaskQueueChanged()
}

export function clearPendingArticleGeneration(jobId: string) {
  const next = readPendingArticles()
  if (!next[jobId]) return
  delete next[jobId]
  writePendingArticles(next)
  notifyTaskQueueChanged()
}

export function findPendingArticleGeneration(interviewId: string, articleType: string) {
  return Object.entries(readPendingArticles()).find(([, job]) => (
    job.interviewId === interviewId && job.articleType === articleType
  )) ?? null
}

export function getPendingArticleGeneration(jobId: string) {
  return readPendingArticles()[jobId] ?? null
}

export function getPendingArticleGenerationCount(interviewId: string) {
  return Object.values(readPendingArticles()).filter((job) => job.interviewId === interviewId).length
}
