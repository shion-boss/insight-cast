import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: 'Insight Cast',
    template: '%s | Insight Cast',
  },
  robots: { index: false, follow: false },
}

export default function InterviewsLayout({ children }: { children: ReactNode }) {
  return children
}
