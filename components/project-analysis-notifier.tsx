'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/lib/client/toast'

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

function readPendingProjects(): PendingProjectMap {
  return readJsonRecord<PendingProjectMap>(ANALYSIS_STORAGE_KEY)
}

function writePendingProjects(value: PendingProjectMap) {
  writeJsonRecord(ANALYSIS_STORAGE_KEY, value)
}

function readPendingSummaries(): PendingSummaryMap {
  return readJsonRecord<PendingSummaryMap>(SUMMARY_STORAGE_KEY)
}

function writePendingSummaries(value: PendingSummaryMap) {
  writeJsonRecord(SUMMARY_STORAGE_KEY, value)
}

function readPendingArticles(): PendingArticleMap {
  return readJsonRecord<PendingArticleMap>(ARTICLE_STORAGE_KEY)
}

function writePendingArticles(value: PendingArticleMap) {
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

export default function ProjectAnalysisNotifier() {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const startingAnalysisRef = useRef<Set<string>>(new Set())
  const startingSummaryRef = useRef<Set<string>>(new Set())
  const startingArticleRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function pollAnalysis() {
      const pending = readPendingProjects()
      const ids = Object.keys(pending)
      if (ids.length === 0) return

      const params = new URLSearchParams({ ids: ids.join(',') })
      const res = await fetch(`/api/projects/analysis-status?${params.toString()}`, {
        cache: 'no-store',
      }).catch(() => null)

      if (!res?.ok) return
      const json = await res.json().catch(() => null)
      const projects = Array.isArray(json?.projects) ? json.projects : []

      const nextPending = { ...pending }

      for (const project of projects) {
        if (!project?.id || !nextPending[project.id]) continue

        if (project.status === 'analysis_pending' && !startingAnalysisRef.current.has(project.id)) {
          startingAnalysisRef.current.add(project.id)

          fetch(`/api/projects/${project.id}/analyze`, { method: 'POST' })
            .finally(() => {
              startingAnalysisRef.current.delete(project.id)
            })

          router.refresh()
          continue
        }

        if (project.status === 'report_ready') {
          router.refresh()
          showToast({
            id: `analysis-ready-${project.id}`,
            title: '調査が完了しました',
            description: `${nextPending[project.id].name} の結果を確認できます。`,
            tone: 'success',
            href: `/projects/${project.id}/report`,
            hrefLabel: '調査結果を見る',
          })
          delete nextPending[project.id]
        }
      }

      writePendingProjects(nextPending)
    }

    async function pollSummaries() {
      const supabase = supabaseRef.current
      const pendingSummaries = readPendingSummaries()
      const ids = Object.keys(pendingSummaries)
      if (ids.length === 0) return

      const { data: interviews } = await supabase
        .from('interviews')
        .select('id, summary')
        .in('id', ids)

      const nextPendingSummaries = { ...pendingSummaries }

      for (const interviewId of ids) {
        const pendingSummary = nextPendingSummaries[interviewId]
        if (!pendingSummary) continue

        const interview = (interviews ?? []).find((item) => item.id === interviewId)
        if (interview?.summary) {
          router.refresh()
          showToast({
            id: `summary-ready-${interviewId}`,
            title: '取材メモが届きました',
            description: `${pendingSummary.projectName} の取材メモを確認できます。`,
            tone: 'success',
            href: `/projects/${pendingSummary.projectId}/summary?interviewId=${interviewId}`,
            hrefLabel: '取材メモを見る',
          })
          delete nextPendingSummaries[interviewId]
          continue
        }

        if (startingSummaryRef.current.has(interviewId)) continue

        startingSummaryRef.current.add(interviewId)
        void fetch(`/api/projects/${pendingSummary.projectId}/interview/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interviewId }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('failed to summarize')
            }
          })
          .catch(() => {
            clearPendingInterviewSummary(interviewId)
            showToast({
              id: `summary-error-${interviewId}`,
              title: '取材メモを作成できませんでした',
              description: '少し待ってから、もう一度お試しください。',
              tone: 'warning',
            })
            router.refresh()
          })
          .finally(() => {
            startingSummaryRef.current.delete(interviewId)
          })
      }

      writePendingSummaries(nextPendingSummaries)
    }

    async function pollArticles() {
      const supabase = supabaseRef.current
      const pendingArticles = readPendingArticles()
      const jobs = Object.entries(pendingArticles)
      if (jobs.length === 0) return

      const interviewIds = Array.from(new Set(jobs.map(([, job]) => job.interviewId)))
      const { data: articles } = await supabase
        .from('articles')
        .select('id, interview_id, article_type, created_at')
        .in('interview_id', interviewIds)
        .order('created_at', { ascending: false })

      const nextPendingArticles = { ...pendingArticles }

      for (const [jobId, job] of jobs) {
        const requestedAt = new Date(job.requestedAt).getTime() - 60_000
        const matchedArticle = (articles ?? []).find((article) => (
          article.interview_id === job.interviewId
          && article.article_type === job.articleType
          && new Date(article.created_at).getTime() >= requestedAt
        ))

        if (matchedArticle) {
          router.refresh()
          showToast({
            id: `article-ready-${jobId}`,
            title: '記事素材の作成が完了しました',
            description: `${job.projectName} の${job.articleLabel}を確認できます。`,
            tone: 'success',
            href: `/projects/${job.projectId}/articles/${matchedArticle.id}`,
            hrefLabel: '記事を見る',
          })
          delete nextPendingArticles[jobId]
          continue
        }

        if (startingArticleRef.current.has(jobId)) continue

        startingArticleRef.current.add(jobId)
        void fetch(`/api/projects/${job.projectId}/article`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId: job.interviewId,
            articleType: job.articleType,
            style: job.style,
            volume: job.volume,
            theme: job.theme,
            polishAnswers: job.polishAnswers,
            background: true,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('failed to generate article')
            }
          })
          .catch(() => {
            clearPendingArticleGeneration(jobId)
            showToast({
              id: `article-error-${jobId}`,
              title: '記事素材を作成できませんでした',
              description: '少し待ってから、もう一度お試しください。',
              tone: 'warning',
            })
            router.refresh()
          })
          .finally(() => {
            startingArticleRef.current.delete(jobId)
          })
      }

      writePendingArticles(nextPendingArticles)
    }

    async function poll() {
      await pollAnalysis()
      await pollSummaries()
      await pollArticles()
    }

    const handleTaskQueueChanged = () => {
      void poll()
    }

    window.addEventListener(TASK_QUEUE_EVENT, handleTaskQueueChanged)
    void poll()
    intervalId = setInterval(() => {
      void poll()
    }, 15000)

    return () => {
      if (intervalId) clearInterval(intervalId)
      window.removeEventListener(TASK_QUEUE_EVENT, handleTaskQueueChanged)
    }
  }, [router])

  return null
}
