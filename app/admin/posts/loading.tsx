export default function AdminPostsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded bg-[var(--bg2)]" />
        <div className="h-10 w-28 rounded-[var(--r-sm)] bg-[var(--bg2)]" />
      </div>

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] bg-[var(--bg2)] px-5 py-3">
          <div className="h-3 w-48 rounded bg-[var(--border2)]" />
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[var(--border)] px-5 py-4 last:border-0">
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-[var(--bg2)]" />
              <div className="h-3 w-1/4 rounded bg-[var(--bg2)]" />
            </div>
            <div className="h-5 w-12 rounded-full bg-[var(--bg2)]" />
            <div className="h-8 w-12 rounded-[var(--r-sm)] bg-[var(--bg2)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
