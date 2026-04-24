export function PageLoading() {
  return (
    <div className="fixed inset-x-0 top-0 z-[9999]">
      <div
        className="h-[3px] animate-[page-load_1.2s_ease-in-out_infinite]"
        style={{ background: 'var(--accent)' }}
      />
    </div>
  )
}
