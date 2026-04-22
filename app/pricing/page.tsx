import type { Metadata } from 'next'
import Link from 'next/link'

import { CharacterAvatar } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'
import { PublicHeader, PublicFooter, PublicPageFrame } from '@/components/public-layout'
import { createClient } from '@/lib/supabase/server'
import { CheckoutButton } from './CheckoutButton'

export const metadata: Metadata = {
  title: '料金プラン | Insight Cast',
  description: '現在は無料で体験でき、個人向け・法人向けの課金機能は準備中です。',
}

const paidCharacters = CHARACTERS.filter((c) => !c.available)

const PLANS = [
  {
    id: 'free',
    name: 'お試し',
    price: 0,
    note: 'クレジットカード不要',
    catch: 'まず体験してみてください',
    featured: false,
    features: [
      { ok: true, label: '取材回数：月2回まで' },
      { ok: true, label: 'フリーキャスト 3名' },
      { ok: true, label: '取材先登録：1件' },
      { ok: true, label: '競合調査：1社' },
      { ok: true, label: '取材メモ生成' },
      { ok: true, label: '記事素材生成' },
      { ok: true, label: '追加キャスト：準備中' },
      { ok: false, label: '優先サポート' },
    ],
    cta: '無料で始める',
    href: '/auth/signup',
  },
  {
    id: 'personal',
    name: '個人向け',
    price: 4980,
    note: 'クレジットカードで簡単お申し込み',
    catch: '週1〜2本ペースでHPを育てたい方へ',
    featured: true,
    features: [
      { ok: true, label: '取材回数：月10回まで' },
      { ok: true, label: 'フリーキャスト 3名' },
      { ok: true, label: '取材先登録：1件' },
      { ok: true, label: '競合調査：3社' },
      { ok: true, label: '取材メモ生成' },
      { ok: true, label: '記事素材生成' },
      { ok: true, label: '追加キャスト：準備中' },
      { ok: false, label: '優先サポート' },
    ],
    cta: '申し込む',
    href: '/auth/signup',
  },
  {
    id: 'business',
    name: '法人向け',
    price: 14800,
    note: 'クレジットカードで簡単お申し込み',
    catch: '複数の取材先や担当者でHPを強化したい方へ',
    featured: false,
    features: [
      { ok: true, label: '取材回数：月20回まで' },
      { ok: true, label: 'フリーキャスト 3名' },
      { ok: true, label: '取材先登録：最大3件' },
      { ok: true, label: '競合調査：各取材先3社' },
      { ok: true, label: '取材メモ生成' },
      { ok: true, label: '記事素材生成' },
      { ok: true, label: '追加キャスト：準備中' },
      { ok: true, label: '優先サポート' },
    ],
    cta: '申し込む',
    href: '/auth/signup',
  },
] as const

const TABLE_ROWS = [
  { label: '取材回数（月）', free: '2回', personal: '10回', business: '20回' },
  { label: 'フリーキャスト', free: '3名', personal: '3名', business: '3名' },
  { label: '取材先登録', free: '1件', personal: '1件', business: '最大3件' },
  { label: '競合調査', free: '1社', personal: '3社', business: '各取材先3社' },
  { label: '取材メモ生成', free: '○', personal: '○', business: '○' },
  { label: '記事素材生成', free: '○', personal: '○', business: '○' },
  { label: '追加キャスト', free: '準備中', personal: '準備中', business: '準備中' },
  { label: '優先サポート', free: '—', personal: '—', business: '○' },
] as const

const ADDON_CASTS = [
  {
    id: 'hal',
    name: 'ハル（コーギー）',
    specialty: 'Story & People — 人柄・ストーリー・写真起点',
    price: '¥14,800',
  },
  {
    id: 'mogro',
    name: 'モグロ（もぐら）',
    specialty: 'Yes/No Deep Dive — はい/いいえで深掘り',
    price: '¥9,800',
  },
  {
    id: 'cocco',
    name: 'コッコ（にわとり）',
    specialty: 'Promotion & Campaign — 宣伝・イベント告知',
    price: '¥9,800',
  },
] as const

const SELECTION_GUIDE = [
  { plan: 'お試し', desc: 'まずどんなサービスか確かめたい方' },
  { plan: '個人向け', desc: '1人や家族経営で、月に数回HPを更新したい方' },
  { plan: '法人向け', desc: '複数の取材先をまとめて運用したい方' },
] as const

const FAQS = [
  { q: '無料プランにクレジットカードは必要ですか？', a: '不要です。メールアドレスのみで登録できます。' },
  { q: '追加キャストはどのプランで使えますか？', a: '追加キャストは現在準備中です。正式提供後は、お試し・個人向け・法人向けの各プランで使える形を予定しています。' },
  { q: '個人向けと法人向けの違いは何ですか？', a: '個人向けは1人や家族経営で運営されている方向け、法人向けは複数のスタッフや店舗でまとめてご利用になりたい方向けです。法人向けでは最大3件の取材先を登録でき、優先サポートが付きます。' },
  { q: 'プランはいつでも変更できますか？', a: 'マイページの「プラン・請求」からいつでも変更・解約できます。' },
  { q: '解約するとデータはどうなりますか？', a: '解約後もデータは保持されます。再契約時にそのままご利用いただけます。' },
] as const

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isLoggedIn = Boolean(user)

  const priceIds = {
    personal: process.env.STRIPE_PRICE_ID_PERSONAL ?? '',
    business: process.env.STRIPE_PRICE_ID_BUSINESS ?? '',
  }

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] py-[88px] text-center">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Pricing</div>
            <h1 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(28px,3.5vw,44px)' }}>
              まず無料で試せます
            </h1>
            <p className="mx-auto mt-4 max-w-[480px] text-base text-[var(--text2)] leading-relaxed">
              AIキャストによる取材を無料で体験できます。続けたい方向けに、月額プランをご用意しています。
            </p>
          </div>
        </section>

        {/* Selection Guide */}
        <section className="py-[56px] bg-[var(--bg)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[13px] font-semibold text-[var(--text2)] mb-5">どれを選べばいいか迷ったら</div>
            <div className="grid gap-4 md:grid-cols-3">
              {SELECTION_GUIDE.map((item) => (
                <div key={item.plan} className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-4 flex gap-3 items-start">
                  <span className="text-[var(--accent)] font-bold text-sm flex-shrink-0 mt-0.5">→</span>
                  <div>
                    <span className="font-bold text-sm text-[var(--text)]">{item.plan}</span>
                    <span className="text-sm text-[var(--text2)] ml-2">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Plan cards */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="mt-0 grid gap-6 lg:grid-cols-3 lg:items-start">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative flex flex-col bg-[var(--surface)] rounded-[24px] p-9 ${
                    plan.featured
                      ? 'border-[1.5px] border-[var(--accent)] shadow-[0_0_0_2px_var(--accent)]'
                      : 'border-[1.5px] border-[var(--border)]'
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[11px] font-bold px-4 py-1 rounded-full tracking-[.06em] whitespace-nowrap">
                      ✦ おすすめ
                    </div>
                  )}
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-sm font-bold text-[var(--text2)] tracking-[.1em] mb-1">{plan.name}</div>
                  <div className="text-[12px] text-[var(--text3)] mb-4 leading-[1.6]">{plan.catch}</div>
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-[44px] font-bold text-[var(--text)] leading-none mb-1">
                    {plan.price === 0
                      ? <span className="text-[28px] font-bold">無料</span>
                      : <><sup className="text-[22px] align-super font-sans">¥</sup>{plan.price.toLocaleString()}<sub className="text-base text-[var(--text2)] font-sans font-normal">/月</sub></>
                    }
                  </div>
                  <div className="text-[13px] text-[var(--text3)] mb-6 pb-6 border-b border-[var(--border)]">{plan.note}</div>
                  <div className="flex flex-col flex-1 mb-7">
                    {plan.features.map((feat, i) => (
                      <div key={i} className={`flex items-baseline gap-2.5 text-sm py-2.5 border-b border-[var(--border)] last:border-b-0 ${!feat.ok ? 'text-[var(--text3)]' : 'text-[var(--text2)]'}`}>
                        <span className={`flex-shrink-0 font-bold ${feat.ok ? 'text-[var(--teal)]' : 'text-[var(--text3)]'}`}>
                          {feat.ok ? '✓' : '–'}
                        </span>
                        {feat.label}
                      </div>
                    ))}
                  </div>
                  {plan.id === 'free' ? (
                    <Link
                      href="/auth/signup"
                      className={`w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]`}
                    >
                      {plan.cta}
                    </Link>
                  ) : isLoggedIn ? (
                    <CheckoutButton
                      priceId={plan.id === 'personal' ? priceIds.personal : priceIds.business}
                      label={plan.cta}
                      featured={plan.featured}
                    />
                  ) : (
                    <Link
                      href={`/auth/login?next=${encodeURIComponent(`/api/stripe/checkout-redirect?plan=${plan.id}`)}`}
                      className={`w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center ${
                        plan.featured
                          ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'
                          : 'border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compare Table */}
        <section className="py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Plan Comparison</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              プラン比較表
            </h2>
            <div className="mt-10 overflow-x-auto rounded-[20px] border border-[var(--border)]">
              <table className="min-w-[720px] w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-left border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)] w-[30%]"></th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">お試し</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--accent)] text-white">個人向け</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">法人向け</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row, i) => (
                    <tr key={row.label} className={i < TABLE_ROWS.length - 1 ? '' : ''}>
                      <td className="px-5 py-[13px] text-sm text-left font-medium text-[var(--text)] border-b border-[var(--border)]">{row.label}</td>
                      <td className="px-5 py-[13px] text-sm text-center border-b border-[var(--border)] text-[var(--text2)]">{row.free}</td>
                      <td className="px-5 py-[13px] text-sm text-center border-b border-[var(--border)] bg-[var(--accent-l)] font-semibold text-[var(--text)]">{row.personal}</td>
                      <td className="px-5 py-[13px] text-sm text-center border-b border-[var(--border)] text-[var(--text2)]">{row.business}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Add-on Cast (buyout) */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Add-on Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              専門キャスト（提供予定）
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">追加キャストは現在準備中です。以下は正式提供時の予定価格です。</p>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {paidCharacters.map((char) => {
                const addon = ADDON_CASTS.find((a) => a.id === char.id)
                return (
                  <div key={char.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] p-6 flex gap-3.5">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[var(--border)]">
                      <CharacterAvatar
                        src={char.icon96}
                        alt={`${char.name}のアイコン`}
                        emoji={char.emoji}
                        size={64}
                      />
                    </div>
                    <div>
                      <div className="font-[family-name:var(--font-noto-serif-jp)] text-lg font-bold text-[var(--text)] mb-0.5">{addon?.name ?? char.name}</div>
                      <div className="text-[11px] text-[var(--accent)] font-semibold tracking-[.08em] mb-2">{addon?.specialty ?? char.specialty}</div>
                      <div className="text-[15px] font-bold text-[var(--text)] mt-2">{addon?.price ?? '—'}（買い切り予定）</div>
                      <span className="inline-block mt-2 text-[11px] font-semibold text-[var(--text3)] border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 rounded-full">準備中</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-[88px]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">よくある質問</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              料金についての Q&A
            </h2>
            <div className="mt-10 divide-y divide-[var(--border)] rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {FAQS.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg2)] transition-colors">
                    <span>{faq.q}</span>
                    <span className="text-[var(--text3)] transition-transform group-open:rotate-180 flex-shrink-0">⌄</span>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-[var(--text2)] leading-[1.85]">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 締めのCTA */}
        <section className="py-[88px] bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12 text-center">
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              まず、無料で試してみませんか？
            </h2>
            <p className="mt-4 text-[15px] text-[var(--text2)] leading-relaxed">
              クレジットカード不要。メールアドレスだけで始められます。
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/auth/signup" className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold transition-colors shadow-[0_4px_24px_rgba(0,0,0,.12)]">
                無料で始める →
              </Link>
              <Link href="/contact" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3.5 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                まず相談してみる
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
