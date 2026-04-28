// layout の AppShell は維持されるのでコンテンツ部分のスケルトンのみ返す
export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-[var(--r)] bg-[var(--border)]" />
      <div className="flex gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-[var(--border)]" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-[var(--r-lg)] bg-[var(--border)]" />
        ))}
      </div>
    </div>
  )
}
