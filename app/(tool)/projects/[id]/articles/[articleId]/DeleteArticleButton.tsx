'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { showToast } from '@/lib/client/toast'

type Props = {
  articleId: string
  projectId: string
  articleTitle: string
  backHref: string
}

export function DeleteArticleButton({ articleId, projectId, articleTitle, backHref }: Props) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/articles/${articleId}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast({
          title: 'うまく削除できませんでした。もう一度お試しください。',
          tone: 'warning',
          characterId: 'mint',
        })
        setDeleting(false)
        setShowDialog(false)
        return
      }

      setShowDialog(false)
      router.push(backHref)
      router.refresh()

      showToast({
        title: '記事を削除しました。30日以内に復元できます。',
        tone: 'default',
        characterId: 'mint',
        undoLabel: '元に戻す',
        onUndo: async () => {
          const restoreRes = await fetch(`/api/articles/${articleId}/restore`, { method: 'POST' })
          if (restoreRes.ok) {
            router.push(`/projects/${projectId}/articles/${articleId}`)
            router.refresh()
          } else {
            showToast({
              title: '復元できませんでした。時間をおいてお試しください。',
              tone: 'warning',
              characterId: 'mint',
            })
          }
        },
      })
    } catch {
      showToast({
        title: 'うまく削除できませんでした。もう一度お試しください。',
        tone: 'warning',
        characterId: 'mint',
      })
      setDeleting(false)
      setShowDialog(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        aria-label="記事を削除"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--err)]/30 bg-[var(--surface)] text-[var(--err)] opacity-50 transition-all hover:opacity-100 hover:bg-[var(--err-l)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>

      {showDialog && (
        <ConfirmDialog
          dialogId="delete-article"
          title="記事を削除しますか？"
          subject={articleTitle}
          confirmLabel="削除する"
          confirmingLabel="削除中..."
          confirming={deleting}
          onCancel={() => setShowDialog(false)}
          onConfirm={() => void handleConfirm()}
        />
      )}
    </>
  )
}
