import type { Metadata } from 'next'

import { CharacterAvatar } from '@/components/ui'
import { CHARACTERS, getCharacter } from '@/lib/characters'
import { PublicHero } from '@/components/public-layout'
import { PlanCardCTA, PricingBottomCTA } from './PricingCTAs'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: '料金プラン | Insight Cast',
  description: 'まずカード不要の無料プランで取材を体験できます。会話で記事の素材を作り続けたい方向けに、個人向け（¥4,980/月）・法人向け（¥14,800/月）のプランもご用意しています。',
  alternates: { canonical: `${APP_URL}/pricing` },
  openGraph: {
    title: '料金プラン | Insight Cast',
    description: 'カード不要で無料体験。個人向け ¥4,980/月、法人向け ¥14,800/月。',
    url: `${APP_URL}/pricing`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '料金プラン | Insight Cast',
    description: 'カード不要で無料体験。個人向け ¥4,980/月、法人向け ¥14,800/月。',
  },
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
      { ok: true, label: '取材：2回まで（単発）' },
      { ok: true, label: '記事素材作成：3回まで（単発）' },
      { ok: true, label: 'フリーキャスト 3名' },
      { ok: true, label: '取材先登録：1件' },
      { ok: false, label: '競合調査なし' },
      { ok: true, label: '取材メモを受け取れる' },
      { ok: false, label: '追加キャスト：準備中' },
      { ok: false, label: '優先サポート' },
    ],
    cta: '無料で始める',
    href: '/auth/signup',
  },
  {
    id: 'lightning',
    name: 'ライト',
    price: 1980,
    note: 'クレジットカードで簡単お申し込み',
    catch: '月5回から、HPを育てはじめる',
    featured: false,
    features: [
      { ok: true, label: '取材回数：月5回まで' },
      { ok: true, label: '記事素材作成：月20回まで' },
      { ok: true, label: 'フリーキャスト 3名' },
      { ok: true, label: '取材先登録：1件' },
      { ok: true, label: '自社HP調査あり' },
      { ok: false, label: '競合調査なし' },
      { ok: true, label: '取材メモを受け取れる' },
      { ok: false, label: '追加キャスト：準備中' },
      { ok: false, label: '優先サポート' },
    ],
    cta: 'ライトプランで始める',
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
      { ok: true, label: '取材回数：月15回まで' },
      { ok: true, label: '記事素材作成：月60回まで' },
      { ok: true, label: 'フリーキャスト 3名' },
      { ok: true, label: '取材先登録：1件' },
      { ok: true, label: '競合調査：3社' },
      { ok: true, label: '取材メモを受け取れる' },
      { ok: false, label: '追加キャスト：準備中' },
      { ok: false, label: '優先サポート' },
    ],
    cta: '月額プランを始める',
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
      { ok: true, label: '取材回数：月60回まで' },
      { ok: true, label: '記事素材作成：月240回まで' },
      { ok: true, label: 'フリーキャスト 3名' },
      { ok: true, label: '取材先登録：最大3件' },
      { ok: true, label: '競合調査：各取材先3社' },
      { ok: true, label: '取材メモを受け取れる' },
      { ok: false, label: '追加キャスト：準備中' },
      { ok: true, label: '優先サポート' },
    ],
    cta: '月額プランを始める',
    href: '/auth/signup',
  },
] as const

const TABLE_ROWS = [
  { label: '取材回数', free: '2回（単発）', lightning: '月5回', personal: '月15回', business: '月60回' },
  { label: '記事素材作成', free: '3回（単発）', lightning: '月20回', personal: '月60回', business: '月240回' },
  { label: 'フリーキャスト', free: '3名', lightning: '3名', personal: '3名', business: '3名' },
  { label: '取材先登録', free: '1件', lightning: '1件', personal: '1件', business: '最大3件' },
  { label: '自社HP調査', free: 'なし', lightning: 'あり', personal: 'あり', business: 'あり' },
  { label: '競合調査', free: 'なし', lightning: 'なし', personal: '3社', business: '各取材先3社' },
  { label: '取材メモを受け取れる', free: 'あり', lightning: 'あり', personal: 'あり', business: 'あり' },
  { label: '追加キャスト', free: '準備中', lightning: '準備中', personal: '準備中', business: '準備中' },
  { label: '優先サポート', free: 'なし', lightning: 'なし', personal: 'なし', business: 'あり' },
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
  { plan: 'お試し', desc: 'まずどんなサービスか確かめたい方', charId: 'mint' },
  { plan: 'ライト', desc: '月に数回、ゆっくりHPを育てたい個人事業主・小規模店舗の方', charId: 'mint' },
  { plan: '個人向け', desc: '1人や家族経営で、月に数回HPを更新したい方', charId: 'rain' },
  { plan: '法人向け', desc: '複数の取材先をまとめて運用したい方', charId: 'claus' },
] as const

const FAQS = [
  { q: '無料プランにクレジットカードは必要ですか？', a: '不要です。メールアドレスのみで登録できます。' },
  { q: '追加キャストはどのプランで使えますか？', a: '追加キャストは現在準備中です。正式提供後は、お試し・個人向け・法人向けの各プランで使える形を予定しています。' },
  { q: '個人向けと法人向けの違いは何ですか？', a: '個人向けは1人や家族経営で運営されている方向け、法人向けは複数のスタッフや店舗でまとめてご利用になりたい方向けです。法人向けでは最大3件の取材先を登録でき、優先サポートが付きます。' },
  { q: 'プランはいつでも変更できますか？', a: '現在、申し込み後のプラン変更には対応していません。まず無料プランでお試しいただき、続けたいと思ってからご検討ください。プラン変更機能は準備中で、正式提供時にご案内します。' },
  { q: '解約するとデータはどうなりますか？', a: 'マイページの「ご利用プラン」からいつでも解約できます。解約後もこれまでの取材メモや記事素材はそのまま保持されます。' },
] as const

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = await searchParams
  const reason = Array.isArray(query.reason) ? query.reason[0] : query.reason

  const priceIds = {
    lightning: process.env.STRIPE_PRICE_ID_LIGHTNING ?? '',
    personal: process.env.STRIPE_PRICE_ID_PERSONAL ?? '',
    business: process.env.STRIPE_PRICE_ID_BUSINESS ?? '',
  }
  const guideChars = SELECTION_GUIDE.map((g) => ({ ...g, char: getCharacter(g.charId) }))
  const mint = getCharacter('mint')

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: '料金プラン', item: `${APP_URL}/pricing` },
    ],
  }

  const pricingFaqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  const offerCatalogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Insight Cast 料金プラン',
    url: `${APP_URL}/pricing`,
    itemListElement: PLANS.map((plan, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Offer',
        name: plan.name,
        description: plan.catch,
        price: String(plan.price),
        priceCurrency: 'JPY',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: String(plan.price),
          priceCurrency: 'JPY',
          unitText: '月',
        },
        url: `${APP_URL}/pricing`,
        seller: { '@type': 'Organization', name: 'Insight Cast' },
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogJsonLd) }}
      />

      <main className="relative z-10">
        {/* Limit banners */}
        {reason === 'project_limit' && (
          <div className="bg-[var(--accent)] text-white px-4 py-3 text-[13px] font-semibold leading-relaxed flex items-center justify-center gap-3">
            <CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={28} className="flex-shrink-0" />
            <span>現在のプランでは取材先を追加できません。プランをアップグレードすると、複数の取材先を管理できます。</span>
          </div>
        )}
        {reason === 'interview_limit' && (
          <div className="bg-[var(--accent)] text-white px-4 py-3 text-[13px] font-semibold leading-relaxed flex items-center justify-center gap-3">
            <CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={28} className="flex-shrink-0" />
            <span>今月の取材回数の上限に達しました。プランをアップグレードすると、来月を待たずに続けられます。</span>
          </div>
        )}
        {reason === 'free_plan_locked' && (
          <div className="bg-[var(--accent)] text-white px-4 py-3 text-[13px] font-semibold leading-relaxed flex items-center justify-center gap-3">
            <CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={28} className="flex-shrink-0" />
            <span>無料体験が終了しました。これまでのデータはそのまま残っています。プランを選ぶと続けられます。</span>
          </div>
        )}
        {reason === 'monthly_article_limit' && (
          <div className="bg-[var(--accent)] text-white px-4 py-3 text-[13px] font-semibold leading-relaxed flex items-center justify-center gap-3">
            <CharacterAvatar src={mint?.icon48} alt="ミントのアイコン" emoji={mint?.emoji} size={28} className="flex-shrink-0" />
            <span>今月の記事作成数の上限に達しました。プランをアップグレードすると、来月を待たずに続けられます。</span>
          </div>
        )}

        <PublicHero
          compact
          eyebrow="Pricing"
          title="まず無料で試せます"
          description="まずカード不要で取材を体験できます。続けて使いたいと思ったら、いつでも月額プランに切り替えられます。"
        />

        {/* Selection Guide */}
        <section className="py-10 sm:py-[56px] bg-[var(--bg)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[13px] font-semibold text-[var(--text2)] mb-5">どれを選べばいいか迷ったら</div>
            <div className="grid gap-4 md:grid-cols-3">
              {guideChars.map((item) => (
                <div key={item.plan} className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-4 flex gap-3 items-center">
                  <div className="flex-shrink-0">
                    <CharacterAvatar
                      src={item.char?.icon48}
                      alt={`${item.char?.name ?? item.plan}のアイコン`}
                      emoji={item.char?.emoji}
                      size={40}
                    />
                  </div>
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
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="mt-0 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
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
                  <PlanCardCTA plan={plan} priceIds={priceIds} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compare Table */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Plan Comparison</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              プラン比較表
            </h2>
            {/* モバイル: プランごとのカード比較 */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:hidden">
              {(['free', 'lightning', 'personal', 'business'] as const).map((plan) => {
                const isPersonal = plan === 'personal'
                const planLabel = plan === 'free' ? 'お試し' : plan === 'lightning' ? 'ライト' : plan === 'personal' ? '個人向け' : '法人向け'
                return (
                  <div key={plan} className={`rounded-[16px] border p-5 ${isPersonal ? 'border-[var(--accent)] bg-[var(--accent-l)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                    <div className={`mb-4 text-[13px] font-bold ${isPersonal ? 'text-[var(--accent)]' : 'text-[var(--text2)]'}`}>{planLabel}</div>
                    <div className="space-y-3">
                      {TABLE_ROWS.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                          <span className="text-[12px] text-[var(--text2)]">{row.label}</span>
                          <span className={`text-[12px] font-semibold ${isPersonal ? 'text-[var(--text)]' : 'text-[var(--text2)]'}`}>{row[plan]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* PC: テーブル */}
            <div className="mt-10 hidden overflow-hidden rounded-[20px] border border-[var(--border)] sm:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className="px-4 py-3.5 text-[13px] font-bold text-left border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)] w-[25%]"><span className="sr-only">機能</span></th>
                    <th scope="col" className="px-4 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">お試し</th>
                    <th scope="col" className="px-4 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">ライト</th>
                    <th scope="col" className="px-4 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--accent)] text-white">個人向け</th>
                    <th scope="col" className="px-4 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">法人向け</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-[13px] text-sm text-left font-medium text-[var(--text)] border-b border-[var(--border)]">{row.label}</td>
                      <td className="px-4 py-[13px] text-sm text-center border-b border-[var(--border)] text-[var(--text2)]">{row.free}</td>
                      <td className="px-4 py-[13px] text-sm text-center border-b border-[var(--border)] text-[var(--text2)]">{row.lightning}</td>
                      <td className="px-4 py-[13px] text-sm text-center border-b border-[var(--border)] bg-[var(--accent-l)] font-semibold text-[var(--text)]">{row.personal}</td>
                      <td className="px-4 py-[13px] text-sm text-center border-b border-[var(--border)] text-[var(--text2)]">{row.business}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Add-on Cast (buyout) */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Add-on Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              専門キャスト（提供予定）
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">追加キャストは現在準備中です。以下は正式提供時の予定価格です。</p>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
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
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">よくある質問</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              料金に関するよくある質問
            </h2>
            <div className="mt-10 divide-y divide-[var(--border)] rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {FAQS.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg2)] transition-colors">
                    <span>{faq.q}</span>
                    <span className="text-[var(--text3)] transition-transform group-open:rotate-180 flex-shrink-0">▾</span>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-[var(--text2)] leading-[1.85]">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 締めのCTA */}
        <section className="py-14 sm:py-[88px] bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12 text-center">
            <PricingBottomCTA />
          </div>
        </section>
      </main>


    </>
  )
}
