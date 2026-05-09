import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PublicHeader, PublicFooter } from '@/components/public-server-components'

// 子ページは画面名だけを title にし、" | Insight Cast" は template が付ける。
// 例: title: '料金プラン' → '料金プラン | Insight Cast'
// title 内にブランド名を含めたいページは title: { absolute: '...' } を使う。
export const metadata: Metadata = {
  title: { template: '%s | Insight Cast', default: 'Insight Cast' },
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  )
}
