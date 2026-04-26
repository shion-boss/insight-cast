import Link from 'next/link'
import type { ReactNode } from 'react'

import { EyebrowBadge, getPanelClass } from '@/components/ui'
import { PublicHeader, PublicFooter } from '@/components/public-server-components'

export { PublicHeader, PublicFooter }

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function PublicPageFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PublicHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  compact = false,
  containerClassName,
  asideClassName,
  contentClassName,
}: {
  eyebrow: ReactNode
  title: ReactNode
  description: ReactNode
  actions?: ReactNode
  aside?: ReactNode
  compact?: boolean
  containerClassName?: string
  asideClassName?: string
  contentClassName?: string
}) {
  return (
    <section className={cx(
      'relative z-10 px-6 bg-gradient-to-br from-[#fdf7f0] to-[#f5e8d8]',
      compact ? 'pb-12 pt-12 sm:pb-16 sm:pt-16' : 'pb-16 pt-[108px] sm:pb-[72px]',
    )}>
      <div
        className={cx(
          'mx-auto grid max-w-6xl gap-10',
          !!aside && 'lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start',
          containerClassName,
        )}
      >
        <div className={cx('max-w-3xl', contentClassName)}>
          <EyebrowBadge>{eyebrow}</EyebrowBadge>
          <h1 className="mt-6 text-pretty text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--text)] sm:text-5xl lg:text-[4rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text2)] sm:text-[1.05rem]">
            {description}
          </p>
          {actions && <div className="mt-8">{actions}</div>}
        </div>

        {aside && (
          <div className={cx(getPanelClass('rounded-[var(--r-xl)] p-5'), asideClassName)}>
            {aside}
          </div>
        )}
      </div>
    </section>
  )
}

export function LegalPageTemplate({
  title,
  updatedAt,
  summary,
  children,
}: {
  title: string
  updatedAt: string
  summary: ReactNode
  children: ReactNode
}) {
  return (
    <main className="relative z-10">
        <PublicHero
          compact
          eyebrow={title}
          title={title}
          description={summary}
          aside={
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--text3)] uppercase">Document</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text2)]">
                  サービス利用前に確認しやすいよう、要点を読みやすい形で整理しています。
                </p>
              </div>
              <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.16em] text-[var(--text3)] uppercase">Last Updated</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">{updatedAt}</p>
              </div>
            </div>
          }
        />

        <section className="relative z-10 px-6 pb-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-28 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--text3)] uppercase">Related</p>
                <div className="mt-4 space-y-3 text-sm text-[var(--text2)]">
                  <Link href="/privacy" className="block rounded transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">プライバシーポリシー</Link>
                  <Link href="/terms" className="block rounded transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">利用規約</Link>
                  <Link href="/tokushoho" className="block rounded transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">特定商取引法に基づく表記</Link>
                </div>
              </div>
            </aside>

            <div className="mt-6 rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-10">
              <div className="legal-doc space-y-8">{children}</div>
            </div>
          </div>
        </section>
    </main>
  )
}

