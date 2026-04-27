import { AppShell } from '@/components/app-shell'

export default function DashboardLoading() {
  return (
    <AppShell title="ダッシュボード" active="dashboard" accountLabel="設定" isAdmin={false}>
      <div className="animate-pulse space-y-6">
        {/* Greeting bar skeleton */}
        <div className="h-[88px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[88px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="h-6 w-24 rounded bg-[var(--bg2)]" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[72px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-6 w-24 rounded bg-[var(--bg2)]" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[60px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
