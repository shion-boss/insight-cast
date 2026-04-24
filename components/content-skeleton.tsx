export function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-1/3 animate-pulse rounded-lg bg-[var(--border)]" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--border)]" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--border)]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-[var(--r-xl)] bg-[var(--border)]" />
        ))}
      </div>
    </div>
  )
}
