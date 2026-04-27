'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** ダイアログのタイトル文字列 */
  title: string
  /** タイトル下の補足説明（省略可） */
  description?: string
  /** 削除対象名など任意の追加テキスト（省略可） */
  subject?: string
  /** キャンセルラベル（デフォルト: やめる） */
  cancelLabel?: string
  /** 確認ラベル（デフォルト: 削除する） */
  confirmLabel?: string
  /** 確認中の表示ラベル（省略可） */
  confirmingLabel?: string
  /** 確認ボタンが処理中かどうか */
  confirming?: boolean
  /** id prefix（aria-labelledby に使用） */
  dialogId: string
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 汎用削除確認ダイアログ。
 * - フォーカストラップ（Tab循環 + Escape閉じ）
 * - aria-modal / aria-labelledby 対応
 * - バックドロップクリックでキャンセル
 */
export function ConfirmDialog({
  title,
  description,
  subject,
  cancelLabel = 'やめる',
  confirmLabel = '削除する',
  confirmingLabel,
  confirming = false,
  dialogId,
  onCancel,
  onConfirm,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const focusableSelector =
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    // 最初のフォーカス可能要素にフォーカス
    const first = dialog.querySelector<HTMLElement>(focusableSelector)
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      if (e.key !== 'Tab') return

      const focusableEls = Array.from(
        dialog!.querySelectorAll<HTMLElement>(focusableSelector),
      )
      if (focusableEls.length === 0) return

      const firstEl = focusableEls[0]
      const lastEl = focusableEls[focusableEls.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        className="w-full max-w-sm rounded-[var(--r-lg)] bg-white border border-gray-200 p-6 shadow-xl"
      >
        <p id={`${dialogId}-title`} className="text-[15px] font-bold text-gray-900 mb-2">
          {title}
        </p>
        {subject && (
          <p className="text-sm text-gray-600 mb-1 line-clamp-2">「{subject}」</p>
        )}
        {description && (
          <p className="text-sm text-gray-500 mb-5">{description}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--r-sm)] border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--r-sm)] border border-red-500 bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
          >
            {confirming && confirmingLabel ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
