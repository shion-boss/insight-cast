import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SiteHeaderClient } from '@/components/site-header-client'

export async function PublicHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <SiteHeaderClient isLoggedIn={Boolean(user)} />
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
            {isLoggedIn ? (
              <>
                <h2 className="font-serif text-[clamp(24px,3vw,38px)] font-bold">取材を続けましょう</h2>
                <p className="mt-4 text-sm leading-8 text-white/85 sm:text-[15px]">
                  ダッシュボードから取材を始められます。
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-[var(--r-sm)] bg-white px-7 py-3.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[#f7f1ea]"
                  >
                    ダッシュボードへ →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-serif text-[clamp(24px,3vw,38px)] font-bold">まず話してみてください。記事の素材は、そこから生まれます。</h2>
                <p className="mt-4 text-sm leading-8 text-white/85 sm:text-[15px]">
                  登録はメールアドレスだけ。3名のキャストが今日から無料で使えます。
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
              </>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:gap-12">
          <div>
            <p className="font-serif text-base font-bold text-[var(--text2)]">Insight Cast</p>
            <p className="mt-2 text-xs text-[var(--text3)] max-w-[200px] leading-relaxed">会話から、記事へ。<br />あなたの当たり前を言葉に。</p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { heading: 'サービス', links: [{ href: '/service', label: 'サービス内容' }, { href: '/pricing', label: '料金プラン' }, { href: '/cast', label: 'キャスト紹介' }] },
              { heading: '情報', links: [{ href: '/blog', label: 'ブログ' }, { href: '/cast-talk', label: 'Cast Talk（対話録）' }, { href: '/about', label: 'Insight Castについて' }, { href: '/philosophy', label: 'AI時代の発信について' }, { href: '/faq', label: 'よくある質問' }] },
              { heading: 'サポート', links: [{ href: '/contact', label: 'お問い合わせ' }, { href: '/privacy', label: 'プライバシーポリシー' }, { href: '/terms', label: '利用規約' }] },
              {
                heading: 'アカウント',
                links: isLoggedIn
                  ? [{ href: '/dashboard', label: 'ダッシュボード' }, { href: '/settings', label: '設定' }, { href: '/tokushoho', label: '特定商取引法に基づく表記' }]
                  : [{ href: '/auth/signup', label: '無料で始める' }, { href: '/auth/login', label: 'ログイン' }, { href: '/tokushoho', label: '特定商取引法に基づく表記' }],
              },
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
