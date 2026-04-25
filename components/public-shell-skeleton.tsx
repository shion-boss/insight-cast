const NAV_LINKS = [
  'サービス', '料金', 'キャスト', 'ブログ', 'Cast Talk', 'About', 'お問い合わせ', 'FAQ',
]

export function PublicShellSkeleton() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* header — loading bar は header 全体の最下部 */}
      <header className="relative sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(250,246,240,0.93)] backdrop-blur-[16px]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-[62px] items-center justify-between gap-4">
            <span className="font-serif text-[19px] font-bold text-[var(--text)]">
              Insight <span className="text-[var(--accent)]">Cast</span>
            </span>
            <div className="hidden md:flex items-center gap-2">
              <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--border)]" />
              <div className="h-9 w-28 animate-pulse rounded-full bg-[var(--border)]" />
            </div>
          </div>
          {/* nav row */}
          <nav className="hidden md:flex gap-2 overflow-x-auto pb-4">
            {NAV_LINKS.map((label) => (
              <span key={label} className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text3)]">
                {label}
              </span>
            ))}
          </nav>
        </div>
        {/* loading bar — header 幅いっぱい・最下部 */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
          <div className="h-full animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12" />
    </div>
  )
}
