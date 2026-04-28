// layout の AppShell は維持されるのでコンテンツ部分のスケルトンのみ返す
export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-[var(--r)] bg-[var(--border)]" />
      <div className="h-40 rounded-[var(--r-lg)] bg-[var(--border)]" />
    </div>
  )
}
