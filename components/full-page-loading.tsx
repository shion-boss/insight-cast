// Static paths so this component is usable as pure client-side (no next/image server overhead)
const CHAR_ICONS = [
  { src: '/characters/mint-48.png', alt: 'ミント', emoji: '🐱' },
  { src: '/characters/claus-48.png', alt: 'クラウス', emoji: '🦉' },
  { src: '/characters/rain-48.png', alt: 'レイン', emoji: '🦊' },
]

export function FullPageLoading() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8"
      style={{ background: 'var(--bg)' }}
    >
      {/* キャラアイコン */}
      <div className="flex items-center">
        {CHAR_ICONS.map((c, i) => (
          <div
            key={c.alt}
            className="overflow-hidden rounded-full border-2 border-[var(--surface)] bg-[var(--surface2)] shadow"
            style={{ width: 56, height: 56, marginLeft: i === 0 ? 0 : -12, zIndex: 3 - i }}
          >
            <img
              src={c.src}
              alt={c.alt}
              width={56}
              height={56}
              className="h-full w-full object-cover"
              onError={(e) => {
                const t = e.currentTarget
                t.style.display = 'none'
                const span = document.createElement('span')
                span.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;'
                span.textContent = c.emoji
                t.parentElement?.appendChild(span)
              }}
            />
          </div>
        ))}
      </div>

      {/* ブランド */}
      <div className="flex flex-col items-center gap-2">
        <p className="font-serif text-2xl font-bold tracking-wide text-[var(--text)]">
          Insight <span className="text-[var(--accent)]">Cast</span>
        </p>
        <p className="text-sm text-[var(--text3)]">会話から、記事へ。あなたの当たり前を言葉に。</p>
      </div>

      {/* プログレスバー */}
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
