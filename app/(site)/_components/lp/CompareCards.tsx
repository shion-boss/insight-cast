export function CompareCards() {
  return (
    <section className="cv-auto-section py-14 sm:py-[88px] bg-[var(--bg2)]">
      <div className="mx-auto max-w-[1080px] px-6 sm:px-8 lg:px-12">
        <p className="text-center text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">Comparison</p>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-center mb-12" style={{ fontSize: 'clamp(20px,2.4vw,28px)', lineHeight: 1.65 }}>
          あなたの「悩み」に、どう応えるか。
        </h2>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">

          {/* Card 1: 時間 */}
          <div className="flex flex-col overflow-hidden rounded-[8px] border" style={{ background: 'white', borderColor: '#e2d5c3' }}>
            <div className="border-b px-6 py-6" style={{ background: '#1e1610', borderColor: '#2a1e14' }}>
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-2" style={{ color: '#e8954a' }}>忙しさで悩む方へ</p>
              <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-[1.7]" style={{ color: '#f0e8dc' }}>忙しくて、<br />ブログまで手が回らない</p>
            </div>
            <div className="flex flex-1 flex-col px-6 pt-7">
              <div className="text-center mb-6">
                <div className="flex items-end justify-center gap-1 leading-none">
                  <span className="font-[family-name:var(--font-noto-serif-jp)] font-bold" style={{ fontSize: '64px', color: '#c2722a', lineHeight: 1 }}>20</span>
                  <span className="font-bold pb-1" style={{ fontSize: '22px', color: '#c2722a' }}>分</span>
                </div>
                <p className="mt-2 text-[11px]" style={{ color: '#b8a898' }}>Insight Cast の 1記事あたりの時間</p>
              </div>
              <div className="flex flex-col border-t" style={{ borderColor: '#e2d5c3' }}>
                {[
                  { name: 'ChatGPTに丸投げ', value: '3分',      muted: true,  highlight: false },
                  { name: 'AIツールで書く', value: '1〜2時間', muted: false, highlight: false },
                  { name: 'ライター外注',   value: '1〜2時間', muted: false, highlight: false },
                  { name: 'Insight Cast',   value: '約20分',   muted: false, highlight: true  },
                ].map((r) => (
                  <div key={r.name} className={`grid grid-cols-[1fr_auto] items-center gap-3 py-3 border-b${r.highlight ? ' -mx-6 px-6' : ''}`}
                    style={r.highlight ? { background: '#fff8f0', borderColor: 'rgba(194,114,42,0.2)' } : { borderColor: '#e2d5c3' }}>
                    <span className="text-[12px] leading-[1.5]" style={{ color: r.highlight ? '#c2722a' : '#7a6555', fontWeight: r.highlight ? 700 : 400 }}>{r.name}</span>
                    <span className="text-[11px] font-medium whitespace-nowrap text-right" style={{ color: r.highlight ? '#c2722a' : r.muted ? '#b8a898' : '#7a6555' }}>{r.value}</span>
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
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-2" style={{ color: '#e8954a' }}>言語化で悩む方へ</p>
              <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-[1.7]" style={{ color: '#f0e8dc' }}>自社の強みが、<br />まだ言葉にできていない</p>
            </div>
            <div className="flex flex-1 flex-col px-6 pt-7">
              {/* Hero number */}
              <div className="text-center mb-6">
                <div className="flex items-end justify-center gap-1 leading-none">
                  <span className="font-bold pb-1" style={{ fontSize: '18px', color: '#c2722a' }}>¥</span>
                  <span className="font-[family-name:var(--font-noto-serif-jp)] font-bold" style={{ fontSize: '64px', color: '#c2722a', lineHeight: 1 }}>4,980</span>
                </div>
                <p className="mt-2 text-[11px]" style={{ color: '#b8a898' }}>/ 月　Insight Cast 個人プラン（取材付き）</p>
              </div>
              {/* Comparison rows */}
              <div className="flex flex-col border-t" style={{ borderColor: '#e2d5c3' }}>
                {[
                  { name: 'AIツール',          value: '自分の頭の中だけ',    muted: true,  highlight: false },
                  { name: 'クラウドソーシング',  value: '業界外で深掘り限界',  muted: true,  highlight: false },
                  { name: '取材付きライター',    value: 'できるが ¥30,000〜', muted: false, highlight: false },
                  { name: 'Insight Cast',       value: '業種特化 月¥4,980〜', muted: false, highlight: true  },
                ].map((r) => (
                  <div key={r.name} className={`grid grid-cols-[1fr_auto] items-center gap-3 py-3 border-b${r.highlight ? ' -mx-6 px-6' : ''}`}
                    style={r.highlight ? { background: '#fff8f0', borderColor: 'rgba(194,114,42,0.2)' } : { borderColor: '#e2d5c3' }}>
                    <span className="text-[12px] leading-[1.5]" style={{ color: r.highlight ? '#c2722a' : '#7a6555', fontWeight: r.highlight ? 700 : 400 }}>{r.name}</span>
                    <span className="text-[11px] font-medium whitespace-nowrap text-right" style={{ color: r.highlight ? '#c2722a' : r.muted ? '#b8a898' : '#7a6555' }}>{r.value}</span>
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
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-2" style={{ color: '#e8954a' }}>予算で悩む方へ</p>
              <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-[1.7]" style={{ color: '#f0e8dc' }}>月の予算は、<br />できれば1万円以内に</p>
            </div>
            <div className="flex flex-1 flex-col px-6 pt-7">
              {/* Hero number */}
              <div className="text-center mb-6">
                <div className="flex items-end justify-center gap-1 leading-none">
                  <span className="font-bold pb-1" style={{ fontSize: '18px', color: '#c2722a' }}>¥</span>
                  <span className="font-[family-name:var(--font-noto-serif-jp)] font-bold" style={{ fontSize: '64px', color: '#c2722a', lineHeight: 1 }}>83</span>
                </div>
                <p className="mt-2 text-[11px]" style={{ color: '#b8a898' }}>Insight Cast の 1記事あたりのコスト</p>
              </div>
              {/* Comparison rows */}
              <div className="flex flex-col border-t" style={{ borderColor: '#e2d5c3' }}>
                {[
                  { name: 'HP放置',      value: '何も増えない',     muted: true,  highlight: false },
                  { name: 'AIツール',     value: '月数本の薄い記事', muted: false, highlight: false },
                  { name: 'ライター発注', value: '月1〜2本が限界',   muted: false, highlight: false },
                  { name: 'Insight Cast', value: '月15回・60本の記事', muted: false, highlight: true  },
                ].map((r) => (
                  <div key={r.name} className={`grid grid-cols-[1fr_auto] items-center gap-3 py-3 border-b${r.highlight ? ' -mx-6 px-6' : ''}`}
                    style={r.highlight ? { background: '#fff8f0', borderColor: 'rgba(194,114,42,0.2)' } : { borderColor: '#e2d5c3' }}>
                    <span className="text-[12px] leading-[1.5]" style={{ color: r.highlight ? '#c2722a' : '#7a6555', fontWeight: r.highlight ? 700 : 400 }}>{r.name}</span>
                    <span className="text-[11px] font-medium whitespace-nowrap text-right" style={{ color: r.highlight ? '#c2722a' : r.muted ? '#b8a898' : '#7a6555' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="-mx-6 mt-auto px-6 py-4 text-[12px] leading-[1.75]" style={{ background: '#fdf7f0', color: '#7a6555' }}>
                <strong className="font-bold text-[var(--text)]">1記事あたり ¥83。</strong>続けられる価格にこだわりました。
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
