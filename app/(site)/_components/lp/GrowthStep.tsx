import Image from 'next/image'

import sceneGrowth from '@/assets/scene/scene-growth-strategy-meeting.webp'

export function GrowthStep() {
  return (
    <section className="cv-auto-section py-14 sm:py-[96px] overflow-hidden">
      <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-16">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-4">Step 03 — Growth</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.25]" style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
              積み重ねるたびに、<br />ホームページが強くなる。
            </h2>
            <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[400px]">
              一回の取材で終わりではありません。取材を重ねるほど、「自社だけの話」がホームページに増え、検索でも口コミでも信頼されやすくなっていきます。
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { label: '語れることが増える', body: '取材のたびに、自社を説明する言葉の引き出しが一つずつ増えていきます。' },
                { label: '競合との差が言葉になる', body: '何度も比較と取材を重ねることで、なぜ選ばれるのかが明確になっていきます。' },
                { label: '更新が止まらなくなる', body: 'キャストが毎回準備してくれるので、ネタ切れも書く手間もありません。' },
                { label: '一次情報が資産になる', body: '事業者本人の言葉から作られた記事は、大手にも競合にも真似できない蓄積です。' },
              ].map((item) => (
                <div key={item.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-4 py-4">
                  <div className="text-[12px] font-bold text-[var(--on-primary-container)] mb-1">{item.label}</div>
                  <div className="text-[12px] text-[var(--text2)] leading-[1.65]">{item.body}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[28px] overflow-hidden shadow-[var(--elevation-5)]">
              <Image src={sceneGrowth} alt="キャストたちがホームページ成長戦略を立てている様子" width={520} height={520} className="w-full h-auto object-cover" sizes="(min-width: 1160px) 520px, (min-width: 768px) 50vw, 100vw" placeholder="blur" quality={60} />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[var(--elevation-3)]">
              <div className="text-[10px] font-semibold text-[var(--on-primary-container)] uppercase tracking-[.08em] mb-1">Site Growth</div>
              <div className="text-[12px] font-bold text-[var(--text)]">競合との差、見えてきました</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
