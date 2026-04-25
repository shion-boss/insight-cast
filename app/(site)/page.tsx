import type { Metadata } from 'next'
import Link from 'next/link'

import Image, { type StaticImageData } from 'next/image'

export const metadata: Metadata = {
  title: 'Insight Cast — 会話から、記事へ。あなたの当たり前を言葉に。',
  description: '動物モチーフのAIキャストが取材に来ます。答えるだけで、伝わっていない強みが記事の素材になります。ホームページを会話で少しずつ育てるサービス。カード不要で無料体験できます。',
}
import { CharacterAvatar } from '@/components/ui'
import { PublicPageFrame } from '@/components/public-layout'
import { CopyButton } from '@/components/CopyButton'
import { CheckoutButton } from '@/app/(site)/pricing/CheckoutButton'
import AppPreviewSection from '@/components/app-preview-section'
import { CHARACTERS, getCharacter } from '@/lib/characters'
import scenePlanning from '@/assets/scene/scene-story-planning.png'
import sceneGrowth from '@/assets/scene/scene-growth-strategy-meeting.png'
import sceneAnalysis from '@/assets/scene/scene-competitor-analysis.png'
import sceneCastTeam from '@/assets/scene/scene-cast-team.png'
import { CATEGORY_LABELS, type PostCategory } from '@/lib/blog-posts'
import { getBlogPostsFromDB } from '@/lib/blog-posts.server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import mintXClaus from '@/assets/story/mint-x-claus.png'
import mintXRain from '@/assets/story/mint-x-rain.jpg'
import clausXRain from '@/assets/story/claus-x-rain.jpg'
import halXCocco from '@/assets/story/hal-x-cocco.png'
import halXMogro from '@/assets/story/hal-x-mogro.png'
import mogroXRain from '@/assets/story/mogro-x-rain.png'
import rainXCocco from '@/assets/story/rain-x-cocco.png'

const freeCast = CHARACTERS.filter((char) => char.available)
const addonCast = CHARACTERS.filter((char) => !char.available)

const STORY_IMAGE_MAP: Record<string, StaticImageData> = {
  'mint-claus': mintXClaus, 'claus-mint': mintXClaus,
  'mint-rain': mintXRain,   'rain-mint': mintXRain,
  'claus-rain': clausXRain, 'rain-claus': clausXRain,
  'hal-cocco': halXCocco,   'cocco-hal': halXCocco,
  'hal-mogro': halXMogro,   'mogro-hal': halXMogro,
  'mogro-rain': mogroXRain, 'rain-mogro': mogroXRain,
  'rain-cocco': rainXCocco, 'cocco-rain': rainXCocco,
}
function getStoryImage(id1: string, id2: string) {
  return STORY_IMAGE_MAP[`${id1}-${id2}`] ?? null
}

const CAST_TALK_THEME: Record<string, { color: string; label: string }> = {
  mint:  { color: '#c2722a', label: 'Customer Perspective' },
  claus: { color: '#0f766e', label: 'Industry Insight' },
  rain:  { color: '#7c3aed', label: 'Marketing Strategy' },
  hal:   { color: '#1d4ed8', label: 'Story & People' },
  mogro: { color: '#065f46', label: 'Deep Dive' },
  cocco: { color: '#be185d', label: 'Promotion' },
}

const BLOG_CATEGORY_COLOR: Record<PostCategory, string> = {
  howto:      '#c2722a',
  service:    '#0f766e',
  interview:  '#7c3aed',
  case:       '#1d4ed8',
  philosophy: '#065f46',
  news:       '#be185d',
}

const PAIN_ITEMS = [
  { n: '01', title: '「何を書けばいいか分からない」', body: 'ブログを書こうと思うたびに、「今さら何を？」と手が止まる。ネタがないのではなく、ネタの見つけ方が分からないのです。' },
  { n: '02', title: '「取材・撮影が大変で後回しになる」', body: '更新のたびに写真を撮って文章を考えて。それだけで半日かかる。本業が忙しいのに、続くわけがない。' },
  { n: '03', title: '「自社の強みを言葉にできない」', body: '「特別なことなんて何もない」——そう感じていませんか。でも、それが一番伝わっていない価値かもしれません。' },
] as const

const OUTCOME_ITEMS = [
  { charId: 'mint',  title: '当たり前の中に眠る価値が言葉になる', body: 'AIキャストが丁寧に取材することで、気づかなかった自社の強みが見えてきます。' },
  { charId: 'claus', title: '記事の素材が手元に届く', body: '取材で引き出した話をもとに、記事の素材が手元に届きます。何を書くか悩む前に、素材がある状態を作ります。' },
  { charId: 'rain',  title: 'ホームページが少しずつ育っていく', body: '定期的な取材で情報を積み重ね、問い合わせにつながるコンテンツ資産になります。' },
] as const

const WORKFLOW_ITEMS = [
  { n: '01', title: 'HPを分析する', body: '取材先のホームページと競合を登録するだけで、「今のHPで何が足りないか」「どこを強化すべきか」が整理されます。何を取材すればいいかが、最初から見えた状態で始められます。' },
  { n: '02', title: 'AIキャストが取材する', body: 'ミント、クラウス、レインが質問します。答えるだけでOK。資料も整った言葉も必要ありません。約20分のチャットで、一次情報が引き出されます。' },
  { n: '03', title: '記事の素材が届く', body: '取材内容をもとに、ブログや実績ページに使える文章の素材を作ります。「何を書くか」に迷う前に、素材がある状態を作ります。' },
] as const

const COMPARE_ROWS = [
  { label: '「何を書くか」を考えなくていい',  ai: false, none: false },
  { label: '自社だけの一次情報が使われる',     ai: false, none: true  },
  { label: '専門知識がなくても使える',          ai: true,  none: false },
  { label: '継続しやすい（止まりにくい）',      ai: false, none: false },
  { label: 'ホームページの現状分析つき',        ai: false, none: false },
  { label: '無料から始められる',                 ai: false, none: false },
] as const

const PLANS = [
  {
    id: 'free',
    name: 'お試し',
    price: '¥0',
    period: '',
    desc: 'まず体験してみてください',
    features: ['取材回数：2回まで（単発）', 'フリーキャスト 3名', '取材先登録：1件', '競合調査：1社', '取材メモ・記事素材を受け取れる', '追加キャスト：準備中'],
    cta: '無料で始める',
    href: '/auth/signup',
    highlight: false,
  },
  {
    id: 'personal',
    name: '個人向け',
    price: '¥4,980',
    period: '/ 月',
    desc: '週1〜2本ペースでHPを育てたい方へ',
    features: ['取材回数：月15回まで', 'フリーキャスト 3名', '取材先登録：1件', '競合調査：3社', '取材メモ・記事素材を受け取れる', '追加キャスト：準備中'],
    cta: '申し込む',
    href: '/auth/login?next=/api/stripe/checkout-redirect?plan=personal',
    highlight: true,
  },
  {
    id: 'business',
    name: '法人向け',
    price: '¥14,800',
    period: '/ 月',
    desc: '複数の取材先や担当者でHPを強化したい方へ',
    features: ['取材回数：月60回まで', 'フリーキャスト 3名', '取材先登録：最大3件', '競合調査：各取材先3社', '取材メモ・記事素材を受け取れる', '追加キャスト：準備中', '優先サポート'],
    cta: '申し込む',
    href: '/auth/login?next=/api/stripe/checkout-redirect?plan=business',
    highlight: false,
  },
] as const

const FAQS = [
  { q: '無料でどこまで使えますか？', a: '3名のキャスト（ミント・クラウス・レイン）によるAI取材を2回（単発）ご利用いただけます。取材メモと記事素材を受け取るところまで無料で体験できます。' },
  { q: '取材はどんな形式で行われますか？', a: 'チャット形式です。キャストが質問を一つずつ投げかけます。資料の準備や専門知識は不要で、お話しするだけで価値を引き出します。' },
  { q: '届いた記事素材はそのまま使えますか？', a: '少し手を加えることで使える素材が届きます。そのままでも読める状態ですが、ご自身の言葉で調整していただくとより自然な仕上がりになります。' },
  { q: '専門用語が多い業種でも大丈夫ですか？', a: 'クラウスは業種にとらわれない客観的な視点で、あなたの仕事の論理的な価値を引き出します。専門用語を使わずに話していただければ、分かりやすく言語化します。' },
  { q: '途中でキャンセルできますか？', a: 'マイページの「プラン・請求」からいつでも解約できます。解約後もデータは保持されます。' },
  { q: 'どんな業種でも使えますか？', a: 'はい。建設・飲食・医療・美容・士業など業種を問わず対応しています。取材内容はすべてあなた自身の言葉から引き出すため、業種特有の専門知識が不要です。' },
] as const

const BLOG_PREVIEW_CHARACTER: Record<PostCategory, string> = {
  howto: 'mint',
  service: 'claus',
  interview: 'rain',
  case: 'rain',
  philosophy: 'claus',
  news: 'mint',
}

export default async function LandingPage() {
  const supabaseAdmin = createAdminClient()

  const [authResult, latestPostsAll, talksResult] = await Promise.allSettled([
    (async () => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      return Boolean(user)
    })(),
    getBlogPostsFromDB(),
    supabaseAdmin
      .from('cast_talks')
      .select('id, title, summary, interviewer_id, guest_id, slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3),
  ])

  const isLoggedIn = authResult.status === 'fulfilled' ? authResult.value : false
  const latestPosts = (latestPostsAll.status === 'fulfilled' ? latestPostsAll.value : []).slice(0, 3)
  const latestTalks = talksResult.status === 'fulfilled' ? talksResult.value.data : []

  const priceIds = {
    personal: process.env.STRIPE_PRICE_ID_PERSONAL ?? '',
    business: process.env.STRIPE_PRICE_ID_BUSINESS ?? '',
  }

  return (
    <>


      <main className="relative z-10">

        {/* ① Hero */}
        <section className="pt-[72px] pb-[56px] sm:pt-[88px] sm:pb-[72px] lg:pt-[112px] lg:pb-[88px]" style={{ background: 'linear-gradient(140deg,#fdf8f2 0%,#f6e9d8 55%,#ede0cc 100%)' }}>
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-14">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-l)] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--accent)] mb-6">
                  ✦ AI取材サービス
                </div>
                <h1 className="font-[family-name:var(--font-noto-serif-jp)] leading-[1.14] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(34px,4vw,54px)' }}>
                  会話から、記事へ。<br /><em className="text-[var(--accent)] not-italic">あなたの当たり前を言葉に。</em>
                </h1>
                <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-6 max-w-[420px]">
                  動物モチーフのインタビュアーが質問するので、答えるだけで記事の素材が届きます。「何を書けばいいか分からない」を解消します。
                </p>
                <p className="text-[13px] text-[var(--text3)] leading-[1.75] mt-3 max-w-[420px]">
                  あなたにとっての当たり前は、まだ伝わっていない価値かもしれません。
                </p>
                <div className="flex gap-3 mt-8 flex-wrap">
                  <Link href={isLoggedIn ? '/dashboard' : '/auth/signup'} className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-7 py-3.5 text-sm font-semibold transition-colors inline-flex items-center shadow-[0_4px_24px_rgba(0,0,0,.12)]">
                    {isLoggedIn ? 'ダッシュボードへ →' : 'カード不要・無料で体験する →'}
                  </Link>
                  <Link href="/cast" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3.5 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
                    キャストを見る
                  </Link>
                </div>
                <div className="mt-9 flex flex-wrap gap-6 border-t border-[var(--border)]/70 pt-8 sm:gap-9">
                  {[
                    { n: '3名', l: '無料キャスト' },
                    { n: '約20分', l: '平均取材時間' },
                    { n: '¥0', l: 'カード不要で始められる' },
                  ].map((item) => (
                    <div key={item.l}>
                      <div className="font-[family-name:var(--font-noto-serif-jp)] text-[28px] font-bold text-[var(--accent)] leading-none">{item.n}</div>
                      <div className="text-[11px] text-[var(--text2)] mt-1.5 font-medium">{item.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cast team visual */}
              <div className="relative overflow-visible py-3 px-3 sm:py-0 sm:px-0">
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.14)]">
                  <Image
                    src={sceneCastTeam}
                    alt="Insight CastのAIキャスト6名が集合している様子"
                    width={520}
                    height={520}
                    className="w-full h-auto object-cover"
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

        {/* ② Pain */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Pain Points</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              HPが止まっているのは、<br />意欲がないからじゃない。
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">更新が後回しになるのには、理由があります。</p>
            <div className="mt-11 grid gap-5 md:grid-cols-3">
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
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">What You Get</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              Insight Cast を使うと、こう変わる
            </h2>
            <div className="mt-11 grid gap-5 md:grid-cols-3">
              {OUTCOME_ITEMS.map((item) => {
                const char = getCharacter(item.charId)
                return (
                  <div key={item.title} className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] p-8 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-[var(--accent)]">
                    <div className="w-10 h-10 rounded-[10px] bg-[var(--accent-l)] flex items-center justify-center mb-5">
                      <CharacterAvatar src={char?.icon48} alt={char?.name ?? item.charId} emoji={char?.emoji} size={32} />
                    </div>
                    <h3 className="text-[17px] font-bold text-[var(--text)] mb-2.5 leading-[1.45]">{item.title}</h3>
                    <p className="text-sm text-[var(--text2)] leading-[1.8]">{item.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ④ Workflow */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">How It Works</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              やることは、ただ「答えるだけ」。
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">ネタ出しも、文章作りも、Insight Cast が引き受けます。</p>
            <div className="relative mt-14 grid gap-8 md:grid-cols-3">
              <div className="absolute left-[calc(16.67%+8px)] right-[calc(16.67%+8px)] top-[44px] hidden h-px bg-[var(--border)] md:block" aria-hidden="true" />
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
        <section className="py-14 sm:py-[96px] overflow-hidden bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-16">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-4">Step 01 — HP Analysis</div>
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.25]" style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
                  まず、あなたのHPと<br />競合を調べます。
                </h2>
                <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[400px]">
                  取材先を登録すると、今のホームページで何が足りないかを分析し、競合との違いを整理できます。「何が足りないか」「どこを強化すべきか」が、取材の前に見えやすくなります。
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
        <section className="py-14 sm:py-[96px] overflow-hidden" style={{ background: 'linear-gradient(160deg,#fdf8f2 0%,#f0e5d0 100%)' }}>
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="grid items-center gap-10 lg:grid-cols-[520px_minmax(0,1fr)] lg:gap-16">
              <div className="relative">
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.13)]">
                  <Image src={scenePlanning} alt="AIキャストが机でインタビューの準備をしている様子" width={520} height={520} className="w-full h-auto object-cover" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                  <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">Insight Cast</div>
                  <div className="text-[12px] font-bold text-[var(--text)]">今日のインタビューを準備中</div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-4">Step 02 — Interview</div>
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.25]" style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
                  今日もAIキャストが、<br />あなたの話を聞きます。
                </h2>
                <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[400px]">
                  動物モチーフのインタビュアーたちが、毎回あなたの話を聞く準備を整えます。専門知識も、整った言葉も必要ありません。ふだん通りに話すだけで大丈夫です。
                </p>
                <ul className="mt-7 space-y-3.5">
                  {[
                    '話すだけで、自社の強みが言葉になる',
                    '構えずに話せる、やさしい取材スタイル',
                    '取材後、記事素材づくりに進める',
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
        <section className="py-14 sm:py-[96px] overflow-hidden">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-16">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)] mb-4">Step 03 — Growth</div>
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.25]" style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
                  積み重ねるたびに、<br />ホームページが強くなる。
                </h2>
                <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[400px]">
                  一回の取材で終わりではありません。取材を重ねるほど、あなたのホームページには一次情報が蓄積され、検索でも口コミでも「信頼できる」と思われやすくなっていきます。
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Output Example</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              こんな取材をして、こんな素材が届きます
            </h2>
            <p className="text-base text-[var(--text2)] mt-3 max-w-[520px]">
              実際の取材の流れを再現した例です。専門的な準備は何もいりません。このように会話するだけです。
            </p>
            <div className="mt-11 grid gap-8 xl:grid-cols-2">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] overflow-hidden">
                <div className="px-[22px] py-4 border-b border-[var(--border)] bg-[var(--bg2)] flex items-center gap-2.5">
                  <CharacterAvatar src={freeCast[0]?.icon48} alt={`${freeCast[0]?.name ?? 'ミント'}のアイコン`} emoji={freeCast[0]?.emoji} size={28} />
                  <span className="text-[13px] font-bold text-[var(--text)]">{freeCast[0]?.name ?? 'ミント'}の取材ログ</span>
                  <span className="ml-auto bg-[var(--teal-l)] text-[var(--teal)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">完了</span>
                </div>
                <div className="p-[22px]">
                  {[
                    { q: 'Q. 仕事の時間帯って、どのくらいで動いてることが多いですか？', a: 'うちは戸建てがメインなので、朝8時ごろから15時ごろくらいですかね。早すぎても遅すぎてもお客様に迷惑かかるので、メリハリよく働いてくようにしています。' },
                    { q: 'Q. 8時〜15時って意識してその時間に収めてるんですね。最初からそうしてたんですか？', a: '父親の代からそうしているので、特にきっかけはないですね。塗り替えは、お客様はもちろん、近所の方の理解があってこそいい仕事ができると思うので、そういう配慮は必要だなとは思っています。' },
                    { q: 'Q. 近所の方への配慮まで考えてって、なかなかそこまで意識してる業者さんって多くないと思うんですが…', a: '当たり前のことだと思ってましたけど、言われてみるとそうかもしれないですね。父からそう教わってきたので。' },
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
                  <span className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-[.08em]">Article</span>
                  <span className="text-[13px] font-bold text-[var(--text)]">届いた記事素材</span>
                  <CopyButton text={`朝8時〜15時、この時間帯を、父の代から守り続けている理由。\n\nうちは戸建てがメインなので、朝8時ごろから15時ごろまでを基本にしています。早すぎても遅すぎてもお客様に迷惑がかかるので、父親の代からずっとそうしてきました。\n\n塗り替えって、お客様はもちろんですが、近所の方の理解があってこそちゃんとした仕事ができると思っていて。施工中は騒音もあるし、養生シートで通路が狭くなることもある。だから時間帯への気遣いは当たり前のことだと思っています。言われてみると、そこまで意識している業者さんは多くないのかもしれませんが。`} />
                </div>
                <div className="p-[22px]">
                  <h4 className="font-[family-name:var(--font-noto-serif-jp)] text-base font-bold text-[var(--text)] mb-2 leading-[1.45]">朝8時〜15時、この時間帯を、父の代から守り続けている理由。</h4>
                  <p className="text-sm text-[var(--text)] leading-[1.85] mb-3">うちは戸建てがメインなので、朝8時ごろから15時ごろまでを基本にしています。早すぎても遅すぎてもお客様に迷惑がかかるので、父親の代からずっとそうしてきました。</p>
                  <p className="text-sm text-[var(--text)] leading-[1.85]">塗り替えって、お客様はもちろんですが、近所の方の理解があってこそちゃんとした仕事ができると思っていて。だから時間帯への気遣いは当たり前のことだと思っています。言われてみると、そこまで意識している業者さんは多くないのかもしれませんが。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑩ Cast */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              あなたを担当するキャスト
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">3名の無料キャストがいます。「誰に頼もうか迷う」場合は、ミントから始めてください。</p>
            <div className="mt-11 grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
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
                <div className="grid gap-4 md:grid-cols-3">
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
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Why Insight Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              「自分で書く」との違い
            </h2>
            {/* モバイルではスクロールヒントを表示 */}
            <p className="mt-4 mb-3 text-xs text-[var(--text3)] text-center sm:hidden" aria-hidden="true">← スクロールして比較 →</p>
            <div className="mt-4 sm:mt-11 overflow-x-auto rounded-[20px] border border-[var(--border)]">
              <table className="min-w-[580px] w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-[22px] py-4 text-[13px] font-bold text-left border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] w-[34%]"></th>
                    <th className="px-[16px] py-4 text-[12px] font-bold text-center border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]">AIツールで書いてもらう</th>
                    <th className="px-[16px] py-4 text-[12px] font-bold text-center border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]">自分や社員で書く</th>
                    <th className="sticky right-0 z-10 px-[16px] py-4 text-[12px] font-bold text-center border-b border-[var(--border)] bg-[var(--accent)] text-white shadow-[-4px_0_8px_rgba(0,0,0,0.06)]">Insight Cast</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td className="px-[22px] py-[15px] text-sm text-left font-medium text-[var(--text)] border-b border-[var(--border)]">{row.label}</td>
                      <td className="px-[16px] py-[15px] text-sm text-center border-b border-[var(--border)] text-[var(--text3)]">
                        {row.ai ? <span className="text-[var(--teal)] text-[17px] font-bold">✓</span> : <span className="text-[var(--text3)]">✕</span>}
                      </td>
                      <td className="px-[16px] py-[15px] text-sm text-center border-b border-[var(--border)] text-[var(--text3)]">
                        {row.none === true ? <span className="text-[var(--teal)] text-[17px] font-bold">✓</span> : <span>✕</span>}
                      </td>
                      <td className="sticky right-0 z-10 px-[16px] py-[15px] text-sm text-center border-b border-[var(--border)] bg-[var(--accent-l)] shadow-[-4px_0_8px_rgba(0,0,0,0.06)]">
                        <span className="text-[var(--teal)] text-lg font-bold">✓</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ⑫ Pricing */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Pricing</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              まず無料で体験してください。<br />2回まで（単発）、カード不要で使えます。
            </h2>
            <p className="text-base text-[var(--text2)] mt-3 max-w-[480px]">使いやすいかどうかは、使ってみないと分かりません。カード不要、メールアドレスだけで今すぐ始められます。</p>
            <div className="mt-11 grid gap-6 lg:grid-cols-3">
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
                  {plan.id === 'free' ? (
                    isLoggedIn ? (
                      <Link
                        href="/dashboard"
                        className={`text-center rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold transition-colors ${plan.highlight ? 'bg-white text-[var(--accent)] hover:bg-white/90' : 'border-[1.5px] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}
                      >
                        ダッシュボードへ
                      </Link>
                    ) : (
                      <Link
                        href={plan.href}
                        className={`text-center rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold transition-colors ${plan.highlight ? 'bg-white text-[var(--accent)] hover:bg-white/90' : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'}`}
                      >
                        {plan.cta}
                      </Link>
                    )
                  ) : isLoggedIn ? (
                    <CheckoutButton
                      priceId={plan.id === 'personal' ? priceIds.personal : priceIds.business}
                      label={plan.cta}
                      featured={plan.highlight}
                    />
                  ) : (
                    <Link
                      href={`/auth/login?next=${encodeURIComponent(`/api/stripe/checkout-redirect?plan=${plan.id}`)}`}
                      className={`text-center rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold transition-colors ${plan.highlight ? 'bg-white text-[var(--accent)] hover:bg-white/90' : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'}`}
                    >
                      {plan.cta}
                    </Link>
                  )}
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

        {/* ⑬ From the Team — ドッグフーディング開示 */}
        <section className="py-14 sm:py-[88px]" style={{ background: 'linear-gradient(160deg,#fdf8f2 0%,#f0e5d0 100%)' }}>
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12 text-center">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">From the Team</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              私たち自身が、Insight Cast を使っています。
            </h2>
            <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-5 max-w-[560px] mx-auto">
              Insight Cast は今、自社のホームページ更新を Insight Cast 自体で進めています。このブログもその過程から生まれています。
            </p>
            <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-4 max-w-[560px] mx-auto">
              自分たちが「ホームページ更新が止まっている状態」を経験し、それを解決するためにこのサービスを作りました。実際に使いながら改善してきた過程をブログで公開しています。
            </p>
            <div className="mt-8">
              <Link
                href="/blog"
                className="border-[1.5px] border-[var(--accent)] text-[var(--accent)] rounded-[var(--r-sm)] px-7 py-3.5 text-sm font-semibold hover:bg-[var(--accent)] hover:text-white transition-colors inline-flex items-center"
              >
                運営ブログを読む →
              </Link>
            </div>
          </div>
        </section>

        {/* ⑭ Blog Preview */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Blog</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              最新の記事
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">会話から言葉にした経験や、発信のヒントをお届けしています。</p>
            <div className="mt-11 flex flex-col divide-y divide-[var(--border)] rounded-[20px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {latestPosts.map((post) => {
                const char = getCharacter(post.interviewer ?? BLOG_PREVIEW_CHARACTER[post.category]) ?? getCharacter('mint')!
                const themeColor = BLOG_CATEGORY_COLOR[post.category]
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[var(--border)]" style={{ background: `${themeColor}18` }}>
                      <Image src={char.icon48} alt={char.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${themeColor}1a`, color: themeColor }}>
                          {CATEGORY_LABELS[post.category]}
                        </span>
                        <span className="text-[11px] text-[var(--text3)]">{post.date}</span>
                      </div>
                      <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold leading-snug text-[var(--text)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                        {post.title}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] font-bold text-[var(--text3)] group-hover:text-[var(--accent)] transition-colors">→</span>
                  </Link>
                )
              })}
            </div>
            <div className="text-center mt-8">
              <Link href="/blog" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
                記事をもっと読む →
              </Link>
            </div>
          </div>
        </section>

        {/* ⑭ Cast Talk Preview */}
        {latestTalks && latestTalks.length > 0 && (
          <section className="py-14 sm:py-[88px] bg-[var(--bg)]">
            <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
              <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Cast Talk</div>
              <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
                キャストの対話
              </h2>
              <p className="text-base text-[var(--text2)] mt-3">ミント・クラウス・レインが語り合う対話記事。ホームページを育てるヒントをキャスト視点でお届けします。</p>
              <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {latestTalks.map((talk) => {
                  const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
                  const guest = CHARACTERS.find((c) => c.id === talk.guest_id)
                  const storyImg = getStoryImage(talk.interviewer_id ?? '', talk.guest_id ?? '')
                  const theme = CAST_TALK_THEME[talk.interviewer_id ?? ''] ?? { color: '#c2722a', label: 'Cast Talk' }
                  return (
                    <Link
                      key={talk.id}
                      href={`/cast-talk/${talk.slug}`}
                      className="group flex flex-col overflow-hidden rounded-[20px] border border-[#e2d5c3] bg-[#fffdf9] shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(0,0,0,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      <div className="relative h-[180px] overflow-hidden">
                        {storyImg ? (
                          <Image
                            src={storyImg}
                            alt={`${interviewer?.name ?? talk.interviewer_id} × ${guest?.name ?? talk.guest_id}`}
                            fill
                            className="object-cover brightness-95 saturate-90 transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="h-full bg-[var(--accent-l)]" />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#fffdf9] to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-[6px] border border-[#e2d5c3] bg-[#fffdf9] px-2.5 py-[5px]">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
                          <span className="text-[11px] font-bold tracking-[0.08em] text-[#1c1410]">{theme.label}</span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col px-5 pb-[22px] pt-1">
                        <div className="mb-3 flex items-center gap-1.5">
                          {[interviewer, guest].map((c, i) =>
                            c ? (
                              <div key={i} className="h-6 w-6 overflow-hidden rounded-full border-[1.5px] border-[#e2d5c3] flex-shrink-0">
                                <Image src={c.icon48} alt={c.name} width={24} height={24} className="h-full w-full object-cover" />
                              </div>
                            ) : null,
                          )}
                          <span className="text-[11px] font-semibold text-[#7a6555]">
                            {interviewer?.name ?? talk.interviewer_id} &amp; {guest?.name ?? talk.guest_id}
                          </span>
                        </div>
                        <h3 className="font-[family-name:var(--font-noto-serif-jp)] text-[16px] font-bold leading-[1.5] text-[#1c1410] mb-2.5">
                          {talk.title}
                        </h3>
                        <div className="h-px bg-[#e8ddd0] my-2.5" />
                        {talk.summary && (
                          <p className="flex-1 border-l-2 pl-3 text-[12px] italic leading-[1.75] text-[#7a6555]" style={{ borderColor: theme.color }}>
                            「{talk.summary}」
                          </p>
                        )}
                        <div className="mt-3.5 flex items-center justify-end">
                          <span className="text-[11px] font-bold" style={{ color: theme.color }}>続きを読む →</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="text-center mt-8">
                <Link href="/cast-talk" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center">
                  Cast Talk をもっと読む →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ⑮ FAQ */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg)]">
          <div className="mx-auto max-w-[720px] px-6 sm:px-8 lg:px-12">
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

        {/* ⑮ Contact CTA */}
        {(() => {
          const mint = getCharacter('mint')
          return (
            <section className="py-14 sm:py-20" style={{ background: 'linear-gradient(140deg,#fdf8f2 0%,#f6e9d8 55%,#ede0cc 100%)' }}>
              <div className="mx-auto max-w-[720px] px-6 sm:px-8 text-center">
                <div className="flex justify-center mb-6">
                  <CharacterAvatar
                    src={mint?.icon96}
                    alt={`${mint?.name ?? 'ミント'}のアイコン`}
                    emoji={mint?.emoji}
                    size={72}
                    className="shadow-[0_4px_16px_rgba(0,0,0,.08)]"
                  />
                </div>
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.3]" style={{ fontSize: 'clamp(22px,2.8vw,34px)' }}>
                  「自社に使えるか」から聞いてください。
                </h2>
                <p className="text-[15px] text-[var(--text2)] leading-[1.9] mt-4 max-w-[480px] mx-auto">
                  業種のことも、ホームページの状況も、何も準備しなくて大丈夫です。「こんな使い方はできますか？」「まず何から始めればいいですか？」そんなところから始めましょう。
                </p>
                <div className="mt-8">
                  <Link
                    href="/contact"
                    className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold transition-colors inline-flex items-center shadow-[0_4px_24px_rgba(0,0,0,.12)]"
                  >
                    問い合わせる（無料・返信は1営業日以内） →
                  </Link>
                </div>
              </div>
            </section>
          )
        })()}

      </main>


    </>
  )
}
