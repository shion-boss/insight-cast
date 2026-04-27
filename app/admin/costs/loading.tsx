export default function AdminCostsLoading() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="animate-pulse space-y-6">
      <div className="h-7 w-28 rounded bg-[var(--bg2)]" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[96px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
        ))}
      </div>

      <div className="h-[200px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
      <div className="h-[240px] rounded-[var(--r-lg)] bg-[var(--bg2)]" />
    </div>
  )
}
