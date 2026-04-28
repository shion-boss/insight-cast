import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'オフライン | Insight Cast',
  robots: { index: false },
}

export default function OfflinePage() {
  return (
    <main id="main-content" className="relative z-10 min-h-[60dvh] flex items-center justify-center px-6 py-24">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="text-5xl select-none">📡</div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[var(--text)]">オフラインです</h1>
          <p className="text-sm text-[var(--text2)] leading-relaxed">
            インターネット接続を確認して、もう一度お試しください。
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          トップページへ
        </Link>
      </div>
    </main>
  )
}
