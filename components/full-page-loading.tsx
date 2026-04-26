'use client'

import { useState } from 'react'

const CHAR_ICONS = [
  { src: '/characters/mint-48.png', alt: 'ミント', emoji: '🐱' },
  { src: '/characters/claus-48.png', alt: 'クラウス', emoji: '🦉' },
  { src: '/characters/rain-48.png', alt: 'レイン', emoji: '🦊' },
]

function CharIcon({ src, alt, emoji, index }: { src: string; alt: string; emoji: string; index: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full border-2 border-[var(--surface)] bg-[var(--surface2)] shadow"
      style={{ width: 56, height: 56, marginLeft: index === 0 ? 0 : -12, zIndex: 3 - index, flexShrink: 0 }}
    >
      {failed ? (
        <span className="text-[24px]" aria-hidden="true">{emoji}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          width={56}
          height={56}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

export function FullPageLoading() {
  return (
    <div role="status" aria-label="ページを読み込んでいます" className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8 bg-[var(--bg)]">
      <div className="flex items-center">
        {CHAR_ICONS.map((c, i) => (
          <CharIcon key={c.alt} src={c.src} alt={c.alt} emoji={c.emoji} index={i} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="font-serif text-2xl font-bold tracking-wide text-[var(--text)]">
          Insight <span className="text-[var(--accent)]">Cast</span>
        </p>
        <p className="text-sm text-[var(--text3)]">会話から、記事へ。あなたの当たり前を言葉に。</p>
      </div>

      <div className="w-36 h-[3px] overflow-hidden rounded-full bg-[var(--border)]">
        <div className="h-full rounded-full animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
      </div>
    </div>
  )
}
