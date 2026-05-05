import Link from 'next/link'

import { CheckoutButton } from '@/app/(site)/pricing/CheckoutButton'

import { LimitedCastBanner } from '../LimitedCastBanner'

const FREE_TRIAL_FEATURES = ['取材回数：2回まで（単発）', 'フリーキャスト 3名', 'プロジェクト登録：1件', '取材メモ・記事を受け取れる'] as const

const PAID_PLANS = [
  {
    id: 'lightning',
    name: 'ライト',
    price: '¥1,980',
    period: '/ 月',
    desc: '月5回から、HPを育てはじめる',
    features: ['取材 5回 / 月', '記事作成 月20回まで', 'プロジェクト 1件', '自社HP調査', '通常サポート'],
    cta: 'ライトプランで始める',
    highlight: false,
  },
  {
    id: 'personal',
    name: '個人向け',
    price: '¥4,980',
    period: '/ 月',
    desc: '週1〜2本ペースでHPを育てたい方へ',
    features: ['取材回数：月15回まで', '記事作成 月60回まで', 'フリーキャスト 3名', 'プロジェクト登録：1件', '競合調査：3社', '取材メモ・記事を受け取れる', '専門キャスト（期間限定で込み）'],
    cta: '月額プランを始める',
    highlight: true,
  },
  {
    id: 'business',
    name: '法人向け',
    price: '¥14,800',
    period: '/ 月',
    desc: '複数のプロジェクトや担当者でHPを強化したい方へ',
    features: ['取材回数：月60回まで', '記事作成 月240回まで', 'フリーキャスト 3名', 'プロジェクト登録：最大3件', '競合調査：各プロジェクト3社', '取材メモ・記事を受け取れる', '専門キャスト（期間限定で込み）', '優先サポート'],
    cta: '月額プランを始める',
    highlight: false,
  },
] as const

export type PricingPriceIds = {
  lightning: string
  personal: string
  business: string
}

export function PricingPreview({ isLoggedIn, priceIds }: { isLoggedIn: boolean; priceIds: PricingPriceIds }) {
  return (
    <section className="py-14 sm:py-[88px]">
      <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Pricing</div>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
          まず無料で体験してください。<br />2回まで、カード不要で使えます。
        </h2>
        <p className="text-base text-[var(--text2)] mt-3 max-w-[480px]">使いやすいかどうかは、使ってみないと分かりません。カード不要、メールアドレスだけで今すぐ始められます。</p>
        {/* お試し — プランではなく独立した体験導線 */}
        <div className="mt-11 rounded-[22px] border border-[var(--border)] bg-[var(--accent-l)] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1">
              <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--accent)] mb-2">お試し — 無料・カード不要</div>
              <div className="font-[family-name:var(--font-noto-serif-jp)] text-[28px] font-bold text-[var(--text)] leading-none mb-1">¥0</div>
              <div className="text-sm text-[var(--text2)] mb-5">まず体験してから、続けるか決めてください。</div>
              <ul className="flex flex-wrap gap-x-6 gap-y-1.5">
                {FREE_TRIAL_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-[var(--text2)]">
                    <span aria-hidden="true" className="text-[11px] font-bold text-[var(--teal)]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:flex-shrink-0">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-block text-center rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] transition-colors"
                >
                  ダッシュボードへ
                </Link>
              ) : (
                <Link
                  href="/auth/signup"
                  className="inline-block text-center rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] transition-colors"
                >
                  無料で始める
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 月額プラン */}
        <div className="mt-10 flex items-center gap-4">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[12px] font-semibold text-[var(--text3)] tracking-[0.08em]">続けて使うなら、月額プランへ</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {PAID_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[22px] border p-8 flex flex-col ${plan.highlight ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_20px_56px_rgba(0,0,0,.13)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}
            >
              <div className={`text-[11px] font-semibold tracking-[0.12em] uppercase mb-3 ${plan.highlight ? 'text-white/70' : 'text-[var(--accent)]'}`}>{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`font-[family-name:var(--font-noto-serif-jp)] text-[36px] font-bold leading-none ${plan.highlight ? 'text-white' : 'text-[var(--text)]'}`}>{plan.price}</span>
                <span className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-[var(--text2)]'}`}>{plan.period}</span>
              </div>
              <div className={`text-[13px] mb-6 ${plan.highlight ? 'text-white/80' : 'text-[var(--text2)]'}`}>{plan.desc}</div>
              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-[13px] leading-[1.6] ${plan.highlight ? 'text-white/90' : 'text-[var(--text2)]'}`}>
                    <span aria-hidden="true" className={`mt-[3px] flex-shrink-0 text-[11px] font-bold ${plan.highlight ? 'text-white' : 'text-[var(--teal)]'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {isLoggedIn ? (
                <CheckoutButton
                  priceId={
                    plan.id === 'lightning' ? priceIds.lightning
                    : plan.id === 'personal' ? priceIds.personal
                    : priceIds.business
                  }
                  label={plan.cta}
                  featured={plan.highlight}
                />
              ) : (
                <Link
                  href={`/auth/login?next=${encodeURIComponent(`/api/stripe/checkout-redirect?plan=${plan.id}`)}`}
                  className={`text-center rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold transition-colors ${plan.highlight ? 'bg-white text-[var(--accent)] hover:bg-white/90' : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'}`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
        <p className="text-center mt-6 text-[12px] text-[var(--text3)]">
          料金の詳細は
          <Link href="/pricing" className="text-[var(--accent)] underline underline-offset-2 mx-1 rounded">料金ページ</Link>
          をご覧ください。
        </p>

        {/* 期間限定キャストの訴求バナー */}
        <div className="mt-12 sm:mt-16">
          <LimitedCastBanner />
        </div>
      </div>
    </section>
  )
}
