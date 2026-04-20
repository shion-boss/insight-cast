import Link from 'next/link'
import { redirect } from 'next/navigation'

import Image from 'next/image'
import { CharacterAvatar } from '@/components/ui'
import { PublicFooter, PublicHeader, PublicPageFrame } from '@/components/public-layout'
import AppPreviewSection from '@/components/app-preview-section'
import { CHARACTERS } from '@/lib/characters'
import scenePlanning from '@/assets/scene/scene-story-planning.png'
import sceneGrowth from '@/assets/scene/scene-growth-strategy-meeting.png'
import sceneAnalysis from '@/assets/scene/scene-competitor-analysis.png'
import sceneCastTeam from '@/assets/scene/scene-cast-team.png'
import { POSTS, CATEGORY_LABELS } from '@/lib/blog-posts'
import { createClient } from '@/lib/supabase/server'

const freeCast = CHARACTERS.filter((char) => char.available)
const addonCast = CHARACTERS.filter((char) => !char.available)

const PAIN_ITEMS = [
  { n: '01', title: '「何を書けばいいか分からない」', body: 'ブログを書こうと思っても、「今さら何を書くの？」と手が止まる。' },
  { n: '02', title: '「取材・撮影が大変で後回しになる」', body: '更新しようと思うたびに写真を撮ったり文章を考えたり。疲れて結局後回し。' },
  { n: '03', title: '「自社の強みを言葉にできない」', body: '自分の仕事には特別なことなんてない、と思ってしまう。でも、それが一番伝わっていない価値かもしれない。' },
] as const

const OUTCOME_ITEMS = [
  { icon: '💬', title: '当たり前の中に眠る価値が言葉になる', body: 'AIキャストが丁寧に取材することで、気づかなかった自社の強みが見えてきます。' },
  { icon: '📄', title: '記事の素材が手元に届く', body: '取材から記事の素材を自動生成。「何を書くか」を悩む時間がなくなります。' },
  { icon: '📈', title: 'ホームページが少しずつ育っていく', body: '定期的な取材で情報を積み重ね、問い合わせにつながるコンテンツ資産になります。' },
] as const

const WORKFLOW_ITEMS = [
  { n: '01', title: 'HPを分析する', body: 'URLを入力するだけで、AIが現状のホームページと競合サイトを調査し、何が足りないかを可視化します。' },
  { n: '02', title: 'AIが取材する', body: 'キャストがチャット形式で丁寧に質問。専門知識なしで話すだけで、隠れた価値を引き出します。' },
  { n: '03', title: '記事素材を届ける', body: '取材メモをもとに記事の素材を生成。整えてホームページに載せるだけで完成します。' },
] as const

const COMPARE_ROWS = [
  { label: '「何を書くか」を考えなくていい',  ai: false, none: false },
  { label: '自社だけの一次情報が使われる',     ai: false, none: true  },
  { label: '専門知識がなくても使える',          ai: true,  none: false },
  { label: '継続しやすい（止まりにくい）',      ai: false, none: false },
  { label: 'ホームページの現状分析つき',        ai: false, none: false },
  { label: '費用がかかる',                      ai: false, none: false },
] as const

const PLANS = [
  {
    name: '無料プラン',
    price: '¥0',
    period: '',
    desc: 'まず試してみたい方へ',
    features: ['月2回までAI取材', '3名のキャスト（ミント・クラウス・レイン）', '取材メモの生成', '記事素材の生成'],
    cta: '無料で始める',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Basicプラン',
    price: '¥30,000',
    period: '/ 月',
    desc: '週1本ペースで更新したい方へ',
    features: ['月4回までAI取材', '全3名のキャスト使い放題', '取材メモ・記事素材の生成', 'HP分析レポート', 'メールサポート'],
    cta: 'このプランで始める',
    href: '/auth/signup',
    highlight: true,
  },
  {
    name: 'Proプラン',
    price: '¥50,000',
    period: '/ 月',
    desc: '週2本以上のペースで強化したい方へ',
    features: ['月8回までAI取材', '全キャスト使い放題（追加キャスト含む）', '取材メモ・記事素材の生成', 'HP分析レポート（毎月更新）', '優先サポート'],
    cta: 'このプランで始める',
    href: '/auth/signup',
    highlight: false,
  },
] as const

const FAQS = [
  { q: '無料でどこまで使えますか？', a: '3名のキャスト（ミント・クラウス・レイン）によるAI取材を月2回ご利用いただけます。取材メモと記事素材の生成まで無料で体験できます。' },
  { q: '取材はどんな形式で行われますか？', a: 'チャット形式です。キャストが質問を一つずつ投げかけます。資料の準備や専門知識は不要で、お話しするだけで価値を引き出します。' },
  { q: '届いた記事素材はそのまま使えますか？', a: 'そのままホームページやブログに貼って使えます。少し手を加えるとより自然な文体になりますが、時間がなければそのままでも十分です。' },
  { q: '専門用語が多い業種でも大丈夫ですか？', a: 'クラウスは業種の専門知識を背景に取材します。専門用語を使わずに話していただければ、価値を分かりやすく言語化します。' },
  { q: '途中でキャンセルできますか？', a: '有料プランは月次のサブスクリプションです。いつでもキャンセル可能で、翌月から課金は発生しません。' },
  { q: 'どんな業種でも使えますか？', a: 'はい。建設・飲食・医療・美容・士業など業種を問わず対応しています。取材内容はすべてあなた自身の言葉から引き出すため、業種特有の専門知識が不要です。' },
] as const

export default async function LandingPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/dashboard')
  } catch {
    // 公開トップは認証失敗時も表示する
  }

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">

        {/* ① Hero */}
        <section style={{ padding: '112px 0 88px', background: 'linear-gradient(140deg,#fdf8f2 0%,#f6e9d8 55%,#ede0cc 100%)' }}>
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="grid items-center gap-14" style={{ gridTemplateColumns: '1fr 480px' }}>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-l)] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--accent)] mb-6">
                  ✦ AI取材サービス
                </div>
                <h1 className="font-[family-name:var(--font-noto-serif-jp)] leading-[1.14] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(34px,4vw,54px)' }}>
                  あなたの「当たり前」に、<br /><em className="text-[var(--accent)] not-italic">まだ伝わっていない</em><br />価値がある。
                </h1>
                <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-6 max-w-[420px]">
                  AIキャストが丁寧に取材して、あなたの話を「ホームページに載せられる文章」に整えます。ホームページを更新し続けるための、一番やさしい方法です。
                </p>
                <div className="flex gap-3 mt-8 flex-wrap">
                  <Link href="/auth/signup" className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-7 py-3.5 text-sm font-semibold transition-colors inline-flex items-center shadow-[0_4px_24px_rgba(0,0,0,.12)]">
                    無料で取材を体験する →
                  </Link>
                  <Link href="/cast" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3.5 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
                    キャストを見る
                  </Link>
                </div>
                <div className="flex gap-9 mt-9 pt-8 border-t border-[var(--border)]/70">
                  {[
                    { n: '3名', l: '無料キャスト' },
                    { n: '20分', l: '平均取材時間' },
                    { n: '無料', l: 'まず始められる' },
                  ].map((item) => (
                    <div key={item.l}>
                      <div className="font-[family-name:var(--font-noto-serif-jp)] text-[28px] font-bold text-[var(--accent)] leading-none">{item.n}</div>
                      <div className="text-[11px] text-[var(--text2)] mt-1.5 font-medium">{item.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cast team visual */}
              <div className="relative">
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.14)]">
                  <Image
                    src={sceneCastTeam}
                    alt="Insight Castの取材班6名が集合している様子"
                    width={520}
                    height={520}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                  <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">Insight Cast</div>
                  <div className="text-[12px] font-bold text-[var(--text)]">取材班、全員集合</div>
                </div>
                <div className="absolute -top-3 -right-3 bg-[var(--teal-l)] border border-[var(--teal)]/30 rounded-[12px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
                  <div className="text-[11px] font-bold text-[var(--teal)]">6名のキャスト</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ② Pain */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Pain Points</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              ホームページが止まっている、<br />よくある理由
            </h2>
            <div className="grid grid-cols-3 gap-5 mt-11">
              {PAIN_ITEMS.map((item) => (
                <div key={item.n} className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] p-8">
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-[44px] font-bold text-[var(--border)] leading-none mb-4">{item.n}</div>
                  <h3 className="text-[17px] font-bold text-[var(--text)] mb-2.5 leading-[1.4]">{item.title}</h3>
                  <p className="text-sm text-[var(--text2)] leading-[1.8]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ③ Outcome */}
        <section className="py-[88px]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">What You Get</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              Insight Cast を使うと
            </h2>
            <div className="grid grid-cols-3 gap-5 mt-11">
              {OUTCOME_ITEMS.map((item) => (
                <div key={item.title} className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] p-8 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-[var(--accent)]">
                  <div className="w-10 h-10 rounded-[10px] bg-[var(--accent-l)] flex items-center justify-center text-xl mb-5">{item.icon}</div>
                  <h3 className="text-[17px] font-bold text-[var(--text)] mb-2.5 leading-[1.45]">{item.title}</h3>
                  <p className="text-sm text-[var(--text2)] leading-[1.8]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ④ Workflow */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">How It Works</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              たった3ステップで、<br />記事の素材が届く
            </h2>
            <div className="grid grid-cols-3 relative mt-14">
              <div className="absolute top-[44px] left-[calc(16.67%+8px)] right-[calc(16.67%+8px)] h-px bg-[var(--border)]" aria-hidden="true" />
              {WORKFLOW_ITEMS.map((item) => (
                <div key={item.n} className="text-center px-8">
                  <div className="w-[88px] h-[88px] rounded-full bg-[var(--surface)] border-[1.5px] border-[var(--border)] flex items-center justify-center mx-auto mb-6 font-[family-name:var(--font-noto-serif-jp)] text-[22px] font-bold text-[var(--accent)] relative z-[1]">
                    {item.n}
                  </div>
                  <h3 className="text-[19px] font-bold text-[var(--text)] mb-3">{item.title}</h3>
                  <p className="text-sm text-[var(--text2)] leading-[1.85]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ Competitor Analysis Scene — text left, image right */}
        <section className="py-[96px] overflow-hidden bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="grid items-center gap-16" style={{ gridTemplateColumns: '1fr 520px' }}>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-4">Step 01 — HP Analysis</div>
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.25]" style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
                  まず、あなたのHPと<br />競合を調べます。
                </h2>
                <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[400px]">
                  URLを入力するだけで、AIが現状のホームページを分析し、競合との違いを整理します。「何が足りないか」「どこを強化すべきか」が、取材の前に明らかになります。
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
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.13)]">
                  <Image src={sceneAnalysis} alt="クラウスとレインが競合ホームページを分析している様子" width={520} height={520} className="w-full h-auto object-cover" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                  <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">Competitor Analysis</div>
                  <div className="text-[12px] font-bold text-[var(--text)]">競合3社の調査完了</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑤ Planning Scene — image left, text right */}
        <section className="py-[96px] overflow-hidden" style={{ background: 'linear-gradient(160deg,#fdf8f2 0%,#f0e5d0 100%)' }}>
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="grid items-center gap-16" style={{ gridTemplateColumns: '520px 1fr' }}>
              <div className="relative">
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.13)]">
                  <Image src={scenePlanning} alt="取材班が机で取材の準備をしている様子" width={520} height={520} className="w-full h-auto object-cover" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                  <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">Insight Cast</div>
                  <div className="text-[12px] font-bold text-[var(--text)]">今日の取材準備中</div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-4">Step 02 — Interview</div>
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.25]" style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
                  今日も取材班が、<br />あなたの話を聞きにいきます。
                </h2>
                <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[400px]">
                  動物モチーフのインタビュアーたちが、毎回真剣に準備してあなたのもとへ向かいます。専門知識も、整った言葉も必要ありません。ただ話してください。
                </p>
                <ul className="mt-7 space-y-3.5">
                  {[
                    '話すだけで、自社の強みが言葉になる',
                    '構えずに話せる、やさしい取材スタイル',
                    '取材後すぐに記事素材が届く',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-3 text-[14px] text-[var(--text2)] leading-[1.7]">
                      <span className="mt-[3px] w-4 h-4 rounded-full bg-[var(--accent-l)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] text-[10px] font-bold">✓</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ⑦ Growth Scene — text left, image right */}
        <section className="py-[96px] overflow-hidden">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="grid items-center gap-16" style={{ gridTemplateColumns: '1fr 520px' }}>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-4">Step 03 — Growth</div>
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.25]" style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
                  積み重ねるたびに、<br />ホームページが強くなる。
                </h2>
                <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[400px]">
                  一回の取材で終わりではありません。取材を重ねるほど、あなたのホームページには一次情報が蓄積され、検索でも口コミでも「信頼できる」と思われやすくなっていきます。
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { label: 'HP現状分析', body: '今のホームページで何が足りないかを可視化' },
                    { label: '競合比較', body: '同業他社との違いを客観的に整理' },
                    { label: '取材メモ', body: '引き出した一次情報をそのまま記録' },
                    { label: '記事素材', body: 'ブログや実績ページにそのまま使える文章' },
                  ].map((item) => (
                    <div key={item.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-4 py-4">
                      <div className="text-[12px] font-bold text-[var(--accent)] mb-1">{item.label}</div>
                      <div className="text-[12px] text-[var(--text2)] leading-[1.65]">{item.body}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.13)]">
                  <Image src={sceneGrowth} alt="キャストたちがホームページ成長戦略を立てている様子" width={520} height={520} className="w-full h-auto object-cover" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                  <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">HP Growth</div>
                  <div className="text-[12px] font-bold text-[var(--text)]">競合との差、見えてきました</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑧ App Preview */}
        <AppPreviewSection />

        {/* ⑨ Output Example */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Output Example</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              こんな記事素材が届きます
            </h2>
            <p className="text-base text-[var(--text2)] mt-3 max-w-[520px]">実際の取材の流れと、そこから届く記事素材の例です。</p>
            <div className="grid grid-cols-2 gap-8 mt-11">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] overflow-hidden">
                <div className="px-[22px] py-4 border-b border-[var(--border)] bg-[var(--bg2)] flex items-center gap-2.5">
                  <CharacterAvatar src={freeCast[0]?.icon48} alt={`${freeCast[0]?.name ?? 'ミント'}のアイコン`} emoji={freeCast[0]?.emoji} size={28} />
                  <span className="text-[13px] font-bold text-[var(--text)]">{freeCast[0]?.name ?? 'ミント'}の取材ログ</span>
                  <span className="ml-auto bg-[var(--teal-l)] text-[var(--teal)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">完了</span>
                </div>
                <div className="p-[22px]">
                  {[
                    { q: 'Q. お客様に一番喜んでもらえた仕事を、一つ思い出してもらえますか？', a: '去年、外壁塗装した老夫婦に「ここに住み続けられる気がした」と言ってもらえたのがうれしかったです。' },
                    { q: 'Q. その工事でこだわったことは何かありましたか？', a: '下地処理を丁寧にやりました。見えないところですが、そこが長持ちするかどうかを決めるので。' },
                    { q: 'Q. 他の業者と比べて、そのこだわりは珍しいですか？', a: '手間がかかるので省く業者も多いと聞きます。うちは絶対に省かないと決めています。' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="text-[13px] font-semibold text-[var(--accent)] mb-1.5">{item.q}</div>
                      <div className="text-[13px] text-[var(--text2)] leading-[1.75] mb-5 pl-3.5 border-l-2 border-[var(--border)]">{item.a}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] overflow-hidden">
                <div className="px-[22px] py-4 border-b border-[var(--border)] bg-[var(--bg2)] flex items-center gap-2.5">
                  <span className="text-[18px]">📄</span>
                  <span className="text-[13px] font-bold text-[var(--text)]">届いた記事素材</span>
                  <button className="ml-auto border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-3 py-1 text-xs font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                    コピー
                  </button>
                </div>
                <div className="p-[22px]">
                  <h4 className="font-[family-name:var(--font-noto-serif-jp)] text-base font-bold text-[var(--text)] mb-2 leading-[1.45]">「ここに住み続けられる気がした」── 外壁塗装が届けた安心感の話</h4>
                  <p className="text-sm text-[var(--text)] leading-[1.85] mb-3">外壁塗装というと、見た目を新しくする工事というイメージが強いかもしれません。でも田中建設が大切にしているのは、塗り替えた後に「また長く住める」という気持ちを届けることです。</p>
                  <p className="text-sm text-[var(--text)] leading-[1.85]">同社が特にこだわるのが、施工前の下地処理。目には見えないこの工程こそが、塗装の耐久性を大きく左右します。手間がかかるため省略する業者もある中、同社は一切妥協しません。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑩ Cast */}
        <section className="py-[88px] bg-[var(--bg)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              あなたを担当するキャスト
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">目的に合わせて選べる3名のキャストが無料でご利用いただけます。</p>
            <div className="grid grid-cols-3 gap-[22px] mt-11">
              {freeCast.map((char) => (
                <Link key={char.id} href={`/cast#${char.id}`} className="block bg-[var(--surface)] border border-[var(--border)] rounded-[22px] overflow-hidden transition-transform duration-[250ms] hover:-translate-y-1.5 hover:shadow-[0_20px_56px_rgba(0,0,0,.09)]">
                  <div className="bg-[var(--bg2)] aspect-square overflow-hidden">
                    <Image src={char.portrait} alt={`${char.name}のポートレート`} width={305} height={305} className="h-full w-full object-contain" />
                  </div>
                  <div className="px-6 pt-[22px] pb-[26px]">
                    <div className="flex items-start justify-between mb-2.5">
                      <div>
                        <div className="font-[family-name:var(--font-noto-serif-jp)] text-[21px] font-bold text-[var(--text)]">{char.name}</div>
                        <div className="text-[11px] text-[var(--accent)] font-semibold tracking-[.08em] mt-0.5">{char.label}</div>
                      </div>
                      <span className="bg-[var(--teal-l)] text-[var(--teal)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">無料</span>
                    </div>
                    <p className="text-[13px] text-[var(--text2)] leading-[1.7] mb-3.5">{char.description}</p>
                    {char.specialty && (
                      <div className="text-[12px] text-[var(--text2)] flex items-baseline gap-1.5 mt-1.5 before:content-['—'] before:text-[var(--accent)] before:flex-shrink-0">
                        {char.specialty}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {addonCast.length > 0 && (
              <>
                <div className="flex items-center gap-3 mt-10 mb-4">
                  <span className="text-[13px] font-semibold text-[var(--text2)] whitespace-nowrap">追加キャスト（近日公開）</span>
                  <hr className="flex-1 border-none border-t border-[var(--border)] h-px bg-[var(--border)]" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {addonCast.map((char) => (
                    <div key={char.id} className="bg-[var(--bg2)] border border-dashed border-[var(--border)] rounded-[18px] overflow-hidden opacity-[0.72]">
                      <div className="bg-[var(--bg2)] aspect-square overflow-hidden">
                        <Image src={char.portrait} alt={`${char.name}のポートレート`} width={305} height={305} className="h-full w-full object-contain grayscale-[25%]" />
                      </div>
                      <div className="px-6 pt-[22px] pb-[26px]">
                        <div className="flex items-start justify-between mb-2.5">
                          <div>
                            <div className="font-[family-name:var(--font-noto-serif-jp)] text-lg font-bold text-[var(--text)]">{char.name}</div>
                            <div className="text-[11px] text-[var(--accent)] font-semibold tracking-[.08em] mt-0.5">{char.label}</div>
                          </div>
                          <span className="bg-[var(--bg2)] text-[var(--text3)] border border-[var(--border)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">準備中</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="text-center mt-8">
              <Link href="/cast" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
                キャストをすべて見る →
              </Link>
            </div>
          </div>
        </section>

        {/* ⑪ Compare */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Why Insight Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              「自分で書く」との違い
            </h2>
            <div className="mt-11 rounded-[20px] overflow-hidden border border-[var(--border)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-[22px] py-4 text-[13px] font-bold text-left border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] w-[38%]"></th>
                    <th className="px-[22px] py-4 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]">ChatGPTで自分で書く</th>
                    <th className="px-[22px] py-4 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]">社員・自分で書く</th>
                    <th className="px-[22px] py-4 text-[13px] font-bold text-center border-b border-[var(--border)] bg-[var(--accent)] text-white">Insight Cast</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td className="px-[22px] py-[15px] text-sm text-left font-medium text-[var(--text)] border-b border-[var(--border)]">{row.label}</td>
                      <td className="px-[22px] py-[15px] text-sm text-center border-b border-[var(--border)] text-[var(--text3)]">
                        {row.ai ? <span className="text-[var(--teal)] text-[17px] font-bold">✓</span> : <span className="text-[var(--text3)]">✕</span>}
                      </td>
                      <td className="px-[22px] py-[15px] text-sm text-center border-b border-[var(--border)] text-[var(--text3)]">
                        {row.none === true ? <span className="text-[var(--teal)] text-[17px] font-bold">✓</span> : <span>✕</span>}
                      </td>
                      <td className="px-[22px] py-[15px] text-sm text-center border-b border-[var(--border)] bg-[var(--accent-l)]">
                        {row.label === '費用がかかる'
                          ? <span className="text-[var(--accent)] text-[13px] font-semibold">有料</span>
                          : <span className="text-[var(--teal)] text-lg font-bold">✓</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ⑫ Pricing */}
        <section className="py-[88px]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Pricing</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              まず無料で、気軽に始められます
            </h2>
            <p className="text-base text-[var(--text2)] mt-3 max-w-[480px]">メールアドレスだけで、すぐに始められます。クレジットカード不要。有料プランはいつでも停止・解約できます。</p>
            <div className="grid grid-cols-3 gap-6 mt-11">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-[22px] border p-8 flex flex-col ${plan.highlight ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_20px_56px_rgba(0,0,0,.13)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}
                >
                  <div className={`text-[11px] font-semibold tracking-[0.12em] uppercase mb-3 ${plan.highlight ? 'text-white/70' : 'text-[var(--accent)]'}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`font-[family-name:var(--font-noto-serif-jp)] text-[36px] font-bold leading-none ${plan.highlight ? 'text-white' : 'text-[var(--text)]'}`}>{plan.price}</span>
                    {plan.period && <span className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-[var(--text2)]'}`}>{plan.period}</span>}
                  </div>
                  <div className={`text-[13px] mb-6 ${plan.highlight ? 'text-white/80' : 'text-[var(--text2)]'}`}>{plan.desc}</div>
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2.5 text-[13px] leading-[1.6] ${plan.highlight ? 'text-white/90' : 'text-[var(--text2)]'}`}>
                        <span className={`mt-[3px] flex-shrink-0 text-[11px] font-bold ${plan.highlight ? 'text-white' : 'text-[var(--teal)]'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`text-center rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold transition-colors ${plan.highlight ? 'bg-white text-[var(--accent)] hover:bg-white/90' : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center mt-6 text-[12px] text-[var(--text3)]">
              料金の詳細は
              <Link href="/pricing" className="text-[var(--accent)] underline underline-offset-2 mx-1">料金ページ</Link>
              をご覧ください。
            </p>
          </div>
        </section>

        {/* ⑬ Blog Preview */}
        <section className="py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Blog</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              最新の記事
            </h2>
            <div className="grid grid-cols-3 gap-[22px] mt-11">
              {POSTS.slice(0, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] overflow-hidden transition-transform duration-[220ms] hover:-translate-y-1 hover:shadow-[0_16px_48px_var(--shadow)] block"
                >
                  <div className="h-[160px] flex items-center justify-center text-[32px]" style={{ background: post.coverColor }}>
                    <span>📝</span>
                  </div>
                  <div className="px-[22px] py-5">
                    <div className="text-[11px] font-semibold text-[var(--accent)] tracking-[.08em] uppercase mb-2">{CATEGORY_LABELS[post.category]}</div>
                    <div className="font-[family-name:var(--font-noto-serif-jp)] text-base font-bold text-[var(--text)] leading-[1.5] mb-2.5">{post.title}</div>
                    <div className="text-[12px] text-[var(--text3)]">{post.date}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/blog" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
                記事をもっと読む →
              </Link>
            </div>
          </div>
        </section>

        {/* ⑭ FAQ */}
        <section className="py-[88px] bg-[var(--bg)]">
          <div className="mx-auto max-w-[720px] px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">FAQ</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              よくある質問
            </h2>
            <div className="mt-10 divide-y divide-[var(--border)] rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {FAQS.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg2)] transition-colors">
                    <span>{faq.q}</span>
                    <span className="text-[var(--text3)] transition-transform group-open:rotate-180 flex-shrink-0">⌄</span>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-[var(--text2)] leading-[1.85]">{faq.a}</div>
                </details>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/faq" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
                よくある質問をすべて見る →
              </Link>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
