import { AppShell } from '@/components/app-shell'

export default function ArticlesLoading() {
  return (
    <AppShell title="記事一覧" active="projects" accountLabel="設定" isAdmin={false} contentClassName="max-w-5xl">
      <div className="animate-pulse space-y-6">
        <div className="h-5 w-48 rounded bg-[var(--bg2)]" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[80px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
