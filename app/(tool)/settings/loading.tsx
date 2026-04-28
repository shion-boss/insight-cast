// layout の AppShell は維持されるのでコンテンツ部分のスケルトンのみ返す
export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-[var(--r-sm)] bg-[var(--border)]" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-32 rounded-[var(--r-lg)] bg-[var(--border)]" />
          <div className="h-32 rounded-[var(--r-lg)] bg-[var(--border)]" />
        </div>
      </div>
    </div>
  )
}
