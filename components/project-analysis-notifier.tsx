'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/client/toast'

type PendingProjectMap = Record<string, { name: string }>

const STORAGE_KEY = 'insight-cast:pending-project-analyses'

function readPendingProjects(): PendingProjectMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed as PendingProjectMap : {}
  } catch {
    return {}
  }
}

function writePendingProjects(value: PendingProjectMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

export function trackPendingProjectAnalysis(projectId: string, name: string) {
  const next = readPendingProjects()
  next[projectId] = { name }
  writePendingProjects(next)
}

export default function ProjectAnalysisNotifier() {
  const router = useRouter()
  const startingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function poll() {
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

        if (
          (project.status === 'analysis_pending' || project.status === 'analyzing')
          && !startingRef.current.has(project.id)
        ) {
          startingRef.current.add(project.id)

          fetch(`/api/projects/${project.id}/analyze`, { method: 'POST' })
            .finally(() => {
              startingRef.current.delete(project.id)
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

    poll()
    intervalId = setInterval(poll, 15000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [router])

  return null
}
