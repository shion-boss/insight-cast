import Link from 'next/link'
import type { ReactNode } from 'react'

import { CharacterAvatar, EyebrowBadge, HeaderSurface, SiteBrand, getButtonClass } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'

const NAV_LINKS = [
  { href: '/service', label: 'サービス' },
  { href: '/cast', label: 'キャスト' },
  { href: '/pricing', label: '料金' },
  { href: '/blog', label: 'ブログ' },
]

const FOOTER_COL1 = [
  { href: '/service', label: 'サービス' },
  { href: '/cast', label: 'キャスト' },
  { href: '/pricing', label: '料金' },
  { href: '/faq', label: 'FAQ' },
]

const FOOTER_COL2 = [
  { href: '/blog', label: 'ブログ' },
  { href: '/philosophy', label: '発信の考え方' },
  { href: '/about', label: '会社概要' },
]

const FOOTER_COL3 = [
  { href: '/privacy', label: 'プライバシーポリシー' },
  { href: '/terms', label: '利用規約' },
  { href: '/tokushoho', label: '特定商取引法に基づく表記' },
]

const featuredCharacters = CHARACTERS.slice(0, 3)

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
        'relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.2),_transparent_24%),radial-gradient(circle_at_82%_10%,_rgba(15,118,110,0.12),_transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)] text-stone-950',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.48),rgba(255,255,255,0))]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-[-7rem] top-24 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-6rem] top-[22rem] h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" aria-hidden="true" />
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
    <section className={cx('relative z-10 px-6', compact ? 'pb-12 pt-12 sm:pb-16 sm:pt-16' : 'pb-16 pt-14 sm:pb-22 sm:pt-20')}>
      <div
        className={cx(
          'mx-auto grid max-w-6xl gap-10',
          !!aside && 'lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start',
          containerClassName,
        )}
      >
        <div className={cx('max-w-3xl', contentClassName)}>
          <EyebrowBadge>{eyebrow}</EyebrowBadge>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-stone-950 sm:text-5xl lg:text-[4rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-[1.05rem]">
            {description}
          </p>
          {actions && <div className="mt-8">{actions}</div>}
        </div>

        {aside && (
          <div className={cx('rounded-[2rem] border border-stone-300/80 bg-[rgba(255,253,249,0.94)] p-5 shadow-sm backdrop-blur-md', asideClassName)}>
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
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <PublicHero
          compact
          eyebrow={title}
          title={title}
          description={summary}
          aside={
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-stone-400 uppercase">Document</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  サービス利用前に確認しやすいよう、要点を読みやすい形で整理しています。
                </p>
              </div>
              <div className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.16em] text-stone-400 uppercase">Last Updated</p>
                <p className="mt-2 text-sm font-semibold text-stone-900">{updatedAt}</p>
              </div>
            </div>
          }
        />

        <section className="relative z-10 px-6 pb-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-28 rounded-[1.75rem] border border-stone-300/80 bg-[rgba(255,253,249,0.92)] p-5 backdrop-blur-md">
                <p className="text-xs font-semibold tracking-[0.18em] text-stone-400 uppercase">Related</p>
                <div className="mt-4 space-y-3 text-sm text-stone-700">
                  <Link href="/privacy" className="block rounded transition-colors hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">プライバシーポリシー</Link>
                  <Link href="/terms" className="block rounded transition-colors hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">利用規約</Link>
                  <Link href="/tokushoho" className="block rounded transition-colors hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">特定商取引法に基づく表記</Link>
                </div>
              </div>
            </aside>

            <div className="rounded-[2rem] border border-stone-300/80 bg-[rgba(255,253,249,0.94)] p-7 backdrop-blur-md sm:p-10">
              <div className="legal-doc space-y-8">{children}</div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}

export function PublicHeader() {
  return (
    <HeaderSurface
      bottom={(
        <nav className="flex gap-2 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="メインナビゲーション">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={getButtonClass('ghost', 'rounded-full px-4 py-2 text-sm font-medium')}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/faq"
            className={getButtonClass('ghost', 'rounded-full px-4 py-2 text-sm font-medium')}
          >
            FAQ
          </Link>
        </nav>
      )}
    >
      <SiteBrand href="/" />
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/auth/login"
          className={getButtonClass('secondary', 'rounded-full px-4 py-2 text-sm font-medium')}
        >
          ログイン
        </Link>
        <Link
          href="/auth/signup"
          className={getButtonClass('primary', 'rounded-full px-5 py-2.5 text-sm')}
        >
          無料ではじめる
        </Link>
      </div>
    </HeaderSurface>
  )
}

export function PublicFooter() {
  return (
    <footer className="relative border-t border-stone-300/60 bg-[rgba(244,236,223,0.64)] backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-stone-300/70 bg-[rgba(255,253,249,0.94)] p-7 shadow-sm backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="flex -space-x-2 pt-0.5">
                {featuredCharacters.map((char) => (
                  <CharacterAvatar
                    key={char.id}
                    src={char.icon48}
                    alt={`${char.name}のアイコン`}
                    emoji={char.emoji}
                    size={32}
                    className="border-white"
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] text-stone-900 uppercase">Insight Cast</p>
                <p className="mt-1.5 text-sm leading-6 text-stone-600">AI取材で、ホームページにまだ書けていない価値を見つけて、次の更新までつなげます。</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {['一次情報を引き出す', '競合比較で軸を整える', '記事素材までつなげる'].map((item) => (
                <span key={item} className="rounded-full border border-stone-200 bg-stone-50/90 px-3 py-1.5 text-xs font-medium text-stone-600">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-stone-200/80">
              <Link
                href="/auth/signup"
                className={getButtonClass('primary', 'px-5 py-3 text-sm')}
              >
                無料で始める
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: 'Service', links: FOOTER_COL1 },
              { title: 'Company', links: FOOTER_COL2 },
              { title: 'Legal', links: FOOTER_COL3 },
            ].map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold tracking-[0.18em] text-stone-400 uppercase">{group.title}</p>
                <div className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <div key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="rounded-sm text-sm text-stone-600 transition-colors hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                      >
                        {link.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-stone-300/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-stone-400">© 2026 Insight Cast</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/auth/login" className="rounded-sm text-xs text-stone-400 transition-colors hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">
              ログイン
            </Link>
            <Link href="/auth/signup" className="rounded-sm text-xs text-stone-400 transition-colors hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">
              新規登録
            </Link>
            <Link href="mailto:info@insight-cast.jp" className="rounded-sm text-xs text-stone-400 transition-colors hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
