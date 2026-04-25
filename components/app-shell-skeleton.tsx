import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { label: 'ダッシュボード', icon: '⊡' },
  { label: '取材先一覧', icon: '◫' },
  { label: '取材メモ一覧', icon: '◎' },
  { label: '記事一覧', icon: '≡' },
  { label: '設定', icon: '⚙' },
]

export function AppShellSkeleton({
  title,
  headerRight,
  children,
}: {
  title?: ReactNode
  headerRight?: ReactNode
  children?: ReactNode
} = {}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* sidebar */}
      <aside className="border-b border-[var(--border)] bg-[var(--surface)] lg:fixed lg:inset-y-0 lg:left-0 lg:w-[236px] lg:border-b-0 lg:border-r">
        <div className="mx-auto flex max-w-6xl flex-col lg:h-full lg:max-w-none">
          <div className="border-b border-[var(--border)] px-6 py-5 lg:px-5">
            <span className="font-serif text-[17px] font-bold text-[var(--text)]">
              Insight <span className="text-[var(--accent)]">Cast</span>
            </span>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-3 lg:py-3">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 rounded-[var(--r-sm)] px-3 py-2.5 text-sm font-medium text-[var(--text2)]"
              >
                <span aria-hidden="true" className="text-base leading-none">{item.icon}</span>
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="border-t border-[var(--border)] px-4 py-4 lg:px-3">
            <div className="flex flex-col gap-2">
              <div className="h-10 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)]" />
              <div className="h-10 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)]" />
            </div>
          </div>
        </div>
      </aside>

      {/* main area */}
      <div className="lg:pl-[236px]">
        {/* header */}
        <header className="relative sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(250,246,240,0.93)] backdrop-blur-[16px]">
          {/* loading bar — header 幅いっぱい・最下部 */}
          <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
            <div className="h-full animate-[page-load_1.2s_ease-in-out_infinite]" style={{ background: 'var(--accent)' }} />
          </div>
          <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between gap-4 px-6">
            <div className="min-w-0">
              {title
                ? <p className="truncate font-serif text-lg font-bold text-[var(--text)]">{title}</p>
                : <div className="h-6 w-40 animate-pulse rounded bg-[var(--border)]" />
              }
            </div>
            <div className="flex items-center gap-3">
              {headerRight && <div className="opacity-50 pointer-events-none">{headerRight}</div>}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--accent-l)]" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
