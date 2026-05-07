'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { refreshProjectImage } from '@/lib/actions/projects'

export function ProjectImageRefreshButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await refreshProjectImage(projectId)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-[11px] text-[var(--text2)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="プロジェクト画像を自社HPから再取得する"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={isPending ? 'animate-spin' : ''}>
        <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
      <span>{isPending ? '取得中…' : '画像を再取得'}</span>
    </button>
  )
}
