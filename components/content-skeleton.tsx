export function ContentSkeleton() {
  return (
    <div className="h-[2px] overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
      <div className="h-full animate-[page-load_1.2s_ease-in-out_infinite]" style={{ background: 'var(--accent)' }} />
    </div>
  )
}
