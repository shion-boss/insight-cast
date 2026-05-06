export function SolutionBridge() {
  return (
    <section className="cv-auto-section py-16 sm:py-[100px] relative overflow-hidden" style={{ background: '#fdf7f0' }}>
      {/* Watercolor wash top-right */}
      <div className="absolute pointer-events-none" style={{ top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, oklch(0.82 0.07 55 / 0.18), transparent 70%)' }} />
      <div className="relative mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: 'var(--on-primary-container)' }}>Solution</p>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold leading-[1.5] mb-12 relative pl-5" style={{ color: 'var(--on-surface)', fontSize: 'clamp(32px,4.5vw,60px)' }}>
          <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-[2px]" style={{ background: 'var(--primary)' }} />
          Insight Castなら、<br />取材に答えるだけ。
        </h2>
        <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-16 xl:gap-24">
          <ul className="mb-10 lg:mb-0 border-t" style={{ borderColor: 'var(--outline)' }}>
            {[
              '何を書くか、考えなくていい。',
              '強みを言葉にしなくていい。',
              'AIキャストが聞くので、話すだけでいい。',
            ].map((text) => (
              <li key={text} className="flex items-center justify-between gap-3 py-5 border-b text-[16px] sm:text-[18px] font-medium leading-[1.5] tracking-[0.02em]" style={{ borderColor: 'var(--outline)', color: 'var(--on-surface)' }}>
                <span className="flex-1">{text}</span>
                <span className="flex-shrink-0 w-[24px] h-[24px] rounded-full flex items-center justify-center" style={{ background: 'rgba(194,114,42,0.15)' }}>
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                    <path d="M1 4L4.5 7.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}/>
                  </svg>
                </span>
              </li>
            ))}
          </ul>
          <div className="rounded-[12px] p-6 sm:p-8 relative self-start" style={{ background: '#f5e8d8' }}>
            <span className="absolute pointer-events-none select-none font-[family-name:var(--font-noto-serif-jp)]" style={{ fontSize: '64px', color: 'var(--primary)', opacity: 0.18, top: '4px', left: '16px', lineHeight: 1 }}>&#8220;</span>
            <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] sm:text-[16px] leading-[1.9] tracking-[0.02em] pl-2 relative" style={{ color: 'var(--on-surface-variant)' }}>
              あなたの<strong style={{ color: 'var(--on-surface)', fontWeight: 700 }}>「当たり前」</strong>の中に、<br />
              まだ伝わっていない強みがあります。<br />
              AIキャストが引き出して、記事にします。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
