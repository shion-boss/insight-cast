'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-5xl mb-6" aria-hidden="true">🐾</p>
        <h1 className="text-xl font-bold text-[var(--text)] mb-3">
          うまく表示できませんでした
        </h1>
        <p className="text-sm text-[var(--text2)] mb-8 leading-relaxed">
          一時的な問題が起きています。ページを再読み込みしてもう一度お試しください。
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-block rounded-xl bg-[var(--accent)] text-white px-6 py-3 text-sm font-semibold hover:bg-[var(--accent-h)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          もう一度試す
        </button>
      </div>
    </div>
  )
}
