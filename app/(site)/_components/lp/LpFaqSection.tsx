import Link from 'next/link'

import { LpFaq } from '../../LpFaq'

const FAQS = [
  { q: '無料でどこまで使えますか？', a: '3名のキャスト（ミント・クラウス・レイン）によるAI取材を2回（単発）ご利用いただけます。取材メモと記事を受け取るところまで無料で体験できます。' },
  { q: '取材はどんな形式で行われますか？', a: 'チャット形式です。キャストが質問を一つずつ投げかけます。資料の準備や専門知識は不要で、ふだん通りに話すだけで大丈夫です。' },
  { q: '届いた記事はそのまま使えますか？', a: 'そのままコピペして投稿できる状態でお届けします。必要であればご自身の言葉に整えていただくことも可能ですが、そのまま使っていただくことを前提に作られています。' },
  { q: '専門用語が多い業種でも大丈夫ですか？', a: 'はい。ふだん話すときと同じ言葉で答えていただくだけで大丈夫です。キャストがうまく引き出して、分かりやすい言葉に整えます。' },
  { q: 'AIが書いた記事はSEO的に大丈夫ですか？', a: 'Insight Cast は「あなた自身の言葉や体験」を素材にするため、Googleが重視する「体験・専門性・信頼性」の基準を自然にクリアできます。どこかから情報を引っ張って書く記事ではなく、あなたにしか語れないことを記事にするので、AI検索の時代でも強い発信になります。' },
  { q: 'どんな業種でも使えますか？', a: 'はい。建設・飲食・医療・美容・士業など業種を問わず対応しています。取材内容はすべてあなた自身の言葉から引き出すため、業種特有の専門知識が不要です。' },
] as const

export function LpFaqSection() {
  return (
    <section className="py-14 sm:py-[88px] bg-[var(--bg)]">
      <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12">
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">FAQ</div>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
          よくある質問
        </h2>
        <div className="mt-10">
          <LpFaq faqs={FAQS} />
        </div>
        <div className="text-center mt-8">
          <Link href="/faq" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
            よくある質問をすべて見る <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
