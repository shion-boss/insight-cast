import { AppShell } from '@/components/app-shell'

export default function ReportLoading() {
  return (
    <AppShell title="HPレポート" active="projects" accountLabel="設定" isAdmin={false} contentClassName="max-w-5xl">
      <div aria-busy="true" aria-label="読み込み中" className="animate-pulse space-y-6">
        <div className="h-5 w-48 rounded bg-[var(--bg2)]" />
        <div className="h-[100px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[160px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
          ))}
        </div>
        <div className="h-[200px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        <div className="h-[200px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
      </div>
    </AppShell>
  )
}
