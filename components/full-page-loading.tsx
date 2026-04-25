'use client'

import { useState } from 'react'
import Image from 'next/image'

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
        <span style={{ fontSize: 24 }} aria-hidden="true">{emoji}</span>
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
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8"
      style={{ background: 'var(--bg)' }}
    >
      <div className="flex items-center">
        {CHAR_ICONS.map((c, i) => (
          <CharIcon key={c.alt} src={c.src} alt={c.alt} emoji={c.emoji} index={i} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Image src="/logo.jpg" alt="Insight Cast" width={200} height={60} className="h-[44px] w-auto object-contain" />
        <p className="text-sm text-[var(--text3)]">会話から、記事へ。あなたの当たり前を言葉に。</p>
      </div>

      <div
        className="w-36 overflow-hidden rounded-full"
        style={{ height: 3, background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full animate-[page-load_1.4s_ease-in-out_infinite]"
          style={{ background: 'var(--accent)' }}
        />
      </div>
    </div>
  )
}
