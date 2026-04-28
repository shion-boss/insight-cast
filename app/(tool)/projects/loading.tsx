// layout の AppShell は維持されるのでコンテンツ部分のスケルトンのみ返す
export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-[var(--r)] bg-[var(--border)]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-[var(--r-lg)] bg-[var(--border)]" />
        ))}
      </div>
    </div>
  )
}
