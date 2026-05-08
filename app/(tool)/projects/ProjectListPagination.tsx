'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getButtonClass } from '@/components/ui'

export function ProjectListPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  if (totalPages <= 1) return null

  const goTo = (target: number) => {
    if (target < 1 || target > totalPages) return
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (target === 1) {
      params.delete('page')
    } else {
      params.set('page', String(target))
    }
    const query = params.toString()
    router.push(query ? `?${query}` : '?', { scroll: false })
  }

  return (
    <div className="mt-8 flex items-center justify-between rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[13px] text-[var(--text2)]">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className={getButtonClass('secondary', 'px-3 py-1.5 text-[13px]')}
      >
        <span aria-hidden="true">←</span> 前へ
      </button>
      <span>{page} / {totalPages}</span>
      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className={getButtonClass('secondary', 'px-3 py-1.5 text-[13px]')}
      >
        次へ <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}
