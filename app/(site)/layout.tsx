import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PublicHeader, PublicFooter } from '@/components/public-server-components'

// Override the root template — site pages set their own full title e.g. "About | Insight Cast"
export const metadata: Metadata = {
  title: { template: '%s', default: 'Insight Cast' },
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-[var(--r-sm)] focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
      >
        メインコンテンツへスキップ
      </a>
      <PublicHeader />
      <div id="main-content">
        {children}
      </div>
      <PublicFooter />
    </div>
  )
}
