import Image from 'next/image'
import Link from 'next/link'

import scenePlanning from '@/assets/scene/scene-story-planning.webp'
import { CHARACTERS } from '@/lib/characters'

import { DraggableScrollRow } from '../DraggableScrollRow'

export function InterviewStep() {
  return (
    <section className="cv-auto-section py-14 sm:py-[96px] overflow-hidden" style={{ background: 'linear-gradient(160deg,#fdf8f2 0%,#f0e5d0 100%)' }}>
      <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[520px_minmax(0,1fr)] lg:gap-16">
          <div className="order-2 lg:order-1 relative">
            <div className="rounded-[28px] overflow-hidden shadow-[var(--elevation-5)]">
              <Image src={scenePlanning} alt="AIキャストが机でインタビューの準備をしている様子" width={520} height={520} className="w-full h-auto object-cover" sizes="(min-width: 1160px) 520px, (min-width: 768px) 50vw, 100vw" placeholder="blur" quality={60} />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[var(--elevation-3)]">
              <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">Insight Cast</div>
              <div className="text-[12px] font-bold text-[var(--text)]">今日のインタビューを準備中</div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-4">Step 02 — Interview</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.25]" style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
              今日もAIキャストが、<br />あなたの話を聞きます。
            </h2>
            <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[400px]">
              インタビュアーたちが、毎回あなたの話を聞く準備を整えます。専門知識も、整った言葉も必要ありません。ふだん通りに話すだけで大丈夫です。
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                '話すだけで、自社の強みが言葉になる',
                '構えずに話せる、やさしい取材スタイル',
                '取材後、記事づくりに進める',
              ].map((text) => (
                <li key={text} className="flex items-start gap-3 text-[14px] text-[var(--text2)] leading-[1.7]">
                  <span aria-hidden="true" className="mt-[3px] w-4 h-4 rounded-full bg-[var(--accent-l)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] text-[10px] font-bold">✓</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-14 sm:mt-16">
          <p className="text-[13px] font-semibold text-[var(--text3)] mb-5 tracking-[.04em]">担当するキャストを選ぶ</p>
          <DraggableScrollRow className="flex gap-4 overflow-x-auto pt-2 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CHARACTERS.map((char) => (
              <Link key={char.id} href={`/cast#${char.id}`} className="flex-shrink-0 w-[220px] flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-[18px] p-4 gap-3 transition-colors hover:border-[var(--accent)]/50 hover:shadow-[var(--elevation-3)]">
                <div className="relative w-full aspect-square rounded-[10px] overflow-hidden bg-[var(--bg2)]">
                  <Image src={char.portrait} alt={char.name} fill sizes="188px" className="object-cover object-top" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold text-[var(--text)]">{char.name}</span>
                  <span className="text-[10px] text-[var(--accent)] font-semibold tracking-[.06em]">{char.label}</span>
                  <p className="mt-1 text-[11px] text-[var(--text2)] leading-[1.6] line-clamp-3">{char.description}</p>
                </div>
              </Link>
            ))}
          </DraggableScrollRow>
          <div className="mt-5">
            <Link href="/cast" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
              キャストをすべて見る <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
