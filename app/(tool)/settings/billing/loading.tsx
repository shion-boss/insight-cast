export default function Loading() {
  return (
    <div className="max-w-2xl animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-[var(--r)] bg-[var(--border)]" />
      <div className="h-40 rounded-[var(--r-lg)] bg-[var(--border)]" />
    </div>
  )
}
