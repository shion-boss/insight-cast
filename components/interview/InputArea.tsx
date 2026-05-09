'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import type { StaticImageData } from 'next/image'
import { CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import type { AttachmentRef } from './types'

type Props = {
  characterId: string
  characterName?: string
  characterIcon48?: StaticImageData
  characterEmoji?: string
  input: string
  onInputChange: (next: string) => void
  loading: boolean
  initializing?: boolean
  hasReachedTurnLimit: boolean

  passStreak: number
  passStreakLimit: number
  onPassQuestion: () => void

  // 追加アクション（通常側でのみ使用、ext では undefined を渡せばボタン非表示）
  onDeepDive?: () => void
  showDeepDive?: boolean

  // ハル限定オプション
  pendingAttachments?: AttachmentRef[]
  uploadingAttachment?: boolean
  onAttachmentSelected?: (file: File) => void
  onRemoveAttachment?: (index: number) => void
  // 「写真なしで進める」表示制御（通常側のみ。ext は false でOK）
  showSkipPhoto?: boolean
  onSkipPhoto?: () => void

  submitError?: string | null
  onSubmit: () => void

  // 「✨AI送信」など開発者ラベル要素を上に置きたければ children として
  rightSlot?: React.ReactNode
}

export function InterviewInputArea({
  characterId,
  characterName,
  characterIcon48,
  characterEmoji,
  input,
  onInputChange,
  loading,
  initializing = false,
  hasReachedTurnLimit,
  passStreak,
  passStreakLimit,
  onPassQuestion,
  onDeepDive,
  showDeepDive = false,
  pendingAttachments,
  uploadingAttachment = false,
  onAttachmentSelected,
  onRemoveAttachment,
  showSkipPhoto = false,
  onSkipPhoto,
  submitError,
  onSubmit,
  rightSlot,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  // 親側からフォーカスしたい時のために submit 後に focus を当てる
  React.useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => textareaRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [loading])

  const showAttachmentControls = characterId === 'hal' && !!onAttachmentSelected
  const hasPendingAttachments = (pendingAttachments?.length ?? 0) > 0

  return (
    <div className="bg-[var(--surface)] border-t border-[var(--border)] px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
      {submitError && (
        <div role="alert" className="max-w-2xl mx-auto mb-3">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={characterIcon48}
                alt={`${characterName ?? 'インタビュアー'}のアイコン`}
                emoji={characterEmoji}
                size={44}
              />
            )}
            name={characterName ?? 'インタビュアー'}
            title="返事が少し途切れてしまいました。"
            description={submitError}
            tone="soft"
          />
        </div>
      )}
      <div className="max-w-2xl mx-auto">
        {/* ハル限定: 添付プレビュー */}
        {showAttachmentControls && hasPendingAttachments && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingAttachments!.map((att, idx) => (
              <div key={att.path || idx} className="relative">
                <Image
                  src={att.previewUrl}
                  alt={`添付 ${idx + 1}`}
                  width={80}
                  height={80}
                  unoptimized
                  className="h-20 w-20 rounded-md object-cover border border-[var(--border)]"
                />
                {onRemoveAttachment && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(idx)}
                    aria-label="この画像を削除"
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[var(--err)] text-white text-[13px] flex items-center justify-center hover:bg-[var(--err-h,var(--err))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mb-2 flex flex-col gap-2">
          <p className="text-[13px] text-[var(--text2)] hidden sm:block">
            {passStreak >= passStreakLimit
              ? `パスは連続${passStreakLimit}回までです。何か一言でもいいので答えてみてください。`
              : input.trim()
                ? '入力中はパスできません。送信するか、内容を消してからパスできます。'
                : showDeepDive
                  ? `答えづらい質問は、${passStreakLimit}回までパスして次へ進めます。気になる話があれば「もう少し聞いてもらう」も使えます。`
                  : `答えづらい質問は、${passStreakLimit}回までパスして次へ進めます。`}
          </p>
          <p className="text-[13px] text-[var(--text2)] sm:hidden">
            {passStreak >= passStreakLimit
              ? `連続パスは${passStreakLimit}回までです。`
              : input.trim()
                ? '入力中はパスできません。'
                : `答えづらければ${passStreakLimit}回までパスできます。`}
          </p>
          <div className="flex flex-wrap items-center justify-start gap-2">
            {showAttachmentControls && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && onAttachmentSelected) onAttachmentSelected(file)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || initializing || hasReachedTurnLimit || uploadingAttachment || (pendingAttachments?.length ?? 0) >= 4}
                  className="border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] rounded-[var(--r-sm)] px-3 sm:px-4 py-2 sm:py-3 text-[13px] min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="写真を添付"
                >
                  {uploadingAttachment ? 'アップ中...' : '📷 写真を添付'}
                </button>
                {showSkipPhoto && onSkipPhoto && (
                  <button
                    type="button"
                    onClick={onSkipPhoto}
                    disabled={loading || initializing || hasReachedTurnLimit}
                    className="border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] rounded-[var(--r-sm)] px-3 sm:px-4 py-2 sm:py-3 text-[13px] min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    写真なしで進める
                  </button>
                )}
              </>
            )}
            {showDeepDive && onDeepDive && (
              <button
                type="button"
                onClick={onDeepDive}
                disabled={loading || initializing || hasReachedTurnLimit}
                className="border border-[var(--accent)]/60 bg-[var(--accent-l)] text-[var(--on-primary-container)] font-semibold hover:bg-[var(--accent-l)] hover:border-[var(--accent)] rounded-[var(--r-sm)] px-3 sm:px-4 py-2 sm:py-3 text-[13px] min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                もう少し聞いてもらう
              </button>
            )}
            <button
              type="button"
              onClick={onPassQuestion}
              disabled={loading || initializing || hasReachedTurnLimit || passStreak >= passStreakLimit || input.trim().length > 0}
              className="border border-dashed border-[var(--border)] bg-transparent text-[var(--text3)] hover:text-[var(--text2)] hover:border-[var(--border2)] rounded-[var(--r-sm)] px-3 sm:px-4 py-2 sm:py-3 text-[13px] min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              この質問はパス
            </button>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="flex gap-2 sm:gap-3 items-end">
          <textarea
            aria-label="インタビューへの回答を入力"
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            maxLength={2000}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                onSubmit()
              }
            }}
            placeholder={hasReachedTurnLimit
              ? '取材はここまでです。ありがとうございました。'
              : showAttachmentControls && hasPendingAttachments
                ? '一言添えても、写真だけで送ってもOK'
                : 'ここに話しかけてください'}
            disabled={loading || initializing || hasReachedTurnLimit}
            autoFocus
            className="flex-1 bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--r-lg)] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:outline-none text-[var(--text)] px-3 sm:px-4 py-3 text-base resize-none leading-relaxed disabled:opacity-50 min-h-[56px] max-h-[200px] overflow-y-auto"
          />
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {rightSlot}
            <button
              type="submit"
              disabled={loading || initializing || hasReachedTurnLimit || (!input.trim() && !hasPendingAttachments)}
              className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-full px-4 sm:px-5 py-3 min-h-[44px] min-w-[56px] sm:min-w-0 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {loading ? '送信中...' : '送信'}
            </button>
            <p className="text-[13px] text-[var(--text2)] hidden sm:block">Ctrl+Enter</p>
          </div>
        </form>
      </div>
    </div>
  )
}
