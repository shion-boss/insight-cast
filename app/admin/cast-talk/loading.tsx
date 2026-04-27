export default function AdminCastTalkLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded bg-[var(--bg2)]" />
      </div>

      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="h-4 w-40 rounded bg-[var(--bg2)] mb-4" />
        <div className="flex gap-3">
          <div className="flex-1 h-11 rounded-[var(--r-sm)] bg-[var(--bg2)]" />
          <div className="h-11 w-24 rounded-[var(--r-sm)] bg-[var(--bg2)]" />
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-[var(--bg2)]" />
              <div className="h-3 w-1/3 rounded bg-[var(--bg2)]" />
            </div>
            <div className="h-6 w-14 rounded-full bg-[var(--bg2)]" />
            <div className="h-8 w-20 rounded-[var(--r-sm)] bg-[var(--bg2)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
