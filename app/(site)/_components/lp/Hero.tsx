import Image from 'next/image'
import Link from 'next/link'

import sceneCastTeam from '@/assets/scene/scene-cast-team.png'

export function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="pt-[52px] pb-[56px] sm:pt-[68px] sm:pb-[72px] lg:pt-[88px] lg:pb-[88px]" style={{ background: 'linear-gradient(140deg,#fdf8f2 0%,#f6e9d8 55%,#ede0cc 100%)' }}>
      <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-14">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-l)] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--accent)] mb-6">
              <span aria-hidden="true">✦</span> AIキャストが取材します
            </div>
            <h1 className="font-[family-name:var(--font-noto-serif-jp)] leading-[1.14] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(34px,4vw,54px)' }}>
              会話から、記事へ。<br /><em className="text-[var(--accent)] not-italic">あなたの当たり前を言葉に。</em>
            </h1>
            <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-6 max-w-[420px]">
              AI検索の時代でも、あなた自身の言葉だけは、真似できない。Insight Castが、その価値を引き出して記事にします。
            </p>
            <div className="flex gap-3 mt-8 flex-wrap">
              <Link href={isLoggedIn ? '/dashboard' : '/auth/signup'} className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-7 py-3.5 text-sm font-semibold transition-colors inline-flex items-center shadow-[0_4px_24px_rgba(0,0,0,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                {isLoggedIn ? <>ダッシュボードへ <span aria-hidden="true">→</span></> : <>カード不要・無料で体験する <span aria-hidden="true">→</span></>}
              </Link>
              <Link href="/cast" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3.5 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                キャストを見る
              </Link>
            </div>
            <div className="mt-9 grid grid-cols-3 gap-x-3 gap-y-4 border-t border-[var(--border)]/70 pt-8 sm:gap-x-9">
              {[
                { n: '3名', l: '無料キャスト' },
                { n: '約20分', l: '平均取材時間' },
                { n: '¥0', l: 'カード不要で始められる' },
              ].map((item) => (
                <div key={item.l} className="min-w-0">
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-[24px] sm:text-[28px] font-bold text-[var(--accent)] leading-none">{item.n}</div>
                  <div className="text-[11px] text-[var(--text2)] mt-1.5 font-medium leading-[1.4]">{item.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cast team visual */}
          <div className="order-1 lg:order-2 relative overflow-visible py-3 px-3 sm:py-0 sm:px-0">
            <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.14)]">
              <Image
                src={sceneCastTeam}
                alt="Insight CastのAIキャスト6名が集合している様子"
                width={520}
                height={520}
                className="w-full h-auto object-cover"
                sizes="(min-width: 1024px) 480px, 100vw"
                priority
              />
            </div>
            <div className="hidden sm:block absolute -bottom-4 -left-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.10)]">
              <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">Insight Cast</div>
              <div className="text-[12px] font-bold text-[var(--text)]">AIキャストがそろっています</div>
            </div>
            <div className="hidden sm:block absolute -top-3 -right-3 bg-[var(--teal-l)] border border-[var(--teal)]/30 rounded-[12px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
              <div className="text-[11px] font-bold text-[var(--teal)]">6名のキャスト</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
