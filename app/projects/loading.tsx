import { AppShell } from '@/components/app-shell'

export default function ProjectsLoading() {
  return (
    <AppShell title="取材先" active="projects" accountLabel="設定" isAdmin={false}>
      <div aria-busy="true" aria-label="読み込み中" className="animate-pulse space-y-4">
        <div className="h-6 w-32 rounded bg-[var(--bg2)]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[140px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
