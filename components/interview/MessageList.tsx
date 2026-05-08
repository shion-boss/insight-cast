'use client'

import React from 'react'
import Image from 'next/image'
import type { StaticImageData } from 'next/image'
import { CharacterAvatar } from '@/components/ui'
import type { InterviewMessage } from './types'

type Props = {
  messages: InterviewMessage[]
  loading: boolean
  streamingMessage: string
  characterName?: string
  characterIcon48?: StaticImageData
  characterEmoji?: string
  // モグロ等のYes/No質問に対するクリックハンドラ。指定されていれば最新の interviewer message に
  // yesno フラグが立っているときボタンを表示する。
  onYesNo?: (answer: 'はい' | 'いいえ') => void
  hasReachedTurnLimit?: boolean
  bottomRef: React.RefObject<HTMLDivElement | null>
}

export function InterviewMessageList({
  messages,
  loading,
  streamingMessage,
  characterName,
  characterIcon48,
  characterEmoji,
  onYesNo,
  hasReachedTurnLimit = false,
  bottomRef,
}: Props) {
  return (
    <div
      role="log"
      aria-label="インタビューの会話"
      aria-live="polite"
      tabIndex={0}
      style={{ scrollbarGutter: 'stable' }}
      className="flex-1 min-h-0 overflow-y-auto px-3 py-4 sm:px-7 flex flex-col gap-4 max-w-2xl w-full mx-auto"
    >
      {messages.map((msg, i) => {
        const isLatestInterviewer = msg.role === 'interviewer' && i === messages.length - 1
        const showYesNoButtons =
          isLatestInterviewer &&
          msg.yesno === true &&
          !loading &&
          !streamingMessage &&
          !hasReachedTurnLimit &&
          !!onYesNo
        return (
          <React.Fragment key={`${msg.role}-${i}`}>
            <div className={`flex gap-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'interviewer' && (
                <CharacterAvatar
                  src={characterIcon48}
                  alt={`${characterName ?? 'インタビュアー'}のアイコン`}
                  emoji={characterEmoji}
                  size={32}
                  className="-mt-2 flex-shrink-0 border-[var(--border)] bg-[var(--accent-l)]"
                />
              )}
              <div className={`max-w-[80%] sm:max-w-[60%] px-4 py-3 text-base sm:text-[15px] whitespace-pre-wrap break-words leading-[1.85] border border-[var(--border)] text-[var(--text)] rounded-[var(--r-lg)] shadow-[var(--elevation-1)] ${
                msg.role === 'interviewer'
                  ? 'bg-[var(--surface)] rounded-tl-none'
                  : 'bg-[var(--accent-l)] rounded-tr-none'
              }`}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {msg.attachments.map((att, j) =>
                      att.previewUrl ? (
                        <Image
                          key={`${i}-${j}`}
                          src={att.previewUrl}
                          alt={`添付 ${j + 1}`}
                          width={480}
                          height={480}
                          unoptimized
                          style={{ width: 'auto', height: 'auto' }}
                          className="max-h-80 max-w-full rounded-lg sm:max-h-96"
                        />
                      ) : (
                        <div
                          key={`${i}-${j}`}
                          className="h-32 w-32 rounded-lg bg-[var(--bg2)] border border-[var(--border)] flex items-center justify-center text-[13px] text-[var(--text2)]"
                          aria-label="画像読み込み中"
                        >
                          画像
                        </div>
                      ),
                    )}
                  </div>
                )}
                {msg.content
                  ? msg.content
                  : msg.attachments && msg.attachments.length > 0
                    ? null
                    : <span className="opacity-50">...</span>}
              </div>
            </div>
            {showYesNoButtons && (
              <div className="flex gap-2 pl-10">
                <button
                  type="button"
                  onClick={() => onYesNo?.('はい')}
                  disabled={loading}
                  className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-full px-5 py-2 text-base font-semibold min-h-[40px] disabled:opacity-50 cursor-pointer transition-colors"
                >
                  はい
                </button>
                <button
                  type="button"
                  onClick={() => onYesNo?.('いいえ')}
                  disabled={loading}
                  className="border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg2)] rounded-full px-5 py-2 text-base font-semibold min-h-[40px] disabled:opacity-50 cursor-pointer transition-colors"
                >
                  いいえ
                </button>
              </div>
            )}
          </React.Fragment>
        )
      })}
      {(loading || streamingMessage) && (
        <div className="flex gap-1">
          <CharacterAvatar
            src={characterIcon48}
            alt={`${characterName ?? 'インタビュアー'}のアイコン`}
            emoji={characterEmoji}
            size={32}
            className="-mt-2 flex-shrink-0 border-[var(--border)] bg-[var(--accent-l)]"
          />
          <div className="max-w-[80%] sm:max-w-[60%] bg-[var(--surface)] border border-[var(--border)] px-3 py-1 rounded-2xl rounded-tl-sm break-words">
            {streamingMessage ? (
              <span className="text-[var(--text2)] text-[15px] whitespace-pre-wrap leading-[1.85]">
                {streamingMessage}
              </span>
            ) : (
              <span className="ic-typing-dots">
                <span className="ic-typing-dot" />
                <span className="ic-typing-dot" />
                <span className="ic-typing-dot" />
              </span>
            )}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
