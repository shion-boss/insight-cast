'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { Character } from '@/lib/characters'

type Message = {
  castId: string
  text: string
}

export function CastTalkContent({
  messages,
  characterMap,
}: {
  messages: Message[]
  characterMap: Record<string, Character>
}) {
  const [visibleCount, setVisibleCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visibleCount >= messages.length) return

    const timer = setTimeout(() => {
      setVisibleCount((prev) => prev + 1)
    }, visibleCount === 0 ? 300 : 450)

    return () => clearTimeout(timer)
  }, [visibleCount, messages.length])

  // 新しいメッセージ表示時にスクロール
  useEffect(() => {
    if (visibleCount > 0 && visibleCount < messages.length) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [visibleCount, messages.length])

  return (
    <div className="space-y-6">
      {messages.slice(0, visibleCount).map((msg, i) => {
        const char = characterMap[msg.castId]
        return (
          <div
            key={i}
            className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {/* キャストアイコン */}
            <div className="shrink-0">
              {char ? (
                <Image
                  src={char.icon96}
                  alt={char.name}
                  width={48}
                  height={48}
                  className="rounded-full border-2 border-[var(--border)]"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--bg2)] text-sm font-semibold text-[var(--text3)]">
                  {msg.castId.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            {/* 吹き出し */}
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-xs font-semibold text-[var(--text3)]">
                {char?.name ?? msg.castId}
              </p>
              <div className="relative rounded-[var(--r-lg)] rounded-tl-none border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-sm">
                <p className="text-[0.9375rem] leading-8 text-[var(--text)]">{msg.text}</p>
              </div>
            </div>
          </div>
        )
      })}

      {/* 読み込み中のインジケーター */}
      {visibleCount < messages.length && (
        <div className="flex items-center gap-2 pl-16 text-sm text-[var(--text3)]">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text3)] [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text3)] [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text3)] [animation-delay:300ms]" />
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
