import type { Metadata } from 'next'
import Link from 'next/link'

import Image from 'next/image'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Insight Cast — 会話から、記事へ。あなたの当たり前を言葉に。',
  description: '動物モチーフのAIキャストが取材に来ます。答えるだけで、伝わっていない強みが記事になります。貼るだけで投稿できる状態で届くので、ホームページを会話で少しずつ育てられます。カード不要で無料体験できます。',
  alternates: { canonical: APP_URL },
  openGraph: {
    title: 'Insight Cast — 会話から、記事へ。あなたの当たり前を言葉に。',
    description: '動物モチーフのAIキャストが取材に来ます。答えるだけで、伝わっていない強みが記事になります。貼るだけで投稿できる状態でお届けします。',
    url: APP_URL,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insight Cast — 会話から、記事へ。あなたの当たり前を言葉に。',
    description: '動物モチーフのAIキャストが取材に来ます。答えるだけで、伝わっていない強みが記事になります。貼るだけで投稿できる状態でお届けします。',
    images: ['/logo.jpg'],
  },
}
import { CharacterAvatar } from '@/components/ui'
import { CopyButton } from '@/components/CopyButton'
import { CheckoutButton } from '@/app/(site)/pricing/CheckoutButton'
import { CHARACTERS, getCharacter } from '@/lib/characters'
import scenePlanning from '@/assets/scene/scene-story-planning.png'
import sceneGrowth from '@/assets/scene/scene-growth-strategy-meeting.png'
import sceneAnalysis from '@/assets/scene/scene-competitor-analysis.png'
import sceneCastTeam from '@/assets/scene/scene-cast-team.png'
import { CATEGORY_LABELS, type PostCategory } from '@/lib/blog-posts'
import { LpFaq } from './LpFaq'
import { getBlogPostsFromDB } from '@/lib/blog-posts.server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
const freeCast = CHARACTERS.filter((char) => char.available)
const addonCast = CHARACTERS.filter((char) => !char.available)

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




const FREE_TRIAL_FEATURES = ['取材回数：2回まで（単発）', 'フリーキャスト 3名', 'プロジェクト登録：1件', '取材メモ・記事を受け取れる'] as const

const PAID_PLANS = [
  {
    id: 'lightning',
    name: 'ライト',
    price: '¥1,980',
    period: '/ 月',
    desc: '月5回から、HPを育てはじめる',
    features: ['取材 5回 / 月', '記事作成 月20回まで', 'プロジェクト 1件', '自社HP調査', '通常サポート'],
    cta: 'ライトプランで始める',
    highlight: false,
  },
  {
    id: 'personal',
    name: '個人向け',
    price: '¥4,980',
    period: '/ 月',
    desc: '週1〜2本ペースでHPを育てたい方へ',
    features: ['取材回数：月15回まで', '記事作成 月60回まで', 'フリーキャスト 3名', 'プロジェクト登録：1件', '競合調査：3社', '取材メモ・記事を受け取れる', '追加キャスト：準備中'],
    cta: '月額プランを始める',
    highlight: true,
  },
  {
    id: 'business',
    name: '法人向け',
    price: '¥14,800',
    period: '/ 月',
    desc: '複数のプロジェクトや担当者でHPを強化したい方へ',
    features: ['取材回数：月60回まで', '記事作成 月240回まで', 'フリーキャスト 3名', 'プロジェクト登録：最大3件', '競合調査：各プロジェクト3社', '取材メモ・記事を受け取れる', '追加キャスト：準備中', '優先サポート'],
    cta: '月額プランを始める',
    highlight: false,
  },
] as const

const FAQS = [
  { q: '無料でどこまで使えますか？', a: '3名のキャスト（ミント・クラウス・レイン）によるAI取材を2回（単発）ご利用いただけます。取材メモと記事を受け取るところまで無料で体験できます。' },
  { q: '取材はどんな形式で行われますか？', a: 'チャット形式です。キャストが質問を一つずつ投げかけます。資料の準備や専門知識は不要で、お話しするだけで価値を引き出します。' },
  { q: '届いた記事はそのまま使えますか？', a: 'そのままコピペして投稿できる状態でお届けします。必要であればご自身の言葉に整えていただくことも可能ですが、そのまま使っていただくことを前提に作られています。' },
  { q: '専門用語が多い業種でも大丈夫ですか？', a: 'クラウスは業種にとらわれない客観的な視点で、あなたの仕事の論理的な価値を引き出します。専門用語を使わずに話していただければ、分かりやすく言語化します。' },
  { q: '途中でキャンセルできますか？', a: 'マイページの「ご利用プラン」からいつでも解約できます。解約後もデータは保持されます。' },
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

// TODO(P-1): LP の Suspense / Streaming 最適化
// latestPosts・latestTalks を別 async Server Component に切り出し Suspense でラップすることで
// TTFB を改善できる。Phase 3 以降で対応を検討。
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
    lightning: process.env.STRIPE_PRICE_ID_LIGHTNING ?? '',
    personal: process.env.STRIPE_PRICE_ID_PERSONAL ?? '',
    business: process.env.STRIPE_PRICE_ID_BUSINESS ?? '',
  }

  return (
    <>

      <main id="main-content" className="relative z-10">

        {/* ① Hero */}
        <section className="pt-[52px] pb-[56px] sm:pt-[68px] sm:pb-[72px] lg:pt-[88px] lg:pb-[88px]" style={{ background: 'linear-gradient(140deg,#fdf8f2 0%,#f6e9d8 55%,#ede0cc 100%)' }}>
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-14">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-l)] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--accent)] mb-6">
                  <span aria-hidden="true">✦</span> AIキャストが取材します
                </div>
                <h1 className="font-[family-name:var(--font-noto-serif-jp)] leading-[1.14] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(34px,4vw,54px)' }}>
                  会話から、記事へ。<br /><em className="text-[var(--accent)] not-italic">あなたの当たり前を言葉に。</em>
                </h1>
                <p className="text-[15px] text-[var(--text2)] leading-[1.95] mt-6 max-w-[420px]">
                  AI検索の時代でも、あなた自身の言葉だけは、真似できない。Insight Castが、その価値を引き出して記事にします。
                </p>
                <div className="flex gap-3 mt-8 flex-wrap">
                  <Link href={isLoggedIn ? '/dashboard' : '/auth/signup'} className="bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] rounded-[var(--r-sm)] px-7 py-3.5 text-sm font-semibold transition-colors inline-flex items-center shadow-[0_4px_24px_rgba(0,0,0,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                    {isLoggedIn ? <>ダッシュボードへ <span aria-hidden="true">→</span></> : <>カード不要・無料で体験する <span aria-hidden="true">→</span></>}
                  </Link>
                  <Link href="/cast" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3.5 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
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
              <div className="order-1 lg:order-2 relative overflow-visible py-3 px-3 sm:py-0 sm:px-0">
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.14)]">
                  <Image
                    src={sceneCastTeam}
                    alt="Insight CastのAIキャスト6名が集合している様子"
                    width={520}
                    height={520}
                    className="w-full h-auto object-cover"
                    sizes="(min-width: 1024px) 480px, 100vw"
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
        <section className="py-16 sm:py-[100px] relative overflow-hidden" style={{ background: '#1e1610' }}>
          {/* Subtle horizontal texture */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)' }} />
          {/* Warm orange vignette from bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(194,114,42,0.08), transparent)' }} />
          <div className="relative mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-7" style={{ color: '#c2722a', opacity: 0.8 }}>Pain</p>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold leading-[1.65] mb-14" style={{ color: '#f0e8dc', fontSize: 'clamp(26px,3.8vw,52px)' }}>
              やる気があっても、<br />
              <span className="relative inline-block">
                問いがなければ始まらない。
                <span className="absolute bottom-[1px] left-0 right-0 h-[2px] rounded-[1px]" style={{ background: '#c2722a', opacity: 0.6 }} />
              </span>
            </h2>
            <ul className="flex flex-col gap-7">
              {[
                '何を書けばいいか分からない',
                '自分の強みが言葉にならない',
                '毎回ゼロから考えるのがたいへん',
              ].map((text) => (
                <li key={text} className="flex items-start gap-3 text-[15px] sm:text-[17px] leading-[1.6] tracking-[0.02em]" style={{ color: '#c4b4a4' }}>
                  <span className="flex-shrink-0 w-[5px] h-[5px] rounded-full mt-[9px]" style={{ background: '#c2722a', opacity: 0.6 }} />
                  {text}
                </li>
              ))}
            </ul>
            <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold mt-16 flex items-end flex-wrap gap-y-2" style={{ color: '#a07858' }}>
              <span style={{ fontSize: 'clamp(18px,2.4vw,30px)', lineHeight: 1 }}>問いさえあれば....&nbsp;</span>
              <span style={{ fontSize: 'clamp(24px,3.2vw,42px)', color: '#fde8c0', lineHeight: 1 }}>答えられるのに。</span>
            </p>
          </div>
        </section>

        {/* ③ Solution Bridge */}
        <section className="py-16 sm:py-[100px] relative overflow-hidden" style={{ background: '#fdf7f0' }}>
          {/* Watercolor wash top-right */}
          <div className="absolute pointer-events-none" style={{ top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, oklch(0.82 0.07 55 / 0.18), transparent 70%)' }} />
          <div className="relative mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: '#c2722a' }}>Solution</p>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold leading-[1.5] mb-12 relative pl-5" style={{ color: '#1c1410', fontSize: 'clamp(32px,4.5vw,60px)' }}>
              <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-[2px]" style={{ background: '#c2722a' }} />
              Insight Castなら、<br />取材に答えるだけ。
            </h2>
            <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-16 xl:gap-24">
              <ul className="mb-10 lg:mb-0 border-t" style={{ borderColor: '#e2d5c3' }}>
                {[
                  '何を書くか、考えなくていい。',
                  '強みを言葉にしなくていい。',
                  'AIキャストが聞くので、話すだけでいい。',
                ].map((text) => (
                  <li key={text} className="flex items-center justify-between gap-3 py-5 border-b text-[16px] sm:text-[18px] font-medium leading-[1.5] tracking-[0.02em]" style={{ borderColor: '#e2d5c3', color: '#1c1410' }}>
                    <span className="flex-1">{text}</span>
                    <span className="flex-shrink-0 w-[24px] h-[24px] rounded-full flex items-center justify-center" style={{ background: 'rgba(194,114,42,0.15)' }}>
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                        <path d="M1 4L4.5 7.5L11 1" stroke="#c2722a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="rounded-[12px] p-6 sm:p-8 relative self-start" style={{ background: '#f5e8d8' }}>
                <span className="absolute pointer-events-none select-none font-[family-name:var(--font-noto-serif-jp)]" style={{ fontSize: '64px', color: '#c2722a', opacity: 0.18, top: '4px', left: '16px', lineHeight: 1 }}>&#8220;</span>
                <p className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] sm:text-[16px] leading-[1.9] tracking-[0.02em] pl-2 relative" style={{ color: '#7a6555' }}>
                  あなたの<strong style={{ color: '#1c1410', fontWeight: 700 }}>「当たり前」</strong>の中に、<br />
                  まだ伝わっていない強みがあります。<br />
                  AIキャストが引き出して、記事にします。
                </p>
              </div>
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
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.13)]">
                  <Image src={sceneAnalysis} alt="クラウスとレインが競合ホームページを分析している様子" width={520} height={520} className="w-full h-auto object-cover" sizes="(min-width: 1160px) 520px, (min-width: 768px) 50vw, 100vw" placeholder="blur" />
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
              <div className="order-2 lg:order-1 relative">
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.13)]">
                  <Image src={scenePlanning} alt="AIキャストが机でインタビューの準備をしている様子" width={520} height={520} className="w-full h-auto object-cover" sizes="(min-width: 1160px) 520px, (min-width: 768px) 50vw, 100vw" placeholder="blur" />
                </div>
                <div className="absolute -top-4 -left-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                  <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">Insight Cast</div>
                  <div className="text-[12px] font-bold text-[var(--text)]">今日のインタビューを準備中</div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
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
                    '取材後、記事づくりに進める',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-3 text-[14px] text-[var(--text2)] leading-[1.7]">
                      <span aria-hidden="true" className="mt-[3px] w-4 h-4 rounded-full bg-[var(--accent-l)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] text-[10px] font-bold">✓</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-14 sm:mt-16">
              <p className="text-[13px] font-semibold text-[var(--text3)] mb-5 tracking-[.04em]">担当するキャストを選ぶ</p>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent" />
                <div className="flex gap-4 overflow-x-auto pt-2 pb-3 pr-24 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {CHARACTERS.map((char) => (
                    <Link key={char.id} href={`/cast#${char.id}`} className="flex-shrink-0 w-[220px] flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-[18px] p-4 gap-3 transition-colors hover:border-[var(--accent)]/50 hover:shadow-[0_8px_24px_rgba(0,0,0,.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                      <div className="relative w-full aspect-square rounded-[10px] overflow-hidden bg-[var(--bg2)]">
                        <Image src={char.portrait} alt={char.name} fill sizes="188px" className="object-cover object-top" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-[family-name:var(--font-noto-serif-jp)] text-[15px] font-bold text-[var(--text)]">{char.name}</span>
                        <span className="text-[10px] text-[var(--accent)] font-semibold tracking-[.06em]">{char.label}</span>
                        <p className="mt-1 text-[11px] text-[var(--text2)] leading-[1.6] line-clamp-3">{char.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <Link href="/cast" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                  キャストをすべて見る <span aria-hidden="true">→</span>
                </Link>
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
                      <div className="text-[12px] font-bold text-[var(--accent)] mb-1">{item.label}</div>
                      <div className="text-[12px] text-[var(--text2)] leading-[1.65]">{item.body}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.13)]">
                  <Image src={sceneGrowth} alt="キャストたちがホームページ成長戦略を立てている様子" width={520} height={520} className="w-full h-auto object-cover" sizes="(min-width: 1160px) 520px, (min-width: 768px) 50vw, 100vw" placeholder="blur" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-[rgba(255,253,249,.96)] backdrop-blur-[6px] border border-[var(--border)] rounded-[14px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                  <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-[.08em] mb-1">HP Growth</div>
                  <div className="text-[12px] font-bold text-[var(--text)]">競合との差、見えてきました</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑨ Output Example */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Output Example</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              会話から、記事へ。
            </h2>
            <p className="text-base text-[var(--text2)] mt-3 max-w-[520px]">
              会話から引き出した価値をもとにテーマを作成し、複数の形式で記事をお届けします。あとは投稿先でコピー&ペーストするだけで完了です。
            </p>
            <div className="mt-11 grid gap-8 xl:grid-cols-2">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] overflow-hidden">
                <div className="px-[22px] py-4 border-b border-[var(--border)] bg-[var(--bg2)] flex items-center gap-2.5">
                  <CharacterAvatar src={freeCast[0]?.icon48} alt={`${freeCast[0]?.name ?? 'ミント'}のアイコン`} emoji={freeCast[0]?.emoji} size={28} />
                  <span className="text-[13px] font-bold text-[var(--text)]">{freeCast[0]?.name ?? 'ミント'}の取材ログ</span>
                  <span className="ml-auto bg-[var(--teal-l)] text-[var(--teal)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">完了</span>
                </div>
                <div className="p-[22px] flex flex-col gap-4">
                  {[
                    { from: 'cast', text: '仕事の時間帯って、どのくらいで動いてることが多いですか？' },
                    { from: 'user', text: 'うちは戸建てがメインなんで、朝8時ごろから15時ごろには終わらせるようにしてますね。早すぎても遅すぎてもお客さんに迷惑かかるので。' },
                    { from: 'cast', text: '15時ごろに終わらせるって、最初からそうしてたんですか？' },
                    { from: 'user', text: '父の代からそうしてるんで、自分では特に意識したことなかったですね。塗り替えって、お客さんだけじゃなくて近所の方の理解があってこそできる仕事なので、そこは大事にしてます。' },
                    { from: 'cast', text: '近所の方のことまで考えてるんですね。正直、そこまで意識してる業者さんってなかなかいないと思うんですが。' },
                    { from: 'user', text: '当たり前のことだと思ってたんですけど、言われてみるとそうかもしれないですね。父から教わってきたんで、自然とそうなってた感じです。' },
                  ].map((msg, i) => (
                    msg.from === 'cast' ? (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden border border-[var(--border)]">
                          {freeCast[0]?.icon48
                            ? <Image src={freeCast[0].icon48} alt={freeCast[0].name} width={28} height={28} className="w-full h-full object-cover" />
                            : <span className="text-base leading-none">{freeCast[0]?.emoji}</span>}
                        </div>
                        <div className="max-w-[75%] bg-[var(--bg2)] border border-[var(--border)] rounded-[4px_14px_14px_14px] px-3.5 py-2.5 text-[13px] text-[var(--text2)] leading-[1.75]">{msg.text}</div>
                      </div>
                    ) : (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[75%] bg-[var(--accent-l)] rounded-[14px_4px_14px_14px] px-3.5 py-2.5 text-[13px] text-[var(--text)] leading-[1.75]">{msg.text}</div>
                      </div>
                    )
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                {/* キャラ吹き出しヘッダー */}
                <div className="flex items-center gap-3 px-5 pt-5 pb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full border border-[var(--border)] overflow-hidden">
                    {freeCast[0]?.icon48
                      ? <Image src={freeCast[0].icon48} alt={freeCast[0].name} width={40} height={40} className="w-full h-full object-cover" />
                      : <span className="text-lg">{freeCast[0]?.emoji}</span>}
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--text2)]">
                    記事をまとめました。好きな形式でお使いください。
                  </div>
                </div>
                {/* ブロック */}
                <div className="flex flex-col gap-3 p-5 border-t border-[var(--border)]">
                  {/* タイトル */}
                  <div className="relative rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] mb-2">タイトル</div>
                    <p className="pr-20 leading-relaxed text-[var(--text)] text-base font-bold">創業者の父から受け継いだ思いやり。</p>
                    <div className="absolute right-4 top-4"><CopyButton text="創業者の父から受け継いだ思いやり。" /></div>
                  </div>
                  {/* 冒頭 */}
                  <div className="relative rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] mb-2">冒頭</div>
                    <p className="pr-20 text-sm leading-relaxed text-[var(--text)]">うちは戸建てのお客さんを中心に外壁塗装をやっています。父の代からずっと、朝8時ごろから15時ごろには作業を終わらせるようにしていて、自分もそれを引き継いでいます。</p>
                    <div className="absolute right-4 top-4"><CopyButton text="うちは戸建てのお客さんを中心に外壁塗装をやっています。父の代からずっと、朝8時ごろから15時ごろには作業を終わらせるようにしていて、自分もそれを引き継いでいます。" /></div>
                  </div>
                  {/* セクション（小見出し＋本文） */}
                  <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    <div className="relative p-5">
                      <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] mb-2">小見出し</div>
                      <p className="pr-20 text-sm font-semibold leading-relaxed text-[var(--text)]">近所の方への気遣いも、仕事のうちだと思っています</p>
                      <div className="absolute right-4 top-4"><CopyButton text="近所の方への気遣いも、仕事のうちだと思っています" /></div>
                    </div>
                    <div className="border-t border-[var(--border)]" />
                    <div className="relative p-5">
                      <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] mb-2">本文</div>
                      <p className="pr-20 text-sm leading-relaxed text-[var(--text)]">塗装の仕事って、お客さんだけじゃなくて近所の方にも迷惑をかけることがあるんです。足場を組めば通路が狭くなるし、作業音もあります。だから時間帯にはずっと気をつけてきました。<br /><br />自分では当たり前のことだと思っていたんですが、取材でそう話したら「そこまで意識している業者さんは少ない」と言われて、少し驚きました。父から教わったことなので、これからも変わらずやっていきたいです。</p>
                      <div className="absolute right-4 top-4"><CopyButton text={'塗装の仕事って、お客さんだけじゃなくて近所の方にも迷惑をかけることがあるんです。足場を組めば通路が狭くなるし、作業音もあります。だから時間帯にはずっと気をつけてきました。\n\n自分では当たり前のことだと思っていたんですが、取材でそう話したら「そこまで意識している業者さんは少ない」と言われて、少し驚きました。父から教わったことなので、これからも変わらずやっていきたいです。'} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑭-c AI記事への懸念に答える */}
        <section className="py-14 sm:py-[88px] bg-white">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">E-E-A-T</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)] leading-[1.4]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              AIが作った記事は評価されない？
            </h2>
            {/* E-E-A-T subheader */}
            <h3 className="mt-6 font-[family-name:var(--font-noto-serif-jp)] text-[20px] font-bold leading-[1.65] text-[var(--text)] sm:text-[26px]">
              <span style={{ color: '#c2722a' }}>あなた自身の言葉と体験</span>が素材だから、<br />Googleが重視する4つの基準を<span style={{ color: '#c2722a' }}>自然にクリアできる。</span>
            </h3>

            {/* E-E-A-T table */}
            <table className="mt-12 w-full border-collapse" style={{ borderTop: '1px solid #e2d5c3' }}>
              <caption className="sr-only">E-E-A-T基準とInsight Castの対応</caption>
              <thead className="max-sm:hidden">
                <tr>
                  {(['基準', '定義', 'Insight Cast の記事'] as const).map((h, i) => (
                    <th key={i} className={`py-3 text-left text-[10px] font-bold tracking-[0.12em] uppercase${i === 2 ? ' pl-4' : ''}`} style={{ color: '#b8a898', borderBottom: '1px solid #e2d5c3', width: i === 0 ? 120 : i === 1 ? 160 : 260 }}>{h}</th>
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
                        <span className="w-9 flex-shrink-0 font-[family-name:var(--font-noto-serif-jp)] font-bold leading-none" style={{ fontSize: '32px', color: '#c2722a' }}>{row.letter}</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-bold leading-none text-[var(--text)]">{row.ja}</span>
                          <span className="text-[10px] tracking-[0.06em]" style={{ color: '#b8a898' }}>{row.en}</span>
                        </div>
                      </div>
                    </td>
                    {/* Criterion */}
                    <td className="w-[160px] py-7 pr-6 align-top text-[13px] leading-[1.7] max-sm:w-auto max-sm:py-0 max-sm:pr-0" style={{ color: '#7a6555' }}>{row.criterion}</td>
                    {/* Answer */}
                    <td className="w-[260px] pl-4 py-7 align-top max-sm:w-auto max-sm:pl-0 max-sm:py-0">
                      <span className="inline-flex items-start gap-2 rounded-[5px] px-3.5 py-2.5 text-[13px] font-medium leading-[1.6] text-[var(--text)]" style={{ background: '#fff8f0', border: '1px solid rgba(194,114,42,0.25)' }}>
                        <span className="mt-[1px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#c2722a' }}>
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
              <p className="text-xs text-[var(--text3)] leading-[1.7]">
                参考：<a href="https://developers.google.com/search/blog/2023/02/google-search-and-ai-content" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[var(--accent)] transition-colors">Google Search&apos;s guidance about AI-generated content（Google Search Central）</a>
              </p>
            </div>

            {/* Footer card */}
            <div className="mt-9 flex items-center gap-3.5 rounded-[6px] px-6 py-5 text-[13px] leading-[1.8]" style={{ background: '#f5e8d8', color: '#7a6555' }}>
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(194,114,42,0.12)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.5" stroke="#c2722a" strokeWidth="1.4"/>
                  <rect x="8.2" y="8" width="1.6" height="5" rx="0.8" fill="#c2722a"/>
                  <rect x="8.2" y="5" width="1.6" height="1.6" rx="0.8" fill="#c2722a"/>
                </svg>
              </span>
              <p>AIが生成した一般的な記事では満たせない基準を、<strong className="font-bold text-[var(--text)]">あなたへの取材</strong>というプロセスが自然にクリアします。</p>
            </div>

          </div>
        </section>

        {/* ⑪ Compare */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
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

        {/* ⑫ Pricing */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Pricing</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              まず無料で体験してください。<br />2回まで、カード不要で使えます。
            </h2>
            <p className="text-base text-[var(--text2)] mt-3 max-w-[480px]">使いやすいかどうかは、使ってみないと分かりません。カード不要、メールアドレスだけで今すぐ始められます。</p>
            {/* お試し — プランではなく独立した体験導線 */}
            <div className="mt-11 rounded-[22px] border border-[var(--border)] bg-[var(--accent-l)] p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1">
                  <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--accent)] mb-2">お試し — 無料・カード不要</div>
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-[28px] font-bold text-[var(--text)] leading-none mb-1">¥0</div>
                  <div className="text-sm text-[var(--text2)] mb-5">まず体験してから、続けるか決めてください。</div>
                  <ul className="flex flex-wrap gap-x-6 gap-y-1.5">
                    {FREE_TRIAL_FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-[13px] text-[var(--text2)]">
                        <span aria-hidden="true" className="text-[11px] font-bold text-[var(--teal)]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="sm:flex-shrink-0">
                  {isLoggedIn ? (
                    <Link
                      href="/dashboard"
                      className="inline-block text-center rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      ダッシュボードへ
                    </Link>
                  ) : (
                    <Link
                      href="/auth/signup"
                      className="inline-block text-center rounded-[var(--r-sm)] px-8 py-3.5 text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-h)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                    >
                      無料で始める
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* 月額プラン */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[12px] font-semibold text-[var(--text3)] tracking-[0.08em]">続けて使うなら、月額プランへ</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {PAID_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-[22px] border p-8 flex flex-col ${plan.highlight ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_20px_56px_rgba(0,0,0,.13)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}
                >
                  <div className={`text-[11px] font-semibold tracking-[0.12em] uppercase mb-3 ${plan.highlight ? 'text-white/70' : 'text-[var(--accent)]'}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`font-[family-name:var(--font-noto-serif-jp)] text-[36px] font-bold leading-none ${plan.highlight ? 'text-white' : 'text-[var(--text)]'}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-[var(--text2)]'}`}>{plan.period}</span>
                  </div>
                  <div className={`text-[13px] mb-6 ${plan.highlight ? 'text-white/80' : 'text-[var(--text2)]'}`}>{plan.desc}</div>
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2.5 text-[13px] leading-[1.6] ${plan.highlight ? 'text-white/90' : 'text-[var(--text2)]'}`}>
                        <span aria-hidden="true" className={`mt-[3px] flex-shrink-0 text-[11px] font-bold ${plan.highlight ? 'text-white' : 'text-[var(--teal)]'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isLoggedIn ? (
                    <CheckoutButton
                      priceId={
                        plan.id === 'lightning' ? priceIds.lightning
                        : plan.id === 'personal' ? priceIds.personal
                        : priceIds.business
                      }
                      label={plan.cta}
                      featured={plan.highlight}
                    />
                  ) : (
                    <Link
                      href={`/auth/login?next=${encodeURIComponent(`/api/stripe/checkout-redirect?plan=${plan.id}`)}`}
                      className={`text-center rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${plan.highlight ? 'bg-white text-[var(--accent)] hover:bg-white/90' : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-h)]'}`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center mt-6 text-[12px] text-[var(--text3)]">
              料金の詳細は
              <Link href="/pricing" className="text-[var(--accent)] underline underline-offset-2 mx-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">料金ページ</Link>
              をご覧ください。
            </p>
          </div>
        </section>

        {/* ⑭ Blog Preview */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Blog</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              最新の記事
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">Insight Cast の考え方や、発信にまつわる話を長文の記事で読む。</p>
            <div className="mt-11 flex flex-col divide-y divide-[var(--border)] rounded-[20px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {latestPosts.map((post) => {
                const char = getCharacter(post.interviewer ?? BLOG_PREVIEW_CHARACTER[post.category]) ?? getCharacter('mint')!
                const themeColor = BLOG_CATEGORY_COLOR[post.category]
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex items-start gap-4 px-5 py-5 transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
                  >
                    <div className="relative mt-0.5 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[var(--border)]" style={{ background: `${themeColor}18` }}>
                      <Image src={char.icon48} alt={char.name} fill sizes="40px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${themeColor}1a`, color: themeColor }}>
                          {CATEGORY_LABELS[post.category]}
                        </span>
                        <span className="text-[11px] text-[var(--text3)]">{post.date}</span>
                      </div>
                      <p className="text-[15px] font-bold leading-snug text-[var(--text)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text3)] line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    <span aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[11px] font-bold text-[var(--text3)] group-hover:text-[var(--accent)] transition-colors">→</span>
                  </Link>
                )
              })}
            </div>
            <div className="text-center mt-8">
              <Link href="/blog" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                記事をもっと読む <span aria-hidden="true">→</span>
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
              <p className="text-base text-[var(--text2)] mt-3">キャスト同士の対話で、ホームページの育て方を学ぶ。</p>
              <div className="mt-8 divide-y divide-[#e8ddd0] overflow-hidden rounded-[16px] border border-[#e2d5c3] bg-[#fffdf9]">
                {latestTalks.map((talk) => {
                  const interviewer = CHARACTERS.find((c) => c.id === talk.interviewer_id)
                  const guest = CHARACTERS.find((c) => c.id === talk.guest_id)
                  const theme = CAST_TALK_THEME[talk.interviewer_id ?? ''] ?? { color: '#c2722a', label: 'Cast Talk' }
                  const dateStr = talk.published_at
                    ? (() => { const d = new Date(talk.published_at); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}` })()
                    : ''
                  return (
                    <Link
                      key={talk.id}
                      href={`/cast-talk/${talk.slug}`}
                      className="group block px-5 py-5 transition-colors duration-200 hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-[6px] border border-[#e2d5c3] bg-white px-2 py-[4px]">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: theme.color }} />
                          <span className="text-[11px] font-bold tracking-[0.08em] text-[#1c1410]">{theme.label}</span>
                        </div>
                        {[interviewer, guest].map((c, i) =>
                          c ? (
                            <div key={i} className="h-7 w-7 overflow-hidden rounded-full border-[1.5px] border-[#e2d5c3] flex-shrink-0">
                              <Image src={c.icon48} alt={c.name} width={28} height={28} className="h-full w-full object-cover" />
                            </div>
                          ) : null,
                        )}
                        <span className="text-[11px] font-semibold text-[#7a6555]">
                          {interviewer?.name ?? talk.interviewer_id} &amp; {guest?.name ?? talk.guest_id}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold leading-[1.5] text-[#1c1410] mb-2 transition-colors duration-200 group-hover:text-[var(--accent)]">
                        {talk.title}
                      </h3>
                      <div className="h-px bg-[#e8ddd0] my-2.5" />
                      {talk.summary && (
                        <p className="border-l-2 pl-3 text-sm italic leading-[1.75] text-[#7a6555]" style={{ borderColor: theme.color }}>
                          「{talk.summary}」
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text3)]">{dateStr}</span>
                        <span className="text-[11px] font-bold transition-transform duration-200 group-hover:translate-x-1 inline-block" style={{ color: theme.color }}>続きを読む <span aria-hidden="true">→</span></span>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="text-center mt-8">
                <Link href="/cast-talk" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                  Cast Talk をもっと読む <span aria-hidden="true">→</span>
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
            <div className="mt-10">
              <LpFaq faqs={FAQS} />
            </div>
            <div className="text-center mt-8">
              <Link href="/faq" className="border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-[var(--r-sm)] px-6 py-3 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                よくある質問をすべて見る <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>


      </main>


    </>
  )
}
