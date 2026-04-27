import { AppShell } from '@/components/app-shell'

export default function ArticleDetailLoading() {
  return (
    <AppShell title="記事素材" active="projects" accountLabel="設定" isAdmin={false}>
      <div aria-busy="true" aria-label="読み込み中" className="animate-pulse space-y-6 max-w-3xl">
        <div className="h-5 w-64 rounded bg-[var(--bg2)]" />
        <div className="h-8 w-48 rounded bg-[var(--bg2)]" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 rounded bg-[var(--bg2)]" style={{ width: i % 3 === 2 ? '70%' : '100%' }} />
          ))}
        </div>
        <div className="h-24 rounded-[var(--r-lg)] bg-[var(--bg2)]" />
      </div>
    </AppShell>
  )
}
