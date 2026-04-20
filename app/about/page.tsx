import type { Metadata } from 'next'
import Image from 'next/image'

import { CHARACTERS } from '@/lib/characters'
import { PublicHeader, PublicFooter, PublicPageFrame } from '@/components/public-layout'

export const metadata: Metadata = {
  title: 'About | Insight Cast',
  description: 'Insight Cast の考え方、AI取材班の役割、ホームページ改善につながるチームの進め方を紹介します。',
}

const PRINCIPLES = [
  { n: '01', title: '取材なしにコンテンツを語らない', desc: '情報の素材は取材から。AIだけで生成した文章を、あなたの言葉として届けません。' },
  { n: '02', title: '一歩ずつ、確実に前進する', desc: '完璧を目指して止まるより、小さく始めて継続することに価値があります。' },
  { n: '03', title: '技術ではなく、価値に焦点を当てる', desc: 'どんなに高度な技術も、伝えるべき価値のために使います。技術が目的になりません。' },
  { n: '04', title: '事業者の言葉を大切にする', desc: '生成した文章に過度に依存せず、あなた自身の言葉で整えることを推奨します。' },
] as const

const TRUST_POINTS = [
  { icon: '🎤', title: '取材から始める', desc: '情報を「生成」するのではなく、まず「引き出す」。あなたの経験・言葉・判断が素材です。' },
  { icon: '📖', title: '一次情報の尊重', desc: 'あなた自身の体験にしか語れないことがある。その固有性こそが、信頼につながります。' },
  { icon: '🌱', title: '継続的に育てる', desc: '一度作って終わりではなく、取材を重ねることでホームページが育っていく仕組みをつくります。' },
] as const

export default function AboutPage() {
  const allCasts = CHARACTERS

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        {/* Hero */}
        <section style={{ padding: '112px 0 80px', background: 'linear-gradient(135deg,#fdf8f2 0%,#f0e5d0 100%)' }}>
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="grid grid-cols-2 gap-16 items-center">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">About</div>
                <h1 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(28px,3.5vw,44px)' }}>
                  一次情報に、<br />価値を宿らせる
                </h1>
                <p className="text-base text-[var(--text2)] mt-4 leading-relaxed">
                  私たちは、小規模事業者が自分の言葉で情報を発信できる世界を目指しています。AIが取材し、あなたの話から言葉の資産を生み出す。それがInsight Castです。
                </p>
              </div>
              <div>
                <div className="bg-[var(--bg2)] rounded-[24px] overflow-hidden border border-[var(--border)]">
                  <div className="grid grid-cols-3 gap-3 p-6">
                    {allCasts.map((char, i) => (
                      <div key={char.id} className={`text-center ${i > 2 ? 'opacity-70' : ''}`}>
                        <div className="rounded-[16px] overflow-hidden border-[1.5px] border-[var(--border)] mb-2.5 bg-[var(--bg2)]">
                          <Image
                            src={char.portrait}
                            alt={`${char.name}のポートレート`}
                            width={80}
                            height={80}
                            className="w-full object-contain"
                          />
                        </div>
                        <div className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold text-[var(--text)] mb-0.5">{char.name}</div>
                        <div className="text-[11px] text-[var(--accent)] font-semibold tracking-[.06em]">{char.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-[88px]">
          <div className="mx-auto max-w-[720px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Mission</div>
            <div className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.6] mt-5" style={{ fontSize: 'clamp(22px,3vw,34px)' }}>
              <span className="text-[var(--accent)]">一次情報こそが、</span>小規模事業者の唯一の差別化である。<br />
              AIが生成した文章に価値はなく、<br />
              取材で引き出した<span className="text-[var(--accent)]">事実と体験</span>に価値がある。
            </div>
            <div className="w-10 h-0.5 bg-[var(--accent)] mt-8" />
            <p className="text-base text-[var(--text2)] mt-8 leading-[1.9]">
              大手には真似できないことがあります。それは「あなたが体験した、あの出来事」です。毎日の仕事の中にある価値を掘り起こし、ホームページで伝えられる言葉にすること。それが私たちの仕事です。
            </p>
          </div>
        </section>

        {/* Trust points */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Why We Exist</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              私たちが大切にしていること
            </h2>
            <div className="grid grid-cols-3 gap-5 mt-10">
              {TRUST_POINTS.map((item) => (
                <div key={item.title} className="text-center py-8 px-5 bg-[var(--surface)] border border-[var(--border)] rounded-[18px]">
                  <div className="text-[36px] mb-4">{item.icon}</div>
                  <h3 className="font-[family-name:var(--font-noto-serif-jp)] text-lg font-bold text-[var(--text)] mb-2.5">{item.title}</h3>
                  <p className="text-sm text-[var(--text2)] leading-[1.8]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="py-[88px]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Principles</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              行動指針
            </h2>
            <div className="grid grid-cols-2 gap-6 mt-11">
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
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Our Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              取材チームを紹介します
            </h2>
            <div className="grid grid-cols-6 gap-4 mt-10">
              {allCasts.map((char, i) => (
                <div key={char.id} className="text-center">
                  <div className={`rounded-[16px] overflow-hidden border-[1.5px] border-[var(--border)] mb-2.5 bg-[var(--bg2)] ${i > 2 ? 'opacity-70' : ''}`}>
                    <Image
                      src={char.portrait}
                      alt={`${char.name}のポートレート`}
                      width={120}
                      height={120}
                      className="w-full object-contain"
                    />
                  </div>
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold text-[var(--text)] mb-0.5">{char.name}</div>
                  <div className="text-[11px] text-[var(--accent)] font-semibold tracking-[.06em]">{char.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
