export function ContentSkeleton() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-[var(--border)]" />
          <div className="h-4 w-32 rounded bg-[var(--border)]" />
        </div>
      </div>
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] bg-[var(--bg2)] px-5 py-3">
          <div className="flex gap-8">
            <div className="h-3 w-16 rounded bg-[var(--border)]" />
            <div className="h-3 w-16 rounded bg-[var(--border)]" />
            <div className="h-3 w-16 rounded bg-[var(--border)]" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[var(--border)] px-5 py-4 last:border-0">
            <div className="h-4 flex-1 rounded bg-[var(--border)]" />
            <div className="h-4 w-20 rounded bg-[var(--border)]" />
            <div className="h-4 w-16 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
