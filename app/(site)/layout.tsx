import type { ReactNode } from 'react'
import { PublicHeader, PublicFooter } from '@/components/public-server-components'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  )
}
