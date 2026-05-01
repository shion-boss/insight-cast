import type { Metadata } from 'next'
import Image from 'next/image'

import { CHARACTERS, getCharacter } from '@/lib/characters'
import { CharacterAvatar } from '@/components/ui'
import { PublicHero } from '@/components/public-layout'

import aboutImage from '@/assets/about/about.png'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

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
  name: 'Insight Cast について',
  description: 'Insight Cast がインタビューを起点にする理由、大切にしていること、AIキャストの役割を紹介します。',
  publisher: {
    '@type': 'Organization',
    name: 'Insight Cast',
    url: APP_URL,
  },
}

export const metadata: Metadata = {
  title: 'About | Insight Cast',
  description: 'Insight Cast がインタビューを起点にしている理由、大切にしていること、AIキャストそれぞれの役割を紹介します。会話から記事へ。あなたの当たり前を言葉にするために存在するサービスの考え方です。',
  alternates: { canonical: `${APP_URL}/about` },
  openGraph: {
    title: 'About | Insight Cast',
    description: 'Insight Cast がインタビューを起点にする理由、AIキャストの役割を紹介します。',
    url: `${APP_URL}/about`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | Insight Cast',
    description: 'Insight Cast がインタビューを起点にする理由、AIキャストの役割を紹介します。',
    images: ['/logo.jpg'],
  },
}

const PRINCIPLES = [
  { n: '01', title: '取材なしにコンテンツを語らない', desc: '情報の素材は取材から。AIだけが作った文章を、あなたの言葉として届けることはしません。' },
  { n: '02', title: '一歩ずつ、確実に前進する', desc: '「いつか大きく更新しよう」より、小さく続けることの方が、HPは育ちます。Insight Cast はその積み重ねを支えます。' },
  { n: '03', title: 'AIは、あなたの話を整える道具として使います', desc: 'AIは話を聞き、言葉を整えるために使います。あなたの経験や判断に置き換わるものではありません。' },
  { n: '04', title: '事業者の言葉を大切にする', desc: 'あなたが話した言葉を、できるかぎりそのまま活かします。きれいに整えすぎて、あなたらしさが消えないように。' },
] as const

const TRUST_POINTS = [
  { charId: 'mint', title: '取材から始める', desc: '情報をいきなり書くのではなく、まず「引き出す」。あなたの経験・言葉・判断が、記事の素材です。' },
  { charId: 'claus', title: 'あなたの話にしか、語れないことがある', desc: '長年の仕事の中で「当たり前」になっていること。それが、他社には真似できない言葉になります。' },
  { charId: 'rain', title: '続けることで、HPは育つ', desc: '一度作って終わりではなく、取材を重ねるたびにホームページが少しずつ強くなっていきます。' },
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

      <main id="main-content" className="relative z-10">
        <PublicHero
          eyebrow="About"
          title={<>毎日の仕事に、まだ言葉に<br />なっていない価値があります。</>}
          description={(
            <>
              自分では「当たり前」と思っていることに、あなただけの価値が眠っています。
              Insight Cast は、AIキャストがあなたの話を聞き、その価値を言葉にして、ホームページへ届けていくサービスです。
            </>
          )}
          aside={(
            <div className="rounded-[24px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,.13)]">
              <Image
                src={aboutImage}
                alt="Insight CastのAIキャストたちが集まっているオフショット風の様子"
                width={1672}
                height={941}
                className="w-full h-auto object-cover"
                sizes="(min-width: 1024px) 480px, 100vw"
                priority
              />
            </div>
          )}
          containerClassName="lg:grid-cols-[minmax(0,1fr)_480px]"
          asideClassName="self-stretch border-none bg-transparent p-0 shadow-none"
        />

        {/* Mission */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Mission</div>
            <div className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.6] mt-5" style={{ fontSize: 'clamp(22px,3vw,34px)' }}>
              <span className="text-[var(--accent)]">あなたの体験にしか、</span>語れないことがあります。<br />
              価値の中心は、きれいに整えられた文章ではなく、<br />
              取材で引き出した<span className="text-[var(--accent)]">あなた自身の言葉</span>にある。
            </div>
            <div className="w-10 h-0.5 bg-[var(--accent)] mt-8" />
            <p className="text-base text-[var(--text2)] mt-8 leading-[1.9]">
              大手には真似できないことがあります。それは「あなたが体験した、あの出来事」です。毎日の仕事の中で当たり前になっていること、積み重ねてきた判断や工夫。それを言葉にして、ホームページで伝えていくこと。それが私たちの仕事です。
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
                  <div aria-hidden="true" className="font-[family-name:var(--font-noto-serif-jp)] text-[48px] font-bold text-[var(--border)] absolute top-4 right-5 leading-none">{item.n}</div>
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
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
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


      </main>


    </>
  )
}
