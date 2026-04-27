const NAV_LINKS = [
  'ダッシュボード', '記事管理', 'Cast Talk', 'ユーザー管理', 'コスト管理', '関連サービス',
]

export function AdminShellSkeleton() {
  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      {/* sidebar */}
      <aside className="border-b border-white/8 bg-[#1c1410] lg:fixed lg:inset-y-0 lg:left-0 lg:w-[220px] lg:border-b-0 lg:border-r lg:border-r-white/8">
        {/* loading bar — サイドバー最上部にホワイト */}
        <div className="absolute left-0 top-0 hidden h-[2px] w-[220px] overflow-hidden lg:block">
          <div className="h-full animate-[page-load_1s_ease-in-out_infinite] bg-white/60" />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col lg:h-full lg:max-w-none">
          <div className="border-b border-white/8 px-6 py-5 lg:px-5">
            <span className="font-serif text-[17px] font-bold text-white">
              Insight <span className="text-[var(--accent)]">Cast</span>{' '}
              <span className="text-[11px] text-white/50">Admin</span>
            </span>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-3 lg:py-3">
            {NAV_LINKS.map((label) => (
              <div key={label} className="rounded-[var(--r-sm)] px-3 py-2.5 text-sm font-medium text-white/40">
                {label}
              </div>
            ))}
          </nav>
          <div className="border-t border-white/8 px-4 py-4 lg:px-3">
            <div className="h-3 w-32 animate-pulse rounded bg-white/15" />
            <div className="mt-3 h-10 w-full animate-pulse rounded-[var(--r-sm)] bg-white/8" />
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="lg:pl-[220px]">
        <header className="relative sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]">
          {/* loading bar — header 幅いっぱい・最下部 */}
          <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
            <div className="h-full animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
          </div>
          <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between gap-4 px-6">
            <p className="font-serif text-base font-bold text-[var(--text)]">管理画面</p>
            <div className="h-3 w-40 rounded bg-[var(--border)]" />
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-7xl p-8" />
      </div>
    </div>
  )
}
