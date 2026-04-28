'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { getButtonClass } from '@/components/ui'
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
        className={getButtonClass('secondary', 'px-4 py-2 text-sm border-[var(--err)]/40 text-[var(--err)] hover:bg-[var(--err-l)]')}
      >
        削除
      </button>

      {showDialog && (
        <ConfirmDialog
          dialogId="delete-article"
          title="記事を削除しますか？"
          subject={articleTitle}
          description="削除した記事は30日以内であれば復元できます。"
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
