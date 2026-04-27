export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="animate-pulse space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded bg-[var(--bg2)]" />
          <div className="h-4 w-56 rounded bg-[var(--bg2)]" />
        </div>
        <div className="h-10 w-28 rounded-[var(--r-sm)] bg-[var(--bg2)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[88px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[88px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        ))}
      </div>

      <div className="h-[280px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
    </div>
  )
}
