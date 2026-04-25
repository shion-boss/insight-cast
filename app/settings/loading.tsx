import { AppShellSkeleton } from '@/components/app-shell-skeleton'

export default function SettingsLoading() {
  return (
    <AppShellSkeleton title="設定">
      <div className="grid items-start gap-8 lg:grid-cols-[200px_1fr]">
        {/* サイドナビのスケルトン */}
        <div className="flex flex-row gap-1 lg:flex-col">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-[var(--r-sm)] bg-[var(--bg2)]"
              style={{ minWidth: '72px' }}
            />
          ))}
        </div>
        {/* メインコンテンツのスケルトン */}
        <div className="space-y-4">
          <div className="h-52 animate-pulse rounded-[var(--r-lg)] bg-[var(--bg2)]" />
          <div className="h-36 animate-pulse rounded-[var(--r-lg)] bg-[var(--bg2)]" style={{ maxWidth: '80%' }} />
        </div>
      </div>
    </AppShellSkeleton>
  )
}
