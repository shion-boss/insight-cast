import Link from 'next/link'
import type { ReactNode } from 'react'

import { EyebrowBadge, HeaderSurface, getButtonClass, getPanelClass } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

const NAV_LINKS = [
  { href: '/service', label: 'サービス' },
  { href: '/pricing', label: '料金' },
  { href: '/cast', label: 'キャスト' },
  { href: '/blog', label: 'ブログ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'お問い合わせ' },
]

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
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--text)] sm:text-5xl lg:text-[4rem]">
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

            <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-10">
              <div className="legal-doc space-y-8">{children}</div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}

export async function PublicHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = Boolean(user)
  return (
    <HeaderSurface
      bottom={(
        <nav className="flex gap-2 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="メインナビゲーション">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text2)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/faq"
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text2)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            FAQ
          </Link>
        </nav>
      )}
    >
      <Link
        href="/"
        className="font-serif text-[19px] font-bold text-[var(--text)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        Insight <span className="text-[var(--accent)]">Cast</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        {isLoggedIn ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className={getButtonClass('ghost', 'rounded-full px-4 py-2 text-sm font-medium')}
            >
              ダッシュボード
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className={getButtonClass('secondary', 'rounded-full px-4 py-2 text-sm font-medium')}
              >
                ログアウト
              </button>
            </form>
          </div>
        ) : (
          <>
            <Link
              href="/auth/login"
              className={getButtonClass('ghost', 'rounded-full px-4 py-2 text-sm font-medium')}
            >
              ログイン
            </Link>
            <Link
              href="/auth/signup"
              className={getButtonClass('primary', 'rounded-full px-5 py-2.5 text-sm')}
            >
              無料で試す →
            </Link>
          </>
        )}
      </div>
    </HeaderSurface>
  )
}

export async function PublicFooter({ showPromo = true }: { showPromo?: boolean }) {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = Boolean(user)
  } catch { /* ignore */ }
  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--bg2)]">
      {showPromo && (
        <div className="bg-[var(--accent)] px-6 py-[88px] text-center text-white">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-serif text-[clamp(24px,3vw,38px)] font-bold">まずは無料で、取材を体験してみる</h2>
            <p className="mt-4 text-sm leading-8 text-white/85 sm:text-[15px]">
              登録はメールアドレスだけ。3名のキャストが今日から使えます。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-[var(--r-sm)] bg-white px-7 py-3.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[#f7f1ea]"
              >
                無料で取材を始める →
              </Link>
              <Link
                href="/cast"
                className="inline-flex items-center justify-center rounded-[var(--r-sm)] border border-white/35 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                キャストを見る
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:gap-12">
          <div>
            <p className="font-serif text-base font-bold text-[var(--text2)]">Insight Cast</p>
            <p className="mt-2 text-xs text-[var(--text3)] max-w-[200px] leading-relaxed">AIキャストによる取材で、<br />あなたのHPを継続的に育てます。</p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { heading: 'サービス', links: [{ href: '/service', label: 'サービス内容' }, { href: '/pricing', label: '料金プラン' }, { href: '/cast', label: 'キャスト紹介' }] },
              { heading: '情報', links: [{ href: '/blog', label: 'ブログ' }, { href: '/about', label: 'Insight Castについて' }, { href: '/faq', label: 'よくある質問' }] },
              { heading: 'サポート', links: [{ href: '/contact', label: 'お問い合わせ' }, { href: '/privacy', label: 'プライバシーポリシー' }, { href: '/terms', label: '利用規約' }] },
              { heading: 'アカウント', links: isLoggedIn ? [{ href: '/dashboard', label: 'ダッシュボード' }, { href: '/settings', label: '設定' }, { href: '/tokushoho', label: '特定商取引法に基づく表記' }] : [{ href: '/auth/signup', label: '無料で始める' }, { href: '/auth/login', label: 'ログイン' }, { href: '/tokushoho', label: '特定商取引法に基づく表記' }] },
            ].map((col) => (
              <div key={col.heading}>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--text3)] mb-3">{col.heading}</p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-xs text-[var(--text2)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <p className="text-xs text-[var(--text3)]">© 2026 Insight Cast</p>
        </div>
      </div>
    </footer>
  )
}
