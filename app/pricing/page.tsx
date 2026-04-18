import type { Metadata } from 'next'
import Link from 'next/link'

import { CharacterAvatar } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'
import { PublicHeader, PublicFooter, PublicHero, PublicPageFrame } from '@/components/public-layout'

export const metadata: Metadata = {
  title: '料金プラン | Insight Cast',
  description:
    '月3万円・5万円・10万円のプランと、キャラクター追加オプションの料金体系を紹介します。',
}

const paidCharacters = CHARACTERS.filter((c) => !c.available)

const plans = [
  {
    id: 'starter',
    name: 'スターター',
    price: '30,000',
    unit: '月',
    pace: '月2回ペースの発信',
    paceNote: '週1本を目安に、取材と更新を回せる量',
    color: 'bg-white/90',
    border: 'border-stone-200',
    badgeColor: 'bg-stone-100 text-stone-600',
    highlight: false,
    includes: [
      'HP現状分析（月1回）',
      '競合比較レポート（月1回）',
      'AIインタビュー（月2回）',
      'インタビュー整理テキスト',
      '記事素材一式（コピー・Markdown）',
      'ミント・クラウス・レインの取材班',
    ],
    notIncludes: [
      '記事本文の仕上げ・公開作業',
      'LP・特集ページの制作',
    ],
  },
  {
    id: 'standard',
    name: 'スタンダード',
    price: '50,000',
    unit: '月',
    pace: '月4回ペースの発信',
    paceNote: '週2本を目安に、複数テーマを並行して回せる量',
    color: 'bg-stone-900',
    border: 'border-stone-800',
    badgeColor: 'bg-white/10 text-white',
    highlight: true,
    includes: [
      'HP現状分析（月2回）',
      '競合比較レポート（月2回）',
      'AIインタビュー（月4回）',
      'インタビュー整理テキスト',
      '記事素材一式（コピー・Markdown）',
      'ミント・クラウス・レインの取材班',
      '発信テーマ提案レポート（月1回）',
    ],
    notIncludes: [
      '記事本文の仕上げ・公開作業',
      'LP・特集ページの制作',
    ],
  },
  {
    id: 'growth',
    name: 'グロース',
    price: '100,000',
    unit: '月',
    pace: '発信全体の強化',
    paceNote: '記事増加・LP制作・発信軸の整備まで対応',
    color: 'bg-white/90',
    border: 'border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-700',
    highlight: false,
    includes: [
      'HP現状分析（月2回）',
      '競合比較レポート（月2回）',
      'AIインタビュー（月6回）',
      'インタビュー整理テキスト',
      '記事素材一式（コピー・Markdown）',
      'ミント・クラウス・レインの取材班',
      '発信テーマ提案レポート（月2回）',
      '記事本文の仕上げサポート（月2本）',
      'LP・特集ページ素材の整理（月1本）',
    ],
    notIncludes: [],
  },
]

const options = [
  {
    name: '記事本文の仕上げ',
    price: '10,000円 / 本',
    desc: 'インタビュー素材をもとに、公開できる状態の記事本文に仕上げます。スターター・スタンダードプランへの追加オプションです。',
  },
  {
    name: 'LP・特集ページ素材',
    price: '20,000円 / 本',
    desc: '取材内容をもとに、ランディングページや特集ページに使える構成案・コピー素材を整理します。',
  },
  {
    name: '競合追加調査',
    price: '5,000円 / 社',
    desc: '標準の競合比較に含まれない追加の競合サイトを個別に調査・比較します。',
  },
]

export default function PricingPage() {
  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <PublicHero
          eyebrow="Pricing"
          title={<>発信のペースに合わせて<br />選べるプラン。</>}
          description={(
            <>
              本数保証ではなく、発信が続く仕組みをつくることが目的です。
              まずは無料で体験してから、ペースに合わせてプランを選んでください。
            </>
          )}
          actions={(
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <p className="text-sm text-stone-600">まず無料で体験できます。クレジットカード不要。</p>
            </div>
          )}
        />

        {/* Plan cards */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden rounded-[2rem] border ${plan.border} ${plan.color}`}
                >
                  {plan.highlight && (
                    <div className="absolute right-5 top-5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold text-stone-900">
                      おすすめ
                    </div>
                  )}

                  <div className="p-7 pb-0">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${plan.badgeColor}`}>
                      {plan.name}
                    </span>

                    <div className="mt-5 flex items-end gap-1">
                      <span className={`text-4xl font-bold tracking-tight ${plan.highlight ? 'text-white' : 'text-stone-900'}`}>
                        ¥{plan.price}
                      </span>
                      <span className={`mb-1 text-sm ${plan.highlight ? 'text-stone-400' : 'text-stone-400'}`}>
                        / {plan.unit}
                      </span>
                    </div>

                    <div className={`mt-4 rounded-[1.2rem] border px-4 py-3 ${plan.highlight ? 'border-white/10 bg-white/6' : 'border-stone-100 bg-stone-50'}`}>
                      <p className={`text-sm font-semibold ${plan.highlight ? 'text-white' : 'text-stone-800'}`}>
                        {plan.pace}
                      </p>
                      <p className={`mt-1 text-xs leading-5 ${plan.highlight ? 'text-stone-400' : 'text-stone-500'}`}>
                        {plan.paceNote}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 p-7">
                    <p className={`mb-3 text-[11px] font-semibold tracking-[0.16em] uppercase ${plan.highlight ? 'text-stone-400' : 'text-stone-400'}`}>
                      含まれるもの
                    </p>
                    <ul className="space-y-2.5">
                      {plan.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${plan.highlight ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          <span className={`text-sm leading-6 ${plan.highlight ? 'text-stone-300' : 'text-stone-600'}`}>{item}</span>
                        </li>
                      ))}
                      {plan.notIncludes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span className={`mt-2 h-px w-2 flex-shrink-0 ${plan.highlight ? 'bg-stone-600' : 'bg-stone-300'}`} />
                          <span className={`text-sm leading-6 line-through ${plan.highlight ? 'text-stone-600' : 'text-stone-400'}`}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-7 pt-0">
                    <Link
                      href="/auth/signup"
                      className={`flex w-full items-center justify-center rounded-2xl py-4 text-sm font-medium transition-colors ${
                        plan.highlight
                          ? 'bg-white text-stone-900 hover:bg-stone-100'
                          : 'bg-stone-900 text-white hover:bg-stone-700'
                      }`}
                    >
                      まず無料で試す
                    </Link>
                    <p className={`mt-3 text-center text-xs ${plan.highlight ? 'text-stone-500' : 'text-stone-400'}`}>
                      体験後にプランを選べます
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-6 text-center text-xs text-stone-400">
              ※ 表示金額はすべて税抜きです。正式な契約はリリース時にご案内します。
            </p>
          </div>
        </section>

        {/* 発信ペース比較 */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">Pace Comparison</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-900">発信ペースの違い</h2>
              <p className="mt-2 text-sm leading-7 text-stone-500">
                本数は目安です。インタビューの深まり具合やテーマによって変わります。
              </p>
            </div>
            <div className="overflow-hidden rounded-[1.8rem] border border-stone-200 bg-white/90">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/80">
                      <th className="px-6 py-4 text-left font-semibold text-stone-600"></th>
                      <th className="px-6 py-4 text-left font-semibold text-stone-700">スターター</th>
                      <th className="px-6 py-4 text-left font-semibold text-stone-700">スタンダード</th>
                      <th className="px-6 py-4 text-left font-semibold text-stone-700">グロース</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['インタビュー回数', '月2回', '月4回', '月6回'],
                      ['HP分析・競合比較', '月1回', '月2回', '月2回'],
                      ['発信テーマ提案', '—', '月1回', '月2回'],
                      ['記事本文仕上げ', '—', '—', '月2本'],
                      ['LP・特集素材', '—', '—', '月1本'],
                      ['想定発信ペース', '月2本目安', '月4本目安', '制限なし'],
                    ].map(([label, s, st, g], i, arr) => (
                      <tr key={label} className={i < arr.length - 1 ? 'border-b border-stone-100' : ''}>
                        <td className="px-6 py-4 font-medium text-stone-700">{label}</td>
                        <td className="px-6 py-4 text-stone-500">{s}</td>
                        <td className="px-6 py-4 text-stone-500">{st}</td>
                        <td className="px-6 py-4 text-stone-500">{g}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* オプション */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">Options</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-900">追加オプション</h2>
              <p className="mt-2 text-sm leading-7 text-stone-500">
                必要なときに、必要な分だけ追加できます。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {options.map((opt) => (
                <article
                  key={opt.name}
                  className="rounded-[2rem] border border-stone-200 bg-white/90 p-6"
                >
                  <p className="text-base font-semibold text-stone-900">{opt.name}</p>
                  <p className="mt-1 text-lg font-bold text-stone-800">{opt.price}</p>
                  <p className="mt-3 text-sm leading-7 text-stone-500">{opt.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* キャラクター追加の考え方 */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <div>
                <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">Character Add-on</p>
                <h2 className="mt-3 text-2xl font-semibold text-stone-900">
                  取材班を増やす、
                  <br />
                  買い切りの考え方。
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-500">
                  ミント・クラウス・レインはどのプランでも使えます。
                  ハル・モグロ・コッコは、買い切りで一度購入すれば以降はずっと使える予定です。
                  必要な視点が増えたタイミングで追加してください。
                </p>
                <div className="mt-5 rounded-[1.4rem] border border-amber-200 bg-amber-50/60 px-5 py-4">
                  <p className="text-xs font-semibold text-amber-700">買い切りの理由</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    キャラクターは「視点」です。一度使い始めると継続的に活用できるため、
                    月額に組み込まずに買い切りで提供します。
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-3">
                {paidCharacters.map((char) => (
                  <div
                    key={char.id}
                    className="flex items-center gap-4 rounded-[1.6rem] border border-stone-200 bg-white/90 px-5 py-4"
                  >
                    <CharacterAvatar
                      src={char.icon96}
                      alt={`${char.name}のアイコン`}
                      emoji={char.emoji}
                      size={48}
                      className="flex-shrink-0 border-stone-100"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-stone-900">{char.name}</p>
                        <span className="text-xs text-stone-400">{char.species}</span>
                      </div>
                      <p className="mt-0.5 text-xs leading-5 text-stone-500">{char.specialty}</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-500">
                      準備中
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 注意書き */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[1.8rem] border border-stone-200 bg-white/70 px-7 py-6">
              <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-stone-400 uppercase">ご注意</p>
              <ul className="space-y-2">
                {[
                  '記事本数の保証はしていません。発信が継続できるペースを目安として提示しています。',
                  '記事本文の公開作業（CMSへの入稿・画像選定等）は含まれません。',
                  '競合調査はご登録いただいたURLの公開情報をもとに行います。',
                  'プランの内容・料金は正式リリース時に変更になる場合があります。',
                  'キャラクター追加の価格・時期はリリース時にお知らせします。',
                ].map((note) => (
                  <li key={note} className="flex items-start gap-2.5 text-sm leading-7 text-stone-500">
                    <span className="mt-2.5 h-1 w-1 flex-shrink-0 rounded-full bg-stone-300" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] border border-stone-200 bg-[linear-gradient(135deg,_#1f2937_0%,_#292524_55%,_#6b4f2c_100%)] px-6 py-10 text-white sm:px-10 sm:py-12">
            <p className="text-xs font-medium tracking-[0.22em] text-amber-200 uppercase">Start Free</p>
            <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  まず無料で体験してから、
                  <br />
                  プランを選んでください。
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-200">
                  登録後すぐにミント・クラウス・レインの取材を体験できます。
                  クレジットカード不要です。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
                >
                  無料で始める
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-white/14"
                >
                  よくある質問を見る
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
