import { AppShell } from '@/components/app-shell'

export default function ProjectLoading() {
  return (
    <AppShell title="" active="projects" accountLabel="設定" isAdmin={false} contentClassName="max-w-5xl">
      <div className="animate-pulse space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="h-5 w-48 rounded bg-[var(--bg2)]" />
        {/* Overview panel skeleton */}
        <div className="h-[140px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        {/* Analytics skeleton */}
        <div className="h-[160px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        {/* Interview history skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-28 rounded bg-[var(--bg2)]" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[80px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
