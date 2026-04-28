'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { getButtonClass } from '@/components/ui'
import { showToast } from '@/lib/client/toast'

type Props = {
  projectId: string
  projectName: string
}

export function DeleteProjectButton({ projectId, projectName }: Props) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
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
      router.push('/projects')
      router.refresh()

      showToast({
        title: '取材先を削除しました。30日以内に復元できます。',
        tone: 'default',
        characterId: 'mint',
        undoLabel: '元に戻す',
        onUndo: async () => {
          const restoreRes = await fetch(`/api/projects/${projectId}/restore`, { method: 'POST' })
          if (restoreRes.ok) {
            router.push(`/projects/${projectId}`)
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
        className={getButtonClass('secondary', 'px-3 py-1.5 text-xs border-[var(--err)]/40 text-[var(--err)] hover:bg-[var(--err-l)]')}
      >
        取材先を削除
      </button>

      {showDialog && (
        <ConfirmDialog
          dialogId="delete-project"
          title="取材先を削除しますか？"
          subject={projectName}
          description="取材先と、ひもづく取材メモ・記事素材がすべて削除されます。30日以内であれば復元できます。"
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
