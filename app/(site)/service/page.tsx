import type { Metadata } from 'next'

import { PublicHero } from '@/components/public-layout'
import { ServiceHeroCTA, ServiceBottomCTA } from './ServiceCTA'
import { CharacterAvatar } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'サービス紹介 | Insight Cast',
  description: 'Insight Cast の使い方を3ステップで紹介します。取材先を登録するとAIがHP分析・競合比較を行い、AIキャストが取材して記事が届きます。書くより先に話す。会話から記事が生まれる流れです。',
  alternates: { canonical: `${APP_URL}/service` },
  openGraph: {
    title: 'サービス紹介 | Insight Cast',
    description: '取材先を登録 → AIキャストが取材 → 記事を受け取る。3ステップでHPを継続的に強くするサービスです。',
    url: `${APP_URL}/service`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'サービス紹介 | Insight Cast',
    description: '取材先を登録 → AIキャストが取材 → 記事を受け取る。3ステップでHPを継続的に強くするサービスです。',
    images: ['/logo.jpg'],
  },
}

const STEP_SUMMARY = [
  { step: 'STEP 01', title: 'HPを分析する', body: '取材先を登録すると、AIが現状と競合の情報を整理。' },
  { step: 'STEP 02', title: 'AIが取材する', body: 'キャストがチャットで質問。ふだん通りに答えるだけ。' },
  { step: 'STEP 03', title: '記事を届ける', body: '取材メモをもとに、記事に使える材料を整えます。' },
] as const

const STEP_DETAILS = [
  {
    step: '01',
    title: 'ホームページを分析する',
    paragraphs: [
      '取材先を登録すると、今のホームページで何が足りないかを整理してお知らせします。現在の情報量・訴求の強さ・不足しているコンテンツが見えやすくなります。',
      'さらに、主要な競合サイトと比較して「何が差別化になるか」「どこを掘り下げると差がつくか」を提案。取材の方向性を最初に固めます。',
    ],
    badges: ['HP分析', '競合比較', '取材テーマのヒント'],
    visual: 'analysis' as const,
  },
  {
    step: '02',
    title: 'AIキャストが取材する',
    paragraphs: [
      '分析結果をもとに、キャストがチャット形式で取材を行います。専門用語も難しい質問もありません。日常会話のように答えるだけで、価値が引き出されていきます。',
      'ミント・クラウス・レインの3名が、それぞれ異なる切り口で取材します。',
    ],
    badges: ['チャット形式', '3種のキャスト', '20分程度'],
    visual: 'chat' as const,
  },
  {
    step: '03',
    title: '記事として届ける',
    paragraphs: [
      '取材が終わると、内容を整理した「取材メモ」と、ホームページやブログに使える「記事」が届きます。',
      '記事の形式（インタビュー形式・通常記事から選べます）や長さも選べます。下書きとして整った状態で受け取れるので、少し手を加えるだけで掲載に進めます。',
    ],
    badges: ['取材メモ', '記事', 'そのまま使える素材'],
    visual: 'article' as const,
  },
] as const

const DELIVERABLES = [
  {
    title: 'HP調査レポート',
    body: '今のホームページで何が足りないか・競合との違いが一枚にまとまります。',
    charId: 'claus',
  },
  {
    title: '取材メモ',
    body: 'AI取材の内容を整理した記録。抽出された強み・記事テーマ一覧が含まれます。',
    charId: 'mint',
  },
  {
    title: '記事',
    body: '取材メモをもとに整えた記事のテキスト。ブログ・採用ページ・実績ページなどに使えます。',
    charId: 'rain',
  },
] as const

function VisualPanel({ type }: { type: (typeof STEP_DETAILS)[number]['visual'] }) {
  if (type === 'analysis') {
    const clausChar = getCharacter('claus')
    return (
      <div className="flex flex-col gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--bg2)] p-8 min-h-[280px] justify-center">
        <div className="flex items-center gap-2 mb-1">
          <CharacterAvatar src={clausChar?.icon48} alt={clausChar?.name ?? 'クラウス'} emoji={clausChar?.emoji} size={28} />
          <span className="text-[12px] font-semibold text-[var(--text3)]">クラウスが分析しています</span>
        </div>
        <div className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[13px] text-[var(--text2)]">
          <span aria-hidden="true">🔗</span> https://tanaka-kensetsu.example.jp
        </div>
        {[
          ['現状評価', '情報が古く、施工実績が少ない'],
          ['競合との差', '下地処理へのこだわりが未掲載'],
          ['提案テーマ', '職人技・お客様エピソード'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center gap-[10px] py-[10px] px-3 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] mb-[6px]">
            <span className="text-[11px] bg-[var(--accent-l)] text-[var(--accent)] py-0.5 px-2 rounded-full font-semibold">
              {label}
            </span>
            <span className="text-[13px] text-[var(--text)]">{value}</span>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'chat') {
    const mintChar = getCharacter('mint')
    return (
      <div className="flex flex-col gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--bg2)] p-8 min-h-[280px] justify-center">
        {[
          { side: 'cast', text: 'お客様から「ありがとう」と言われた仕事を、最近で一つ教えてもらえますか？' },
          { side: 'user', text: '先月、外壁塗装のお客さんに「また頼みたい」と連絡が来ました。' },
          { side: 'cast', text: '嬉しいですね。その方が再依頼してくれた理由、心当たりはありますか？' },
        ].map((message, index) => (
          <div key={index} className={`flex items-end gap-2 ${message.side === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.side === 'cast' && (
              <CharacterAvatar src={mintChar?.icon48} alt={mintChar?.name ?? 'ミント'} emoji={mintChar?.emoji} size={32} />
            )}
            <div
              className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-7 ${
                message.side === 'user'
                  ? 'rounded-tr-sm bg-[var(--accent)] text-white'
                  : 'rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--bg2)] p-8 min-h-[280px] justify-center">
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="text-[12px] font-bold text-[var(--accent)] mb-2">届いた記事</div>
        <div className="font-[family-name:var(--font-noto-serif-jp)] text-[14px] font-bold text-[var(--text)] mb-2 leading-[1.45]">
          「また頼みたい」と言われる外壁塗装業者のこだわり
        </div>
        <div className="text-[12px] text-[var(--text2)] leading-[1.8]">
          施工の質だけでなく、終わった後のフォローまで大切にしているのが田中建設の特徴です。先月、過去のお客様から再依頼の連絡が入りました…
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 py-2 bg-[var(--accent-l)] text-[var(--accent)] rounded-[8px] text-[12px] font-semibold text-center select-none opacity-60"><span aria-hidden="true">📋</span> コピー</div>
        <div className="flex-1 py-2 bg-[var(--bg2)] text-[var(--text2)] border border-[var(--border)] rounded-[8px] text-[12px] font-semibold text-center select-none opacity-60">記事画面で確認</div>
      </div>
    </div>
  )
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'サービス紹介', item: `${APP_URL}/service` },
  ],
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Insight Cast',
  url: `${APP_URL}/service`,
  description: '動物モチーフのAIインタビュアーが取材し、ホームページを継続的に強くするサービス。HP分析・競合比較・AIインタビュー・記事提供の4ステップ。',
  provider: {
    '@type': 'Organization',
    name: 'Insight Cast',
    url: APP_URL,
  },
  areaServed: { '@type': 'Country', name: '日本' },
  inLanguage: 'ja',
  serviceType: 'コンテンツ制作支援 / ホームページ強化',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'JPY',
    lowPrice: '0',
    highPrice: '14800',
  },
}

export default function ServicePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <main id="main-content" className="relative z-10">
        <PublicHero
          eyebrow="Service"
          title={<>AIが取材して、<br />記事の素材を届けるまで</>}
          description={(
            <>
              AIキャストが取材し、記事の素材が届くまでの流れをご紹介します。
            </>
          )}
          actions={<ServiceHeroCTA />}
          aside={(
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text3)]">Flow</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text2)]">
                  HP分析、AI取材、記事化までを一気通貫で進めます。
                </p>
              </div>
              <div className="space-y-3">
                {STEP_SUMMARY.map((item) => (
                  <div key={item.step} className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg2)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">{item.step}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text)]">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          asideClassName="self-stretch"
        />

        <section className="py-10 sm:py-14 bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="grid gap-6 md:grid-cols-3">
              {STEP_SUMMARY.map((item) => (
                <div key={item.step} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-8">
                  <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">{item.step}</div>
                  <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 text-[22px] font-bold text-[var(--text)]">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--text2)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">詳しい流れ</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>3つのステップの中身</h2>

            <div className="mt-10">
              {STEP_DETAILS.map((item, index) => (
                <div
                  key={item.step}
                  className={`grid gap-10 border-b border-[var(--border)] py-16 last:border-b-0 last:pb-0 lg:grid-cols-2 lg:items-center lg:gap-14 ${
                    index % 2 === 1 ? 'lg:[direction:rtl]' : ''
                  }`}
                >
                  <div className="[direction:ltr]">
                    <div className="font-[family-name:var(--font-noto-serif-jp)] text-[80px] font-bold leading-none text-[var(--border)]">{item.step}</div>
                    <h3 className="font-[family-name:var(--font-noto-serif-jp)] mt-4 text-[26px] font-bold text-[var(--text)] leading-[1.35]">{item.title}</h3>
                    <div className="mt-4 space-y-3">
                      {item.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-[15px] leading-[1.9] text-[var(--text2)]">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {item.badges.map((badge) => (
                        <span key={badge} className="rounded-full bg-[var(--accent-l)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="[direction:ltr]">
                    <VisualPanel type={item.visual} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Deliverables</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>取材が終わると、こんなものが届きます</h2>
            <div className="mt-10 rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-8">
              {DELIVERABLES.map((item, index) => {
              const char = getCharacter(item.charId)
              return (
                <div
                  key={item.title}
                  className={`flex items-start gap-[14px] py-[14px] ${index < DELIVERABLES.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-l)]">
                    <CharacterAvatar src={char?.icon48} alt={char?.name ?? item.title} emoji={char?.emoji} size={32} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[var(--text)] mb-1">{item.title}</div>
                    <div className="text-[13px] text-[var(--text2)] leading-[1.7]">{item.body}</div>
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12 text-center">
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(22px,2.5vw,32px)' }}>
              まず、取材を体験してみませんか
            </h2>
            <p className="mt-4 text-sm text-[var(--text2)] leading-[1.8]">
              カード登録不要。無料で3名のキャストによる取材を体験できます。
            </p>
            <ServiceBottomCTA />
          </div>
        </section>

      </main>


    </>
  )
}
