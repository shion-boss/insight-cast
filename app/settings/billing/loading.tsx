import { AppShell } from '@/components/app-shell'

export default function BillingLoading() {
  return (
    <AppShell title="ご利用プラン" active="settings" accountLabel="設定" isAdmin={false}>
      <div className="animate-pulse space-y-6">
        <div className="h-[72px] w-64 rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3 rounded-[var(--r-lg)] border border-[var(--border)] p-5">
            <div className="h-5 w-28 rounded bg-[var(--bg2)]" />
            <div className="h-10 rounded bg-[var(--bg2)]" />
          </div>
        ))}
      </div>
    </AppShell>
  )
}
