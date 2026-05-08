export function EeatSection() {
  return (
    <section className="cv-auto-section py-14 sm:py-[88px] bg-white">
      <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">E-E-A-T</div>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)] leading-[1.4]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
          AIが作った記事は評価されない？
        </h2>
        {/* E-E-A-T subheader */}
        <h3 className="mt-6 font-[family-name:var(--font-noto-serif-jp)] text-[20px] font-bold leading-[1.65] text-[var(--text)] sm:text-[26px]">
          <span style={{ color: 'var(--accent)' }}>あなた自身の言葉と体験</span>が素材だから、<br />Googleが重視する4つの基準を<span style={{ color: 'var(--accent)' }}>自然にクリアできる。</span>
        </h3>

        {/* E-E-A-T table */}
        <table className="mt-12 w-full border-collapse" style={{ borderTop: '1px solid #e2d5c3' }}>
          <caption className="sr-only">E-E-A-T基準とInsight Castの対応</caption>
          <thead className="max-sm:hidden">
            <tr>
              {(['基準', '定義', 'Insight Cast の記事'] as const).map((h, i) => (
                <th key={i} className={`py-3 text-left text-xs font-bold tracking-[0.12em] uppercase${i === 2 ? ' pl-4' : ''}`} style={{ color: 'var(--on-surface-variant)', borderBottom: '1px solid #e2d5c3', width: i === 0 ? 120 : i === 1 ? 160 : 260 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { letter: 'E', ja: '体験',   en: 'Experience',        criterion: '実際の体験・経験に基づいているか',     answer: '事業者本人が取材に答えている' },
              { letter: 'E', ja: '専門性', en: 'Expertise',         criterion: 'その分野の専門知識・現場知識があるか', answer: 'あなたの現場知識が素材になる' },
              { letter: 'A', ja: '権威性', en: 'Authoritativeness', criterion: '信頼される発信者として語られているか', answer: 'あなた自身の言葉で語られている' },
              { letter: 'T', ja: '信頼性', en: 'Trustworthiness',   criterion: '情報が正確で誠実か',                   answer: '作り話でなく体験から引き出す' },
            ].map((row, i) => (
              <tr key={i} className="max-sm:flex max-sm:flex-col max-sm:gap-2.5 max-sm:py-5" style={{ borderBottom: '1px solid #e2d5c3' }}>
                {/* Badge */}
                <td className="w-[120px] py-7 align-top max-sm:w-auto max-sm:py-0">
                  <div className="flex items-center gap-3">
                    <span className="w-9 flex-shrink-0 font-[family-name:var(--font-noto-serif-jp)] font-bold leading-none" style={{ fontSize: '32px', color: 'var(--accent)' }}>{row.letter}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-bold leading-none text-[var(--text)]">{row.ja}</span>
                      <span className="text-xs tracking-[0.06em]" style={{ color: 'var(--on-surface-variant)' }}>{row.en}</span>
                    </div>
                  </div>
                </td>
                {/* Criterion */}
                <td className="w-[160px] py-7 pr-6 align-top text-[13px] leading-[1.7] max-sm:w-auto max-sm:py-0 max-sm:pr-0" style={{ color: '#7a6555' }}>{row.criterion}</td>
                {/* Answer */}
                <td className="w-[260px] pl-4 py-7 align-top max-sm:w-auto max-sm:pl-0 max-sm:py-0">
                  <span className="inline-flex items-start gap-2 rounded-[5px] px-3.5 py-2.5 text-[13px] font-medium leading-[1.6] text-[var(--text)]" style={{ background: '#fff8f0', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                    <span className="mt-[1px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--accent)' }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 3.5L4 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {row.answer}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex justify-end">
          <p className="text-xs text-[var(--text2)] leading-[1.7]">
            参考：<a href="https://developers.google.com/search/blog/2023/02/google-search-and-ai-content" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[var(--accent)] transition-colors">Google Search&apos;s guidance about AI-generated content（Google Search Central）</a>
          </p>
        </div>

        {/* Footer card */}
        <div className="mt-9 flex items-center gap-3.5 rounded-[6px] px-6 py-5 text-[13px] leading-[1.8]" style={{ background: '#f5e8d8', color: '#7a6555' }}>
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[var(--accent)]" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="8.2" y="8" width="1.6" height="5" rx="0.8" fill="currentColor"/>
              <rect x="8.2" y="5" width="1.6" height="1.6" rx="0.8" fill="currentColor"/>
            </svg>
          </span>
          <p>AIが生成した一般的な記事では満たせない基準を、<strong className="font-bold text-[var(--text)]">あなたへの取材</strong>というプロセスが自然にクリアします。</p>
        </div>

      </div>
    </section>
  )
}
