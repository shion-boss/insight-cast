import Image from 'next/image'
import type { Character } from '@/lib/characters'

type Message = {
  castId: string
  text: string
}

export function CastTalkContent({
  messages,
  characterMap,
  interviewerId,
}: {
  messages: Message[]
  characterMap: Record<string, Character>
  interviewerId: string
}) {
  return (
    <div className="space-y-6">
      {messages.map((msg, i) => {
        const char = characterMap[msg.castId]
        const isInterviewer = msg.castId === interviewerId
        return (
          <div
            key={i}
            className={`flex items-start gap-4 ${isInterviewer ? 'flex-row-reverse' : ''}`}
          >
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

            <div className="min-w-0 max-w-[75%]">
              <p className={`mb-1.5 text-xs font-semibold text-[var(--text3)] ${isInterviewer ? 'text-right' : ''}`}>
                {char?.name ?? msg.castId}
              </p>
              <div className={`relative rounded-[var(--r-lg)] border border-[var(--border)] px-5 py-4 shadow-sm ${isInterviewer ? 'rounded-tr-none bg-[var(--accent-l)]' : 'rounded-tl-none bg-[var(--surface)]'}`}>
                <p className="text-[0.9375rem] leading-8 text-[var(--text)]">{msg.text}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
