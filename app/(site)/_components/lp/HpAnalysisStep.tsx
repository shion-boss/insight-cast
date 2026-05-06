import Image from 'next/image'

import sceneAnalysis from '@/assets/scene/scene-competitor-analysis.webp'

export function HpAnalysisStep() {
  return (
    <section className="cv-auto-section py-14 sm:py-[96px] overflow-hidden bg-[var(--bg2)]">
      <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-16">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-4">Step 01 — HP Analysis</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.25]" style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
              まず、あなたのHPと<br />競合を調べます。
            </h2>
            <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[400px]">
              プロジェクトを登録すると、今のホームページで何が足りないかを分析し、競合との違いを整理できます。「何が足りないか」「どこを強化すべきか」が、取材の前に見えやすくなります。
            </p>
            <div className="mt-7 space-y-3.5">
              {[
                { label: '現状評価', body: '情報量・訴求の強さ・不足コンテンツを可視化' },
                { label: '競合比較', body: '同業他社と並べて、差別化ポイントを特定' },
                { label: '取材テーマ提案', body: '分析結果をもとに、何を取材すべきかを提案' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3.5">
                  <span className="mt-[5px] w-[6px] h-[6px] rounded-full bg-[var(--accent)] flex-shrink-0" />
                  <div>
                    <span className="text-[13px] font-bold text-[var(--text)]">{item.label}</span>
                    <span className="text-[13px] text-[var(--text2)] ml-2">{item.body}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[28px] overflow-hidden shadow-[var(--elevation-5)]">
              <Image src={sceneAnalysis} alt="クラウスとレインが競合ホームページを分析している様子" width={520} height={520} className="w-full h-auto object-cover" sizes="(min-width: 1160px) 520px, (min-width: 768px) 50vw, 100vw" placeholder="blur" quality={60} />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[var(--elevation-3)]">
              <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">Competitor Analysis</div>
              <div className="text-[12px] font-bold text-[var(--text)]">競合3社の調査完了</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
