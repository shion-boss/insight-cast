export function CompareCards() {
  return (
    <section className="cv-auto-section py-14 sm:py-[88px] bg-[var(--surface2)]">
      <div className="mx-auto max-w-[1080px] px-6 sm:px-8 lg:px-12">
        <p className="text-center text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">Comparison</p>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-center mb-4" style={{ fontSize: 'clamp(20px,2.4vw,28px)', lineHeight: 1.65 }}>
          あなたの「悩み」に、どう応えるか。
        </h2>
        <p className="text-center text-[14px] leading-[1.85] text-[var(--text2)] mb-12 max-w-[480px] mx-auto">
          AIツールも記事代行も、「すでに材料がある人」向けです。Insight Cast は「何が強みか分からない」という手前から始めます。
        </p>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">

          {/* Card 1: 時間 */}
          <div className="flex flex-col overflow-hidden rounded-[8px] border" style={{ background: 'white', borderColor: '#e2d5c3' }}>
            <div className="border-b px-6 py-6" style={{ background: '#1e1610', borderColor: '#2a1e14' }}>
              <p className="text-xs font-bold tracking-[0.14em] uppercase mb-2" style={{ color: 'var(--accent)' }}>忙しさで悩む方へ</p>
              <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-[1.7]" style={{ color: '#f0e8dc' }}>忙しくて、<br />ブログまで手が回らない</p>
            </div>
            <div className="flex flex-1 flex-col px-6 pt-7">
              <div className="text-center mb-6">
                <div className="flex items-end justify-center gap-1 leading-none">
                  <span className="font-[family-name:var(--font-noto-serif-jp)] font-bold" style={{ fontSize: '64px', color: 'var(--accent)', lineHeight: 1 }}>20</span>
                  <span className="font-bold pb-1" style={{ fontSize: '22px', color: 'var(--accent)' }}>分</span>
                </div>
                <p className="mt-2 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>Insight Cast の 1記事あたりの時間</p>
              </div>
              <div className="flex flex-col border-t" style={{ borderColor: '#e2d5c3' }}>
                {[
                  { name: 'AIに丸投げ',     value: '3分',      muted: true,  highlight: false },
                  { name: '自分で書く',     value: '1〜2時間', muted: false, highlight: false },
                  { name: 'ライター外注',   value: '1〜2時間', muted: false, highlight: false },
                  { name: 'Insight Cast',   value: '約20分',   muted: false, highlight: true  },
                ].map((r) => (
                  <div key={r.name} className={`grid grid-cols-[1fr_auto] items-center gap-3 py-3 border-b${r.highlight ? ' -mx-6 px-6' : ''}`}
                    style={r.highlight ? { background: '#fff8f0', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' } : { borderColor: 'var(--outline)' }}>
                    <span className="text-[12px] leading-[1.5]" style={{ color: r.highlight ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', fontWeight: r.highlight ? 700 : 400 }}>{r.name}</span>
                    <span className="text-[11px] font-medium whitespace-nowrap text-right" style={{ color: r.highlight ? 'var(--on-primary-container)' : r.muted ? 'var(--on-surface-variant)' : 'var(--on-surface-variant)' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="-mx-6 mt-auto px-6 py-4 text-[12px] leading-[1.75]" style={{ background: '#fdf7f0', color: '#7a6555' }}>
                チャットで答えるだけ。<strong className="font-bold text-[var(--text)]">資料も整った言葉も要りません。</strong>
              </p>
            </div>
          </div>

          {/* Card 2: 言語化 */}
          <div className="flex flex-col overflow-hidden rounded-[8px] border" style={{ background: 'white', borderColor: '#e2d5c3' }}>
            <div className="border-b px-6 py-6" style={{ background: '#1e1610', borderColor: '#2a1e14' }}>
              <p className="text-xs font-bold tracking-[0.14em] uppercase mb-2" style={{ color: 'var(--accent)' }}>言語化で悩む方へ</p>
              <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-[1.7]" style={{ color: '#f0e8dc' }}>自社の強みが、<br />まだ言葉にできていない</p>
            </div>
            <div className="flex flex-1 flex-col px-6 pt-7">
              {/* Hero number */}
              <div className="text-center mb-6">
                <div className="flex items-end justify-center gap-1 leading-none">
                  <span className="font-[family-name:var(--font-noto-serif-jp)] font-bold" style={{ fontSize: '64px', color: 'var(--accent)', lineHeight: 1 }}>3,000</span>
                  <span className="font-bold pb-1" style={{ fontSize: '22px', color: 'var(--accent)' }}>文字+</span>
                </div>
                <p className="mt-2 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>原稿用紙1枚（400文字）が、会話から7枚以上</p>
              </div>
              {/* Comparison rows */}
              <div className="flex flex-col border-t" style={{ borderColor: '#e2d5c3' }}>
                {[
                  { name: 'ビジネスメール1通',   value: '200文字',                    muted: true,  highlight: false },
                  { name: '原稿用紙1枚',        value: '400文字',                    muted: true,  highlight: false },
                  { name: '10分間スピーチ',     value: '3,000文字',                  muted: false, highlight: false },
                  { name: 'Insight Cast',       value: '3,000文字+',                muted: false, highlight: true  },
                ].map((r) => (
                  <div key={r.name} className={`grid grid-cols-[1fr_auto] items-center gap-3 py-3 border-b${r.highlight ? ' -mx-6 px-6' : ''}`}
                    style={r.highlight ? { background: '#fff8f0', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' } : { borderColor: 'var(--outline)' }}>
                    <span className="text-[12px] leading-[1.5]" style={{ color: r.highlight ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', fontWeight: r.highlight ? 700 : 400 }}>{r.name}</span>
                    <span className="text-[11px] font-medium whitespace-nowrap text-right" style={{ color: r.highlight ? 'var(--on-primary-container)' : r.muted ? 'var(--on-surface-variant)' : 'var(--on-surface-variant)' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="-mx-6 mt-auto px-6 py-4 text-[12px] leading-[1.75]" style={{ background: '#fdf7f0', color: '#7a6555' }}>
                「当たり前」と思っていた中から、<strong className="font-bold text-[var(--text)]">伝わっていない価値を引き出します。</strong>
              </p>
            </div>
          </div>

          {/* Card 3: 予算 — 結論カード */}
          <div className="flex flex-col overflow-hidden rounded-[8px] border" style={{ background: 'white', borderColor: '#e2d5c3' }}>
            <div className="border-b px-6 py-6" style={{ background: '#1e1610', borderColor: '#2a1e14' }}>
              <p className="text-xs font-bold tracking-[0.14em] uppercase mb-2" style={{ color: 'var(--accent)' }}>予算で悩む方へ</p>
              <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-[1.7]" style={{ color: '#f0e8dc' }}>月の予算は、<br />できれば1万円以内に</p>
            </div>
            <div className="flex flex-1 flex-col px-6 pt-7">
              {/* Hero number */}
              <div className="text-center mb-6">
                <div className="flex items-end justify-center gap-1 leading-none">
                  <span className="font-bold pb-1" style={{ fontSize: '18px', color: 'var(--accent)' }}>¥</span>
                  <span className="font-[family-name:var(--font-noto-serif-jp)] font-bold" style={{ fontSize: '64px', color: 'var(--accent)', lineHeight: 1 }}>166</span>
                  <span className="font-bold pb-1" style={{ fontSize: '22px', color: 'var(--accent)' }}>/記事</span>
                </div>
                <p className="mt-2 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>月¥4,980で取材込み（個人プラン）</p>
              </div>
              {/* Comparison rows */}
              <div className="flex flex-col border-t" style={{ borderColor: '#e2d5c3' }}>
                {[
                  { name: '自分で書く',         value: '¥0',                     muted: true,  highlight: false },
                  { name: 'AIツール',           value: '¥1,000/記事',            muted: false, highlight: false },
                  { name: 'ライター発注',       value: '¥5,000/記事',            muted: false, highlight: false },
                  { name: 'Insight Cast',      value: '¥166/記事 取材込み',     muted: false, highlight: true  },
                ].map((r) => (
                  <div key={r.name} className={`grid grid-cols-[1fr_auto] items-center gap-3 py-3 border-b${r.highlight ? ' -mx-6 px-6' : ''}`}
                    style={r.highlight ? { background: '#fff8f0', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' } : { borderColor: 'var(--outline)' }}>
                    <span className="text-[12px] leading-[1.5]" style={{ color: r.highlight ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', fontWeight: r.highlight ? 700 : 400 }}>{r.name}</span>
                    <span className="text-[11px] font-medium whitespace-nowrap text-right" style={{ color: r.highlight ? 'var(--on-primary-container)' : r.muted ? 'var(--on-surface-variant)' : 'var(--on-surface-variant)' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="-mx-6 mt-auto px-6 py-4 text-[12px] leading-[1.75]" style={{ background: '#fdf7f0', color: '#7a6555' }}>
                <strong className="font-bold text-[var(--text)]">ライター1記事分の予算で、</strong>毎月続けられる。
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
