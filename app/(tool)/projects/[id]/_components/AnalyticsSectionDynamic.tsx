'use client'

import dynamic from 'next/dynamic'
import type { HeatmapEntry, MonthlyPoint } from '@/app/(tool)/dashboard/_components/analytics-section'

const AnalyticsSectionInner = dynamic(
  () => import('@/app/(tool)/dashboard/_components/analytics-section').then((m) => ({ default: m.AnalyticsSection })),
  {
    ssr: true,
    loading: () => (
      <div className="mb-6 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-[var(--border)] mb-4" />
        <div className="h-24 w-full rounded bg-[var(--border)] mb-4" />
        <div className="h-16 w-full rounded bg-[var(--border)]" />
      </div>
    ),
  },
)

export function AnalyticsSectionDynamic(props: {
  monthlyArticles: MonthlyPoint[]
  heatmapData: HeatmapEntry[]
  continuityScore: number
  nextProjectId: string | null
  canEdit?: boolean
}) {
  return <AnalyticsSectionInner {...props} />
}
