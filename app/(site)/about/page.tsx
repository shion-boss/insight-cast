import type { Metadata } from 'next'
import Image from 'next/image'

import { CHARACTERS, getCharacter } from '@/lib/characters'
import { CharacterAvatar } from '@/components/ui'
import { PublicHero } from '@/components/public-layout'
import { AboutBottomCTA } from './AboutCTA'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp'

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'About', item: `${APP_URL}/about` },
  ],
}

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  url: `${APP_URL}/about`,
  name: 'About | Insight Cast',
  description: 'Insight Cast がインタビューを起点にする理由、大切にしていること、AIキャストの役割を紹介します。',
  publisher: {
    '@type': 'Organization',
    name: 'Insight Cast',
    url: APP_URL,
  },
}

export const metadata: Metadata = {
  title: 'About | Insight Cast',
  description: 'Insight Cast がインタビューを起点にする理由、大切にしていること、AIキャストの役割を紹介します。会話から記事へ。あなたの当たり前を言葉にするために存在するサービスです。',
  alternates: { canonical: `${APP_URL}/about` },
  openGraph: {
    title: 'About | Insight Cast',
    description: 'Insight Cast がインタビューを起点にする理由、AIキャストの役割を紹介します。',
    url: `${APP_URL}/about`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'About | Insight Cast',
    description: 'Insight Cast がインタビューを起点にする理由、AIキャストの役割を紹介します。',
  },
}

const PRINCIPLES = [
  { n: '01', title: '取材なしにコンテンツを語らない', desc: '情報の素材は取材から。AIだけで作った文章を、あなたの言葉として届けません。' },
  { n: '02', title: '一歩ずつ、確実に前進する', desc: '完璧を目指して止まるより、小さく始めて継続することに価値があります。' },
  { n: '03', title: '技術ではなく、価値に焦点を当てる', desc: 'どんなに高度な技術も、伝えるべき価値のために使います。技術が目的になりません。' },
  { n: '04', title: '事業者の言葉を大切にする', desc: '届いた素材はそのままご活用いただけます。自分らしい言葉に整えたい場合は、たたき台としてお使いください。' },
] as const

const TRUST_POINTS = [
  { charId: 'mint', title: '取材から始める', desc: '情報をいきなり書くのではなく、まず「引き出す」。あなたの経験・言葉・判断が素材です。' },
  { charId: 'claus', title: '一次情報の尊重', desc: 'あなた自身の体験にしか語れないことがある。その固有性こそが、信頼につながります。' },
  { charId: 'rain', title: '継続的に育てる', desc: '一度作って終わりではなく、取材を重ねることでホームページが育っていく仕組みをつくります。' },
] as const

export default function AboutPage() {
  const allCasts = CHARACTERS
  const trustChars = TRUST_POINTS.map((p) => ({ ...p, char: getCharacter(p.charId) }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />

      <main className="relative z-10">
        <PublicHero
          eyebrow="About"
          title={<>眠っている一次情報を、<br />誰かのために言葉にする</>}
          description={(
            <>
              私たちは、小規模事業者が自分の言葉で発信を続けられる世界を目指しています。
              AIキャストが話を聞き、あなたの経験から発信の土台を育てていく。それが Insight Cast です。
            </>
          )}
          aside={(
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg2)] p-4 sm:p-6">
              <div className="grid grid-cols-3 gap-3">
                {allCasts.map((char, idx) => (
                  <div key={char.id} className={`text-center ${!char.available ? 'opacity-70' : ''}`}>
                    <div className="mb-2.5 overflow-hidden rounded-[16px] border-[1.5px] border-[var(--border)] bg-[var(--surface)]">
                      <Image
                        src={char.portrait}
                        alt={char.available ? `${char.name}のポートレート` : `${char.name}のポートレート（準備中）`}
                        width={80}
                        height={80}
                        className="w-full object-contain"
                        priority={idx < 3}
                      />
                    </div>
                    <div className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold text-[var(--text)]">{char.name}</div>
                    <div className="mt-0.5 text-[11px] font-semibold tracking-[.06em] text-[var(--accent)]">
                      {char.available ? char.label : '準備中'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          asideClassName="self-stretch border-none bg-transparent p-0 shadow-none"
        />

        {/* Mission */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Mission</div>
            <div className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.6] mt-5" style={{ fontSize: 'clamp(22px,3vw,34px)' }}>
              <span className="text-[var(--accent)]">一次情報こそが、</span>誰にも真似できない差別化の源泉である。<br />
              価値の中心は、きれいに整えられた文章ではなく、<br />
              取材で引き出した<span className="text-[var(--accent)]">事実と体験</span>そのものにある。
            </div>
            <div className="w-10 h-0.5 bg-[var(--accent)] mt-8" />
            <p className="text-base text-[var(--text2)] mt-8 leading-[1.9]">
              大手には真似できないことがあります。それは「あなたが体験した、あの出来事」です。毎日の仕事の中にある価値を掘り起こし、ホームページで伝えられる言葉にすること。それが私たちの仕事です。
            </p>
          </div>
        </section>

        {/* Trust points */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Why We Exist</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              私たちが大切にしていること
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {trustChars.map((item) => (
                <div key={item.title} className="text-center py-8 px-5 bg-[var(--surface)] border border-[var(--border)] rounded-[18px]">
                  <div className="flex justify-center mb-4">
                    <CharacterAvatar
                      src={item.char?.icon96}
                      alt={`${item.char?.name ?? item.title}のアイコン`}
                      emoji={item.char?.emoji}
                      size={64}
                    />
                  </div>
                  <h3 className="font-[family-name:var(--font-noto-serif-jp)] text-lg font-bold text-[var(--text)] mb-2.5">{item.title}</h3>
                  <p className="text-sm text-[var(--text2)] leading-[1.8]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Principles</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              私たちが守っていること
            </h2>
            <div className="mt-11 grid gap-6 lg:grid-cols-2">
              {PRINCIPLES.map((item) => (
                <div key={item.n} className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] p-8 relative overflow-hidden">
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-[48px] font-bold text-[var(--border)] absolute top-4 right-5 leading-none">{item.n}</div>
                  <h3 className="font-[family-name:var(--font-noto-serif-jp)] text-xl font-bold text-[var(--text)] mb-3">{item.title}</h3>
                  <p className="text-sm text-[var(--text2)] leading-[1.85]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cast team */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Our Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              AIキャストを紹介します
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {allCasts.map((char) => (
                <div key={char.id} className="text-center">
                  <div className={`rounded-[16px] overflow-hidden border-[1.5px] border-[var(--border)] mb-2.5 bg-[var(--bg2)] ${!char.available ? 'opacity-70' : ''}`}>
                    <Image
                      src={char.portrait}
                      alt={char.available ? `${char.name}のポートレート` : `${char.name}のポートレート（準備中）`}
                      width={120}
                      height={120}
                      className="w-full object-contain"
                    />
                  </div>
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold text-[var(--text)] mb-0.5">{char.name}</div>
                  <div className="text-[11px] text-[var(--accent)] font-semibold tracking-[.06em]">
                    {char.available ? char.label : '準備中'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12 text-center">
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(22px,2.5vw,32px)' }}>
              まず、取材を体験してみませんか
            </h2>
            <p className="mt-4 text-sm text-[var(--text2)] leading-[1.8]">
              カード登録不要。無料で3名のキャストによる取材を体験できます。
            </p>
            <AboutBottomCTA />
          </div>
        </section>
      </main>


    </>
  )
}
