import { AppShell } from '@/components/app-shell'

export default function ArticleGenerationLoading() {
  return (
    <AppShell title="記事素材を作る" active="projects" accountLabel="設定" isAdmin={false}>
      <div aria-busy="true" aria-label="読み込み中" className="animate-pulse space-y-6">
        <div className="h-5 w-40 rounded bg-[var(--bg2)]" />
        <div className="h-[200px] rounded-[var(--r-xl)] bg-[var(--bg2)]" />
        <div className="h-[120px] rounded-[var(--r-xl)] bg-[var(--bg2)]" />
      </div>
    </AppShell>
  )
}
