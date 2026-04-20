import type { Metadata } from 'next'
import Link from 'next/link'

import { CharacterAvatar } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'
import { PublicHeader, PublicFooter, PublicPageFrame } from '@/components/public-layout'

export const metadata: Metadata = {
  title: '料金プラン | Insight Cast',
  description: 'まず無料で体験して、必要に応じてプランをアップグレードしてください。',
}

const paidCharacters = CHARACTERS.filter((c) => !c.available)

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    note: 'クレジットカード不要',
    featured: false,
    features: [
      { ok: true, label: '月2回のAI取材' },
      { ok: true, label: 'フリーキャスト3名' },
      { ok: true, label: 'HP分析レポート（基本）' },
      { ok: true, label: '取材メモ生成' },
      { ok: true, label: '記事素材 月2本' },
      { ok: false, label: '追加キャスト' },
      { ok: false, label: '記事素材 無制限' },
      { ok: false, label: '競合詳細分析' },
    ],
    cta: '無料で始める',
    href: '/auth/signup',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 4980,
    note: '月払い・いつでも解約可',
    featured: true,
    features: [
      { ok: true, label: '月10回のAI取材' },
      { ok: true, label: 'フリーキャスト3名' },
      { ok: true, label: 'HP分析レポート（詳細）' },
      { ok: true, label: '取材メモ生成' },
      { ok: true, label: '記事素材 月10本' },
      { ok: true, label: '競合詳細分析' },
      { ok: false, label: '追加キャスト' },
      { ok: false, label: '記事素材 無制限' },
    ],
    cta: 'スタンダードで始める',
    href: '/auth/signup',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 14800,
    note: '月払い・いつでも解約可',
    featured: false,
    features: [
      { ok: true, label: 'AI取材 無制限' },
      { ok: true, label: 'フリーキャスト3名' },
      { ok: true, label: 'HP分析レポート（詳細）' },
      { ok: true, label: '取材メモ生成' },
      { ok: true, label: '記事素材 無制限' },
      { ok: true, label: '競合詳細分析' },
      { ok: true, label: '追加キャスト対象' },
      { ok: true, label: '優先サポート' },
    ],
    cta: 'Proで始める',
    href: '/auth/signup',
  },
] as const

const TABLE_ROWS = [
  { label: '月次AI取材回数', free: '2回', std: '10回', pro: '無制限' },
  { label: 'フリーキャスト', free: '3名', std: '3名', pro: '3名' },
  { label: '追加キャスト', free: '×', std: '×', pro: '○ (別途)' },
  { label: 'HP分析レポート', free: '基本', std: '詳細', pro: '詳細' },
  { label: '競合サイト分析数', free: '1社', std: '3社', pro: '5社' },
  { label: '記事素材生成数', free: '月2本', std: '月10本', pro: '無制限' },
  { label: '取材メモ', free: '○', std: '○', pro: '○' },
  { label: 'ダウンロード', free: '○', std: '○', pro: '○' },
] as const

const FAQS = [
  { q: '無料プランにクレジットカードは必要ですか？', a: '不要です。メールアドレスのみで登録できます。' },
  { q: '途中でプランを変更できますか？', a: 'いつでも変更可能です。アップグレードは即時反映、ダウングレードは翌月から適用されます。' },
  { q: '解約するとデータはどうなりますか？', a: '取材メモ・記事素材はエクスポートしていただければ保持できます。解約後30日以内はデータにアクセス可能です。' },
  { q: '追加取材は別途購入できますか？', a: '現在は月次プランのみです。追加購入オプションは近日公開予定です。' },
] as const

export default function PricingPage() {
  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#fdf8f2] to-[#f0e5d0] py-[88px] text-center">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Pricing</div>
            <h1 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(28px,3.5vw,44px)' }}>
              シンプルな料金体系
            </h1>
            <p className="mx-auto mt-4 max-w-[480px] text-base text-[var(--text2)] leading-relaxed">
              まず無料で体験して、必要に応じてプランをアップグレードしてください。
            </p>
          </div>
        </section>

        {/* Plan cards */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="grid grid-cols-3 gap-6 items-start mt-0">
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
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-sm font-bold text-[var(--text2)] tracking-[.1em] uppercase mb-2">{plan.name}</div>
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
                  <Link
                    href={plan.href}
                    className={`w-full text-center py-3 rounded-[var(--r-sm)] text-sm font-semibold transition-colors inline-flex items-center justify-center ${
                      plan.featured
                        ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'
                        : 'border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compare Table */}
        <section className="py-[88px]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Plan Comparison</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              プラン比較表
            </h2>
            <div className="mt-10 rounded-[20px] overflow-hidden border border-[var(--border)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-left border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)] w-[35%]"></th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">Free</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">Standard</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--accent)] text-white">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row, i) => (
                    <tr key={row.label} className={i < TABLE_ROWS.length - 1 ? '' : ''}>
                      <td className="px-5 py-[13px] text-sm text-left font-medium text-[var(--text)] border-b border-[var(--border)]">{row.label}</td>
                      <td className="px-5 py-[13px] text-sm text-center border-b border-[var(--border)] text-[var(--text2)]">{row.free}</td>
                      <td className="px-5 py-[13px] text-sm text-center border-b border-[var(--border)] text-[var(--text2)]">{row.std}</td>
                      <td className="px-5 py-[13px] text-sm text-center border-b border-[var(--border)] bg-[var(--accent-l)] font-semibold text-[var(--text)]">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Add-on Cast */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Add-on Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              追加キャスト
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">Proプランをご利用中の方は、追加キャストを月単位で追加できます。</p>
            <div className="grid grid-cols-3 gap-5 mt-10">
              {paidCharacters.map((char) => (
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
                    <div className="font-[family-name:var(--font-noto-serif-jp)] text-lg font-bold text-[var(--text)] mb-0.5">{char.name}</div>
                    <div className="text-[11px] text-[var(--accent)] font-semibold tracking-[.08em] mb-2">{char.label}</div>
                    <div className="text-[13px] text-[var(--text2)] leading-[1.65]">{char.specialty}</div>
                    <div className="text-[15px] font-bold text-[var(--text)] mt-2">＋980円/月</div>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-[var(--text3)] border border-[var(--border)] bg-[var(--bg2)] px-2.5 py-0.5 rounded-full">準備中</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-[88px]">
          <div className="mx-auto max-w-[720px] px-12">
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
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
