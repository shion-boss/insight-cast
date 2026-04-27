import { AppShell } from '@/components/app-shell'

export default function InterviewsLoading() {
  return (
    <AppShell title="取材メモ一覧" active="interviews" accountLabel="設定" isAdmin={false}>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 rounded bg-[var(--bg2)]" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[88px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
