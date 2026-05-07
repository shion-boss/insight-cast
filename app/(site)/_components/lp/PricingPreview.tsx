'use client'

import Link from 'next/link'

import { CheckoutButton } from '@/app/(site)/pricing/CheckoutButton'
import { useIsLoggedIn } from '@/lib/auth-state'

import { LimitedCastBanner } from '../LimitedCastBanner'

const FREE_TRIAL_FEATURES = ['取材回数：2回まで（単発）', 'フリーキャスト 3名', 'プロジェクト登録：1件', '取材メモ・記事を受け取れる'] as const

// /pricing 側の PLANS と同じデータ形に揃える（price は数値、features は {ok, label}）
const PAID_PLANS = [
  {
    id: 'lightning',
    name: 'ライト',
    price: 1980,
    note: 'クレジットカードで簡単お申し込み',
    catch: 'まず月に数回、試しながら続けたい方へ',
    featured: false,
    features: [
      { ok: true,  label: '取材回数：月5回まで' },
      { ok: true,  label: '記事作成：月20回まで' },
      { ok: true,  label: 'フリーキャスト 3名' },
      { ok: true,  label: 'プロジェクト登録：1件' },
      { ok: true,  label: '自社HP調査あり' },
      { ok: false, label: '競合調査なし' },
      { ok: true,  label: '取材メモを受け取れる' },
    ],
    cta: 'ライトプランで始める',
  },
  {
    id: 'personal',
    name: '個人向け',
    price: 4980,
    note: 'クレジットカードで簡単お申し込み',
    catch: '週1〜2本のペースで、ホームページをコツコツ育てたい方へ',
    featured: true,
    features: [
      { ok: true,  label: '取材回数：月15回まで' },
      { ok: true,  label: '記事作成：月60回まで' },
      { ok: true,  label: 'フリーキャスト 3名' },
      { ok: true,  label: 'プロジェクト登録：1件' },
      { ok: true,  label: '自社HP調査あり' },
      { ok: true,  label: '競合調査：3件' },
      { ok: true,  label: '取材メモを受け取れる' },
    ],
    cta: '月額プランを始める',
  },
  {
    id: 'business',
    name: '法人向け',
    price: 14800,
    note: 'クレジットカードで簡単お申し込み',
    catch: '複数の事業・担当者でまとめて運用したい方へ',
    featured: false,
    features: [
      { ok: true, label: '取材回数：月60回まで' },
      { ok: true, label: '記事作成：月240回まで' },
      { ok: true, label: 'フリーキャスト 3名' },
      { ok: true, label: 'プロジェクト登録：最大3件' },
      { ok: true, label: '自社HP調査あり' },
      { ok: true, label: '競合調査：各プロジェクト3件' },
      { ok: true, label: '取材メモを受け取れる' },
      { ok: true, label: '取材依頼リンクあり' },
      { ok: true, label: '優先サポート' },
    ],
    cta: '月額プランを始める',
  },
] as const

export type PricingPriceIds = {
  lightning: string
  personal: string
  business: string
}

export function PricingPreview({ priceIds }: { priceIds: PricingPriceIds }) {
  const isLoggedIn = useIsLoggedIn() === true
  return (
    <section className="cv-auto-section py-14 sm:py-[88px]">
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
              <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--on-primary-container)] mb-2">お試し — 無料・カード不要</div>
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
                  prefetch={false}
                  className="inline-block text-center rounded-full px-8 py-3.5 text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] transition-colors"
                >
                  ダッシュボードへ
                </Link>
              ) : (
                <Link
                  href="/auth/signup"
                  prefetch={false}
                  className="inline-block text-center rounded-full px-8 py-3.5 text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] transition-colors"
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
          <span className="text-[12px] font-semibold text-[var(--text2)] tracking-[0.08em]">続けて使うなら、月額プランへ</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PAID_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-[var(--surface)] rounded-[24px] p-6 sm:p-9 ${
                plan.featured
                  ? 'border-[1.5px] border-[var(--accent)] shadow-[0_0_0_2px_var(--accent)]'
                  : 'border-[1.5px] border-[var(--border)]'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[11px] font-bold px-4 py-1 rounded-md tracking-[.06em] whitespace-nowrap">
                  <span aria-hidden="true">✦ </span>おすすめ
                </div>
              )}
              <div className="font-[family-name:var(--font-noto-serif-jp)] text-sm font-bold text-[var(--text2)] tracking-[.1em] mb-1">{plan.name}</div>
              <div className="text-[12px] text-[var(--text2)] mb-4 leading-[1.6]">{plan.catch}</div>
              <div className="font-[family-name:var(--font-noto-serif-jp)] text-[44px] font-bold text-[var(--text)] leading-none mb-1">
                <sup className="text-[22px] align-super font-sans">¥</sup>{plan.price.toLocaleString()}<sub className="text-base text-[var(--text2)] font-sans font-normal">/月</sub>
              </div>
              <div className="text-[13px] text-[var(--text2)] mb-6 pb-6 border-b border-[var(--border)]">{plan.note}</div>
              <div className="flex flex-col flex-1 mb-7">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-baseline gap-2.5 text-sm py-2.5 border-b border-[var(--border)] last:border-b-0 text-[var(--text2)]">
                    <span aria-hidden="true" className={`flex-shrink-0 font-bold ${feat.ok ? 'text-[var(--teal)]' : 'text-[var(--text2)]'}`}>
                      {feat.ok ? '✓' : '–'}
                    </span>
                    {feat.label}
                  </div>
                ))}
              </div>
              {isLoggedIn ? (
                <CheckoutButton
                  priceId={
                    plan.id === 'lightning' ? priceIds.lightning
                    : plan.id === 'personal' ? priceIds.personal
                    : priceIds.business
                  }
                  label={plan.cta}
                  featured={plan.featured}
                />
              ) : (
                <Link
                  href={`/auth/login?next=${encodeURIComponent(`/api/stripe/checkout-redirect?plan=${plan.id}`)}`}
                  prefetch={false}
                  className="text-center rounded-full px-6 py-3 text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] transition-colors"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
        <p className="text-center mt-6 text-[12px] text-[var(--text2)]">
          料金の詳細は
          <Link href="/pricing" className="text-[var(--on-primary-container)] underline underline-offset-2 mx-1 rounded">料金ページ</Link>
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
