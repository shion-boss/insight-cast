import type { Metadata } from 'next'
import Image from 'next/image'

import { CHARACTERS } from '@/lib/characters'
import aboutImage from '@/assets/about/about.png'
import shionImage from '@/assets/about/shion.png'
import directorImage from '@/assets/about/director.png'
import engineerImage from '@/assets/about/engineer.png'
import aiDesignerImage from '@/assets/about/ai-designer.png'
import reviewerImage from '@/assets/about/reviewer.png'
import marketerImage from '@/assets/about/marketer.png'
import operatorImage from '@/assets/about/operator.png'
import financeImage from '@/assets/about/finance.png'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'About', item: `${APP_URL}/about` },
  ],
}

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  url: `${APP_URL}/about`,
  name: 'Insight Cast について',
  description: 'Insight Cast がインタビューを起点にする理由、大切にしていること、AIキャストの役割を紹介します。',
  publisher: {
    '@type': 'Organization',
    name: 'Insight Cast',
    url: APP_URL,
  },
}

export const metadata: Metadata = {
  title: 'About | Insight Cast',
  description: 'Insight Cast がインタビューを起点にしている理由、大切にしていること、AIキャストそれぞれの役割を紹介します。会話から記事へ。あなたの当たり前を言葉にするために存在するサービスの考え方です。',
  alternates: { canonical: `${APP_URL}/about` },
  openGraph: {
    title: 'About | Insight Cast',
    description: 'Insight Cast がインタビューを起点にする理由、AIキャストの役割を紹介します。',
    url: `${APP_URL}/about`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | Insight Cast',
    description: 'Insight Cast がインタビューを起点にする理由、AIキャストの役割を紹介します。',
    images: ['/logo.jpg'],
  },
}

const CAST_BENEFITS: Record<string, string> = {
  mint: '私と話すと、お客様が喜んでいるあの瞬間が、ホームページの言葉になります。',
  claus: 'あなたの仕事のこだわりと判断基準を、私が言葉にして整えます。競合との違いが、読んだ人に伝わる形になります。',
  rain: '私と話すと、あなたのサービスが「選ばれる理由」として整理されます。来た人が「ここに頼みたい」と感じる言葉を引き出します。',
  hal: '写真を1枚送ってください。そこから、あなたの場の空気と人柄を言葉にします。',
  mogro: '「はい」か「いいえ」で答えるだけでいいです。そうすることで、自分でも気づいていなかった強みの輪郭が見えてきます。',
  cocco: '私に話してください。キャンペーンやイベントの大切なお知らせが、お客様に届く言葉になります。',
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />

      <main id="main-content" className="relative z-10">

        {/* ① FV */}
        <section className="relative overflow-hidden bg-[var(--bg)]" style={{ minHeight: '420px' }}>
          {/* 右側に画像をフルブリード（モバイルでは非表示） */}
          <div className="hidden md:block absolute right-0 top-0 h-full w-[45%]">
            <Image
              src={aboutImage}
              alt="Insight CastのAIキャストたちが集まっているオフショット風の様子"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to right, rgba(253,247,240,0.25), transparent 50%)' }}
            />
          </div>

          {/* テキストはヘッダーと同じコンテナ内 */}
          <div
            className="relative z-10 mx-auto max-w-6xl px-6"
            style={{ paddingTop: 'calc(108px + clamp(24px,3vw,48px))', paddingBottom: 'clamp(48px,6vw,96px)' }}
          >
            <div className="md:w-[55%] md:pr-12">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] mb-4">About</p>
              <h1
                className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.65] mb-7"
                style={{ fontSize: 'clamp(24px,3vw,40px)' }}
              >
                語られていない価値が、<br />ホームページを変える。
              </h1>
              <div className="w-9 h-0.5 rounded-[1px] bg-[var(--accent)] opacity-45 mb-8" />
              <p
                className="text-[var(--text2)] leading-[1.9]"
                style={{ fontSize: 'clamp(14px,1.2vw,16px)' }}
              >
                長年の仕事で積み上げてきた判断や工夫は、あなたには「普通のこと」かもしれません。でも、それがお客さんにとっての「選ぶ理由」になっていることがあります。Insight Cast は、あなたの中にある Insight（洞察）を引き出し、ホームページへと Cast（届ける）サービスです。
              </p>
            </div>

            {/* モバイル用画像（mdより小さい時にインライン表示） */}
            <div className="mt-8 -mx-6 h-[260px] relative overflow-hidden md:hidden">
              <Image
                src={aboutImage}
                alt="Insight CastのAIキャストたちが集まっているオフショット風の様子"
                fill
                className="object-cover object-center"
                sizes="100vw"
              />
            </div>
          </div>
        </section>


        {/* ② WHY */}
        <section className="bg-[var(--bg2)]" style={{ padding: 'clamp(64px,7vw,96px) clamp(32px,6vw,80px)' }}>
          <div className="max-w-[800px] mx-auto">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] mb-4">Why We Started</p>
            <h2
              className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] leading-[1.65] mb-10"
              style={{ fontSize: 'clamp(20px,2.2vw,28px)' }}
            >
              「書くことがない」は、思い込みでした。
            </h2>
            <div style={{ fontSize: 'clamp(14px,1.1vw,16px)' }} className="text-[var(--text2)] leading-[2.0]">
              <p className="mb-6">
                ホームページを更新できていない事業者に話を聞くと、「ネタがない」「書く時間がない」という言葉が返ってきます。でも、もう少し話を続けると、不思議なことが起きます。こだわってきた仕入れ先のこと、繁忙期を乗り越えた方法、お客さんから言われて初めて気づいた自分の強み。そういう話が、次々と出てくるのです。
              </p>
              <p className="mb-6">
                書けていないのは、ネタがないからではありませんでした。引き出す仕組みがなかっただけでした。そのことに気づいた時、私たちはホームページの更新問題を「文章力の問題」ではなく「取材の問題」として捉え直しました。
              </p>
              <p>
                AI検索が広がるいま、誰でも書けるような記事の価値は下がっています。一方で、事業者本人にしか語れない体験や判断は、どんな技術でも代替できません。Insight Cast は「取材から始める」という設計にこだわっています。あなたの中にある当たり前を、まず引き出すことから。
              </p>
            </div>
          </div>
        </section>


        {/* ③ Mission */}
        <section className="relative overflow-hidden" style={{ background: 'var(--text)', padding: 'clamp(64px,8vw,112px) clamp(32px,8vw,120px)' }}>
          {/* radial decoration */}
          <div
            className="absolute pointer-events-none"
            style={{ top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(194,114,42,0.1) 0%, transparent 65%)' }}
          />
          <div className="relative z-10 max-w-[800px] mx-auto">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] opacity-70 mb-4">Mission</p>
            <p
              className="font-[family-name:var(--font-noto-serif-jp)] font-bold leading-[1.75] mb-10"
              style={{ color: '#f0e8dc', fontSize: 'clamp(18px,2.4vw,30px)' }}
            >
              あなたの体験にしか、語れないことがあります。<br className="hidden sm:block" />
              積み上げてきた判断、失敗して直した工夫、お客さんに何度も言われてきた言葉。<br className="hidden sm:block" />
              それが、あなたのホームページを唯一無二にする素材です。
            </p>
            <p
              className="leading-[2.0] max-w-[620px]"
              style={{ color: 'rgba(240,232,220,0.65)', fontSize: 'clamp(14px,1.1vw,16px)' }}
            >
              大手の記事制作会社には、あなたの現場には入れません。長年あなたが培ってきた細かい判断基準も、お客さんとのやりとりで生まれた気づきも、外から書いた文章には乗らない。Insight Cast が引き出すのは、そういう一次情報です。ホームページが少しずつ育っていくのは、そこに本物の言葉があるからだと、私たちは信じています。
            </p>
          </div>
        </section>



        {/* ④ Our Cast */}
        <section className="bg-[var(--bg)]" style={{ padding: 'clamp(64px,7vw,96px) clamp(32px,6vw,80px)' }}>
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] mb-4">Our Cast</p>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(20px,2.2vw,28px)' }}>
              インタビューを担当するAIキャスト
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[800px] mx-auto">
            {CHARACTERS.map((char) => (
              <div
                key={char.id}
                className="bg-[var(--bg)] rounded-[4px] flex flex-col gap-0"
                style={{ padding: '20px' }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 relative border border-[var(--border)]">
                    <Image
                      src={char.portrait}
                      alt={char.name}
                      fill
                      className="object-cover object-top"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-[15px]">{char.name}</p>
                    <p className="text-[11px] text-[var(--text2)]">{char.species}</p>
                    {char.label && (
                      <p className="text-[11px] text-[var(--text2)] opacity-70 truncate">{char.label}</p>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-bold tracking-[0.08em] rounded-[20px] px-2.5 py-0.5 border flex-shrink-0 self-start text-[var(--accent)] border-[rgba(194,114,42,0.3)] bg-[rgba(194,114,42,0.06)]"
                  >
                    {char.available ? '取材中' : '期間限定で取材中'}
                  </span>
                </div>
                {CAST_BENEFITS[char.id] && (
                  <p className="text-[12px] text-[var(--text2)] leading-[1.85] border-t border-[var(--border)] pt-4">
                    {CAST_BENEFITS[char.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>


        {/* ⑤ Team */}
        <section className="bg-[var(--bg2)]" style={{ padding: 'clamp(64px,7vw,96px) clamp(32px,6vw,80px)' }}>
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--accent)] mb-4">Our Team</p>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)]" style={{ fontSize: 'clamp(20px,2.2vw,28px)' }}>
              Insight Cast を支えるメンバー
            </h2>
          </div>
          <div className="max-w-[640px] mx-auto">
            <div className="bg-[var(--bg)] rounded-[4px]" style={{ padding: '36px 32px' }}>
              <p className="text-[11px] font-bold tracking-[0.1em] text-[var(--text2)] opacity-60 mb-5">代表</p>
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 relative">
                  <Image src={shionImage} alt="シオン" fill className="object-cover" sizes="80px" />
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-[16px]">
                    シオン
                  </p>
                  <p className="text-[13px] text-[var(--text2)] leading-[1.85]">
                    Insight Cast を作ったのは、「ホームページが更新されないのは、事業者の怠慢ではなく、引き出す仕組みがないからだ」という確信からでした。
                  </p>
                  <p className="text-[13px] text-[var(--text2)] leading-[1.85]">
                    エンジニアとして多くの中小企業のデジタル化に関わった経験をもとに、取材という設計思想とAIを組み合わせたサービスを開発しています。
                  </p>
                </div>
              </div>
              <p
                className="text-[13px] text-[var(--text2)] leading-[1.9] border-t border-[var(--border)] pt-5"
              >
                このサービス自体も、Insight Cast を使って育てています。自分たちで使えないものは、お客さんには届けられない。そう信じて、開発と運用を続けています。
              </p>
            </div>
            <div className="mt-6 bg-[var(--bg)] rounded-[4px]" style={{ padding: '28px 32px' }}>
              <p className="text-[11px] font-bold tracking-[0.1em] text-[var(--text2)] opacity-60 mb-5">AIサポーター</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { img: directorImage, role: '統括', desc: 'サービス全体の方向性と進め方を決めています' },
                  { img: engineerImage, role: '開発', desc: 'ツールの画面や機能をつくっています' },
                  { img: aiDesignerImage, role: 'AI設計', desc: 'インタビュアーたちの「聞き方」を考えています' },
                  { img: reviewerImage, role: '品質管理', desc: '出てきた言葉が正確か、丁寧かを確かめています' },
                  { img: marketerImage, role: '発信', desc: 'このサービスを必要な人に届ける活動をしています' },
                  { img: operatorImage, role: 'サポート', desc: 'ご不明な点の対応と、日々の運用を担っています' },
                  { img: financeImage, role: 'コスト管理', desc: 'サービスが無駄なく動くよう費用を見ています' },
                ] as const).map(({ img, role, desc }) => (
                  <div key={role} className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-[6px] overflow-hidden relative flex-shrink-0 border border-[var(--border)]">
                      <Image src={img} alt={role} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 pt-1">
                      <p className="text-[12px] font-bold text-[var(--text)]">{role}</p>
                      <p className="text-[11px] text-[var(--text2)] leading-[1.6]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
