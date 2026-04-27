import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PublicHeader, PublicFooter } from '@/components/public-server-components'

// Override the root template — site pages set their own full title e.g. "About | Insight Cast"
export const metadata: Metadata = {
  title: { template: '%s', default: 'Insight Cast' },
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <PublicHeader />
      <main id="main-content">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
