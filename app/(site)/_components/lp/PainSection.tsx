export function PainSection() {
  return (
    <section className="cv-auto-section py-16 sm:py-[100px] relative overflow-hidden" style={{ background: '#1e1610' }}>
      {/* Subtle horizontal texture */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)' }} />
      {/* Warm orange vignette from bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none" style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--accent) 8%, transparent), transparent)' }} />
      <div className="relative mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-7" style={{ color: 'var(--accent)' }}>Pain</p>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold leading-[1.65] mb-14" style={{ color: '#f0e8dc', fontSize: 'clamp(26px,3.8vw,52px)' }}>
          やる気があっても、<br />
          <span className="relative inline-block">
            <span style={{ color: 'var(--accent)' }}>問い</span>がなければ始まらない。
            <span className="absolute bottom-[1px] left-0 right-0 h-[2px] rounded-[1px]" style={{ background: 'var(--accent)', opacity: 0.6 }} />
          </span>
        </h2>
        <ul className="flex flex-col gap-7">
          {[
            '何を書けばいいか分からない',
            '自分の強みが言葉にならない',
            '毎回ゼロから考えるのがたいへん',
          ].map((text) => (
            <li key={text} className="flex items-start gap-3 text-[15px] sm:text-[17px] leading-[1.6] tracking-[0.02em]" style={{ color: '#c4b4a4' }}>
              <span className="flex-shrink-0 w-[5px] h-[5px] rounded-full mt-[9px]" style={{ background: 'var(--accent)', opacity: 0.6 }} />
              {text}
            </li>
          ))}
        </ul>
        <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold mt-16 flex items-end flex-wrap gap-y-2" style={{ color: '#a07858' }}>
          <span style={{ fontSize: 'clamp(18px,2.4vw,30px)', lineHeight: 1 }}>問いさえあれば....&nbsp;</span>
          <span style={{ fontSize: 'clamp(24px,3.2vw,42px)', color: '#fde8c0', lineHeight: 1 }}>
            <span style={{ color: 'var(--accent)' }}>答え</span>られるのに。
          </span>
        </p>
        {/* TODO: 総務省 情報通信白書の原文で「中小企業 Webサイト 更新頻度」の正確な数値を確認し、必要なら数値・文面を更新する */}
        <div className="mt-12 flex justify-end">
          <p className="text-[11px] leading-[1.7] tracking-[0.01em] whitespace-nowrap" style={{ color: '#7a6558' }}>
            中小企業のうち、Webサイトを「定期的に更新できている」と答えた割合は3割台にとどまる。
            <a
              href="https://www.soumu.go.jp/johotsusintokei/whitepaper/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 ml-1"
              style={{ color: '#7a6558' }}
            >
              総務省「情報通信白書」
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
