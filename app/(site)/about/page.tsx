import type { Metadata } from 'next'
import Image from 'next/image'

import { CHARACTERS, getCharacter } from '@/lib/characters'
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

        {/* ① FV */}
        <section className="relative overflow-hidden bg-[var(--bg)]" style={{ minHeight: '420px' }}>
          {/* 右側に画像をフルブリード */}
          <div className="absolute right-0 top-0 h-full w-full md:w-[38%]">
            <Image
              src={aboutImage}
              alt="Insight CastのAIキャストたちが集まっているオフショット風の様子"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to right, rgba(253,247,240,0.25), transparent 50%)' }}
            />
          </div>

          {/* テキストはヘッダーと同じコンテナ内 */}
          <div
            className="relative z-10 mx-auto max-w-6xl px-6"
            style={{ paddingTop: 'calc(108px + clamp(24px,3vw,48px))', paddingBottom: 'clamp(48px,6vw,96px)' }}
          >
            <div className="md:w-[62%] md:pr-12">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] mb-4">About</p>
              <h1
                className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.65] mb-7"
                style={{ fontSize: 'clamp(24px,3vw,40px)' }}
              >
                毎日の仕事に、まだ言葉になっていない価値があります。
              </h1>
              <div className="w-9 h-0.5 rounded-[1px] bg-[var(--accent)] opacity-45 mb-8" />
              <p
                className="text-[var(--text2)] leading-[1.9]"
                style={{ fontSize: 'clamp(14px,1.2vw,16px)' }}
              >
                自分では「当たり前」と思っていることに、あなただけの価値が眠っています。Insight Cast は、AIキャストがあなたの話を聞き、その価値を言葉にして、ホームページへ届けていくサービスです。
              </p>
            </div>

            {/* モバイル用画像（mdより小さい時にインライン表示） */}
            <div className="mt-8 -mx-6 h-[260px] relative overflow-hidden md:hidden">
              <Image
                src={aboutImage}
                alt="Insight CastのAIキャストたちが集まっているオフショット風の様子"
                fill
                className="object-cover object-center"
                sizes="100vw"
              />
            </div>
          </div>
        </section>


        {/* ② Mission */}
        <section className="relative overflow-hidden" style={{ background: 'var(--text)', padding: 'clamp(64px,8vw,112px) clamp(32px,8vw,120px)' }}>
          {/* radial decoration */}
          <div
            className="absolute pointer-events-none"
            style={{ top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(194,114,42,0.1) 0%, transparent 65%)' }}
          />
          <div className="relative z-10 max-w-[800px] mx-auto">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] opacity-70 mb-4">Mission</p>
            <p
              className="font-[family-name:var(--font-noto-serif-jp)] font-bold leading-[1.75] mb-10"
              style={{ color: '#f0e8dc', fontSize: 'clamp(18px,2.4vw,30px)' }}
            >
              あなたの体験にしか、語れないことがあります。<br />
              価値の中心は、きれいに整えられた文章ではなく、<br />
              取材で引き出したあなた自身の言葉にある。
            </p>
            <p
              className="leading-[2.0] max-w-[620px]"
              style={{ color: 'rgba(240,232,220,0.65)', fontSize: 'clamp(14px,1.1vw,16px)' }}
            >
              大手には真似できないことがあります。それは「あなたが体験した、あの出来事」です。毎日の仕事の中で当たり前になっていること、積み重ねてきた判断や工夫。それを言葉にして、ホームページで伝えていくこと。それが私たちの仕事です。
            </p>
          </div>
        </section>


        {/* ③ Why We Exist */}
        <section className="bg-[var(--bg2)]" style={{ padding: 'clamp(64px,7vw,96px) clamp(32px,6vw,80px)' }}>
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] mb-4">Why We Exist</p>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(20px,2.2vw,28px)' }}>
              私たちが大切にしていること
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1000px] mx-auto">
            {trustChars.map((item) => (
              <div key={item.title} className="bg-[var(--bg)] rounded-[4px] flex flex-col gap-4" style={{ padding: '32px 28px 28px' }}>
                <div className="w-14 h-14 rounded-full bg-[var(--bg2)] flex items-center justify-center text-[26px] flex-shrink-0 overflow-hidden">
                  {item.char?.icon96 ? (
                    <Image src={item.char.icon96} alt={item.char.name} width={40} height={40} className="object-contain" />
                  ) : (
                    <span>{item.char?.emoji}</span>
                  )}
                </div>
                <h3 className="font-[family-name:var(--font-noto-serif-jp)] text-[16px] font-bold text-[var(--text)] leading-[1.55]">{item.title}</h3>
                <p className="text-[13px] text-[var(--text2)] leading-[1.85]">{item.desc}</p>
                <p className="text-[11px] font-bold tracking-[0.1em] text-[var(--accent)] mt-auto pt-2 border-t border-[var(--border)]">
                  {item.char?.name}
                </p>
              </div>
            ))}
          </div>
        </section>


        {/* ④ Principles */}
        <section className="bg-[var(--bg)]" style={{ padding: 'clamp(64px,7vw,96px) clamp(32px,6vw,80px)' }}>
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] mb-4">Principles</p>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(20px,2.2vw,28px)' }}>
              私たちが守っていること
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[900px] mx-auto">
            {PRINCIPLES.map((item) => (
              <div key={item.n} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] relative" style={{ padding: '32px 28px 28px' }}>
                <span
                  aria-hidden="true"
                  className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--accent)] absolute leading-none"
                  style={{ fontSize: '36px', opacity: 0.18, top: '20px', right: '24px', letterSpacing: '-0.02em' }}
                >
                  {item.n}
                </span>
                <h3
                  className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.6] mb-3.5"
                  style={{ fontSize: '15px', paddingRight: '48px' }}
                >
                  {item.title}
                </h3>
                <p className="text-[13px] text-[var(--text2)] leading-[1.9]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* ⑤ Our Cast */}
        <section className="bg-[var(--bg2)]" style={{ padding: 'clamp(64px,7vw,96px) clamp(32px,6vw,80px)' }}>
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] mb-4">Our Cast</p>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(20px,2.2vw,28px)' }}>
              AIキャストを紹介します
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-[1000px] mx-auto">
            {allCasts.map((char) => (
              <div key={char.id} className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`w-full aspect-square rounded-full bg-[var(--bg)] border-2 border-[var(--border)] relative overflow-hidden${!char.available ? ' opacity-45 grayscale-[0.4]' : ''}`}
                >
                  <Image
                    src={char.portrait}
                    alt={char.available ? `${char.name}のポートレート` : `${char.name}のポートレート（準備中）`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 16vw"
                  />
                </div>
                <p className="font-[family-name:var(--font-noto-serif-jp)] text-[14px] font-bold text-[var(--text)]">{char.name}</p>
                <p className="text-[11px] text-[var(--text2)] -mt-2">{char.species}</p>
                <span
                  className={`text-[10px] font-bold tracking-[0.08em] rounded-[20px] px-2.5 py-0.5 border -mt-1 ${
                    char.available
                      ? 'text-[var(--accent)] border-[rgba(194,114,42,0.3)] bg-[rgba(194,114,42,0.06)]'
                      : 'text-[#b8a898] border-[var(--border)] bg-[var(--bg)]'
                  }`}
                >
                  {char.available ? '取材中' : '準備中'}
                </span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  )
}
