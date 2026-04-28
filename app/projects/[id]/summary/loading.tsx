import { AppShell } from '@/components/app-shell'

export default function SummaryLoading() {
  return (
    <AppShell title="取材メモ" active="interviews" accountLabel="設定" isAdmin={false}>
      <div aria-busy="true" aria-label="読み込み中" className="animate-pulse space-y-6">
        <div className="h-5 w-40 rounded bg-[var(--bg2)]" />
        <div className="h-[160px] rounded-[var(--r-xl)] bg-[var(--bg2)]" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[60px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
