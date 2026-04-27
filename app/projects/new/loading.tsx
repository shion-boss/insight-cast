import { AppShell } from '@/components/app-shell'

export default function NewProjectLoading() {
  return (
    <AppShell title="取材先を登録" active="projects" accountLabel="設定" isAdmin={false}>
      <div className="max-w-2xl animate-pulse space-y-6">
        <div className="h-[64px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        <div className="h-[72px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        <div className="h-[200px] rounded-[var(--r-xl)] bg-[var(--bg2)]" />
        <div className="h-[160px] rounded-[var(--r-xl)] bg-[var(--bg2)]" />
        <div className="h-12 rounded-[var(--r-sm)] bg-[var(--bg2)]" />
      </div>
    </AppShell>
  )
}
