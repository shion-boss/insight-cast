import { AppShell } from '@/components/app-shell'

export default function InterviewerLoading() {
  return (
    <AppShell title="AIキャストを選ぶ" active="projects" accountLabel="設定" isAdmin={false} contentClassName="max-w-5xl">
      <div aria-busy="true" aria-label="読み込み中" className="animate-pulse space-y-6">
        <div className="h-5 w-48 rounded bg-[var(--bg2)]" />
        <div className="h-[80px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[200px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
