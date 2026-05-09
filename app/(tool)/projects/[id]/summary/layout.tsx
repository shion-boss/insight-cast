import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: '取材メモ',
  robots: { index: false, follow: false },
}

export default function SummaryLayout({ children }: { children: ReactNode }) {
  return children
}
