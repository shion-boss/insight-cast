import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { unstable_cache } from 'next/cache'

import { CharacterAvatar } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'
import { PublicHero } from '@/components/public-layout'
import { createAdminClient } from '@/lib/supabase/admin'

import { CastFitFinder } from './_components/CastFitFinder'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'AIキャスト紹介 | Insight Cast',
  description: '6名のAIキャストを紹介します。ミント・クラウス・レインの3名は無料でご利用いただけます。キャストごとに引き出せる価値と取材スタイルが異なります。深めたいテーマや伝えたいことに合わせてお選びください。',
  alternates: { canonical: `${APP_URL}/cast` },
  openGraph: {
    title: 'AIキャスト紹介 | Insight Cast',
    description: '6名のAIキャストを紹介。ミント・クラウス・レインの3名は無料で使えます。引き出せる価値と取材スタイルが違うので、テーマに合わせて選べます。',
    url: `${APP_URL}/cast`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIキャスト紹介 | Insight Cast',
    description: '6名のAIキャストを紹介。ミント・クラウス・レインの3名は無料で使えます。',
    images: ['/logo.jpg'],
  },
}

const freeCasts = CHARACTERS.filter((c) => c.available)
const addonCasts = CHARACTERS.filter((c) => !c.available)

const castDetails: Record<string, { desc: string; specialty: string; strengths: string[]; input: string }> = {
  mint: {
    desc: '親しみやすい雰囲気で、事業者が当たり前だと思っていることの中から、まだホームページで伝えられていない魅力を引き出します。初めての方でも安心して話せる、やさしい取材スタイルです。',
    specialty: '安心感・気づかい・サービスの温かさ',
    strengths: ['初めて会った気がしない会話の進め方', 'お客様が感じる安心感・人柄', 'ふだんの気づかいや心がけ'],
    input: 'テキスト（チャット形式）',
  },
  claus: {
    desc: '業種の知識をもとに、技術・判断基準・こだわりをホームページで伝わる言葉として引き出します。「なぜその方法を選んでいるか」を深掘りすることで、専門性の価値を可視化します。',
    specialty: '専門性・判断基準・他社との違い',
    strengths: ['仕事のこだわりや判断基準', '他社との技術・材料の違い', 'プロだから分かる選び方の理由'],
    input: 'テキスト（チャット形式）',
  },
  rain: {
    desc: 'マーケティング視点で、事業者がうまく言葉にできていない「なぜ選ばれているか」を引き出します。競合との違いを自然に浮かび上がらせ、HPやSNSで使えるメッセージの軸をつくります。',
    specialty: '訴求ポイント・強みの言語化・差別化',
    strengths: ['なぜ選ばれているのかの言語化', '競合との比較で見えてくる違い', 'HPやSNSで刺さる伝え方の軸'],
    input: 'テキスト（チャット形式）',
  },
  hal: {
    desc: 'お店や仕事場の写真を入り口に、人柄・スタッフとの関係・空気感を引き出す取材スタイル。',
    specialty: '人柄・空気感・場の雰囲気',
    strengths: ['スタッフやお客様との関係のエピソード', '仕事場の空気や雰囲気', '数字では伝わらない人柄のストーリー'],
    input: '画像 + テキスト',
  },
  mogro: {
    desc: '自由記述なし。二択の積み重ねで、まだ言葉になっていない価値を静かに掘り起こします。',
    specialty: '判断基準の深掘り・価値の輪郭',
    strengths: ['当たり前すぎて見落としていたこだわり', '他の人もやると思っていたけれど実は違うこと', '二択の積み重ねで見えてくる選ばれる理由'],
    input: 'はい / いいえ',
  },
  cocco: {
    desc: '告知・キャンペーン・季節の話題など「今」に関わる内容をSNSやHPに使える言葉に落とし込みます。',
    specialty: '告知・キャンペーン・今伝えたいこと',
    strengths: ['新しく始めたことやお知らせ', '季節のおすすめや期間限定の話題', 'SNSやHPにそのまま使えるお知らせ素材'],
    input: 'テキスト',
  },
}

type TalkPreview = { slug: string; title: string | null; summary: string | null; interviewer_id: string | null; guest_id: string | null } | null

const getLatestTalkByCharacter = unstable_cache(
  async (characterId: string): Promise<TalkPreview> => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('cast_talks')
      .select('slug, title, summary, interviewer_id, guest_id')
      .eq('status', 'published')
      .or(`interviewer_id.eq.${characterId},guest_id.eq.${characterId}`)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data ?? null
  },
  ['cast-page-latest-talk'],
  { revalidate: 300 },
)

type HeroLine = { role: 'cast' | 'user'; charId?: string; text: string }
const heroDialog: HeroLine[] = [
  { role: 'cast', charId: 'mint', text: 'こんにちは、ミントです。今日のお仕事のこと、聞かせてもらえますか？' },
  { role: 'user', text: '特別なことはしてなくて…ふだん通りやっているだけです。' },
  { role: 'cast', charId: 'mint', text: 'その「ふだん通り」の中に、まだ言葉になっていない魅力がありそうです。' },
]

function CastHeroDialog() {
  const otherCasts = CHARACTERS.filter((c) => c.id !== 'mint')
  return (
    <div>
      <div className="flex flex-col gap-5" aria-label="インタビューの会話例">
        {heroDialog.map((m, i) => {
          const cast = m.charId ? CHARACTERS.find((c) => c.id === m.charId) : null
          return (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'cast' && cast && (
                <CharacterAvatar
                  src={cast.icon48}
                  alt={`${cast.name}のアイコン`}
                  emoji={cast.emoji}
                  size={36}
                  className="-mt-1 flex-shrink-0 border-[var(--border)] bg-[var(--accent-l)]"
                />
              )}
              <div
                className={`max-w-[68%] px-4 py-3 text-[14px] leading-[1.8] whitespace-pre-wrap break-words border border-[var(--border)] text-[var(--text)] rounded-[var(--r-lg)] shadow-[var(--elevation-1)] ${
                  m.role === 'cast'
                    ? 'bg-[var(--surface)] rounded-tl-none'
                    : 'bg-[var(--accent-l)] rounded-tr-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          )
        })}
      </div>

      {/* 他のキャストの存在を視覚的に提示 */}
      <div className="mt-6 pt-5 border-t border-[var(--border)]">
        <div className="text-xs font-bold uppercase tracking-[.12em] text-[var(--text3)] mb-3">ほかのキャスト</div>
        <div className="flex items-start gap-3 flex-wrap">
          {otherCasts.map((char) => (
            <div key={char.id} className="flex flex-col items-center gap-1.5 w-[52px]">
              <CharacterAvatar
                src={char.icon48}
                alt={`${char.name}のアイコン`}
                emoji={char.emoji}
                size={40}
                className="border-[var(--border)] bg-[var(--surface)]"
              />
              <span className="text-[13px] text-[var(--text2)] leading-tight text-center">{char.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'AIキャスト紹介', item: `${APP_URL}/cast` },
  ],
}

const castJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Insight Cast AIキャスト一覧',
  description: '6名のAIキャストがそれぞれ異なる角度から取材を行います。',
  url: `${APP_URL}/cast`,
  itemListElement: CHARACTERS.map((char, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    item: {
      '@type': 'Person',
      name: char.name,
      jobTitle: 'AIインタビュアー',
      description: char.specialty ?? char.label,
      url: `${APP_URL}/cast#${char.id}`,
    },
  })),
}

export default async function CastPage() {
  const talksByChar = Object.fromEntries(
    await Promise.all(freeCasts.map(async (c) => [c.id, await getLatestTalkByCharacter(c.id)]))
  ) as Record<string, TalkPreview>

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(castJsonLd) }}
      />

      <main id="main-content" className="relative z-10">
        <PublicHero
          compact
          eyebrow="Cast"
          title={<>あなたの話を聞く、<br />キャストたち。</>}
          description="6名のAIキャストが、それぞれ違う角度から取材します。いまの悩みに合うキャストを選べば、ふだんの言葉が、ホームページに使える素材になります。"
          aside={<CastHeroDialog />}
          asideBare
          asideClassName=""
        />

        {/* Cast Reading — 占い風キャスト診断（パネル自体に見出しを内包） */}
        <section className="py-12 sm:py-16 bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <CastFitFinder />
          </div>
        </section>

        {/* Free Casts Detail */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--on-primary-container)]">Free Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              無料キャスト
            </h2>
            <div className="mt-10 space-y-6">
              {freeCasts.map((char, index) => {
                const detail = castDetails[char.id]
                if (!detail) return null
                return (
                  <div
                    key={char.id}
                    id={char.id}
                    className="scroll-mt-24"
                  >
                    {/* メインカード: イントロ + 詳細ボックスを1つの塊に */}
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-10">
                      {/* 上: 画像 + 名前情報 */}
                      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center lg:gap-12">
                        <div>
                          <div className="rounded-[18px] overflow-hidden bg-[var(--bg2)] aspect-square flex items-center justify-center">
                            <Image
                              src={char.portrait}
                              alt={`${char.name}のポートレート`}
                              width={240}
                              height={240}
                              className="h-full w-full object-contain"
                              priority={index === 0}
                              sizes="(min-width: 1024px) 240px, 100vw"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-[13px] text-[var(--text2)] mb-1">{char.species}</div>
                          <div className="font-[family-name:var(--font-noto-serif-jp)] text-[32px] font-bold text-[var(--text)] mb-1">{char.name}</div>
                          <div className="text-[13px] text-[var(--on-primary-container)] font-semibold tracking-[.1em] uppercase mb-4">{char.label}</div>
                          <div className="font-[family-name:var(--font-noto-serif-jp)] text-[19px] font-semibold text-[var(--text)] leading-[1.45] mb-4 pl-4 border-l-[3px] border-[var(--accent)]">
                            {char.id === 'mint'
                              ? 'お客様目線で、やさしく引き出します'
                              : char.id === 'claus'
                              ? '専門知識をやさしい言葉に変えます'
                              : char.id === 'rain'
                              ? '選ばれる理由を一緒に見つけます'
                              : char.specialty || detail.specialty}
                          </div>
                          <p className="text-base text-[var(--text2)] leading-[1.9]">{detail.desc}</p>
                        </div>
                      </div>

                      {/* 下: 詳細ボックス（背景色付き・両カラムの下） */}
                      <div className="mt-8 rounded-[16px] bg-[var(--bg2)] p-6 lg:p-7">
                        <div className="grid gap-x-10 gap-y-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start">
                          <div className="text-[11px] font-bold uppercase tracking-[.1em] text-[var(--text3)]">専門分野</div>
                          <div className="text-base text-[var(--text)] leading-[1.7]">{detail.specialty}</div>

                          <div className="text-[11px] font-bold uppercase tracking-[.1em] text-[var(--text3)] sm:pt-1">得意なこと</div>
                          <ul className="text-base text-[var(--text)] space-y-1.5">
                            {detail.strengths.map((s) => (
                              <li key={s} className="flex items-start gap-2 leading-[1.7]">
                                <span aria-hidden="true" className="mt-[9px] h-1 w-1 rounded-full bg-[var(--accent)] flex-shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="text-[11px] font-bold uppercase tracking-[.1em] text-[var(--text3)]">入力形式</div>
                          <div className="text-base text-[var(--text)]">{detail.input}</div>
                        </div>
                      </div>

                      {/* Cast Talk 対話記事プレビュー（メインカード内） */}
                      {talksByChar[char.id] && (
                        <Link
                          href={`/cast-talk/${talksByChar[char.id]!.slug}`}
                          className="group mt-4 flex items-start gap-4 rounded-[16px] bg-[var(--bg2)] p-5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 text-[11px] font-bold tracking-[0.08em] uppercase text-[var(--on-primary-container)]">キャスト対談</div>
                            <div className="text-base font-semibold leading-[1.5] text-[var(--text)] line-clamp-2 group-hover:text-[var(--accent)]">
                              {talksByChar[char.id]!.title}
                            </div>
                            {talksByChar[char.id]!.summary && (
                              <div className="mt-1 text-[12px] leading-relaxed text-[var(--text2)] line-clamp-2">
                                {talksByChar[char.id]!.summary}
                              </div>
                            )}
                          </div>
                          <span className="shrink-0 text-[12px] font-bold text-[var(--on-primary-container)] transition-transform duration-200 group-hover:translate-x-1 inline-block mt-0.5">
                            読む <span aria-hidden="true">→</span>
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </section>

        {/* Addon Casts */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--on-primary-container)]">Limited-time Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              専門キャスト（期間限定で全プラン込み）
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">
              この3キャストは、期間限定で <strong className="text-[var(--text)]">無料プランを含むすべてのプランで利用可能</strong> です。
              将来は買い切り商品として切り替える予定ですが、<strong className="text-[var(--text)]">期間中に登録したアカウントはその後も継続的にプラン内で利用できます</strong>。
            </p>

            <div className="mt-10 space-y-6">
              {addonCasts.map((char) => {
                const detail = castDetails[char.id]
                if (!detail) return null
                return (
                  <div
                    key={char.id}
                    id={char.id}
                    className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-10 scroll-mt-24"
                  >
                    {/* 上: 画像 + 名前情報 */}
                    <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center lg:gap-12">
                      <div>
                        <div className="rounded-[18px] overflow-hidden bg-[var(--bg2)] aspect-square flex items-center justify-center">
                          <Image
                            src={char.portrait}
                            alt={`${char.name}のポートレート`}
                            width={240}
                            height={240}
                            className="h-full w-full object-contain"
                            sizes="(min-width: 1024px) 240px, 100vw"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-[13px] text-[var(--text2)] mb-1">{char.species}</div>
                        <div className="font-[family-name:var(--font-noto-serif-jp)] text-[32px] font-bold text-[var(--text)] mb-1">{char.name}</div>
                        <div className="text-[13px] text-[var(--on-primary-container)] font-semibold tracking-[.1em] uppercase mb-4">{char.label}</div>
                        <div className="font-[family-name:var(--font-noto-serif-jp)] text-[19px] font-semibold text-[var(--text)] leading-[1.45] mb-4 pl-4 border-l-[3px] border-[var(--accent)]">
                          {char.specialty || detail.specialty}
                        </div>
                        <p className="text-base text-[var(--text2)] leading-[1.9]">{detail.desc}</p>
                      </div>
                    </div>

                    {/* 下: 詳細ボックス（背景色付き・両カラムの下） */}
                    <div className="mt-8 rounded-[16px] bg-[var(--bg2)] p-6 lg:p-7">
                      <div className="grid gap-x-10 gap-y-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start">
                        <div className="text-[11px] font-bold uppercase tracking-[.1em] text-[var(--text3)]">専門分野</div>
                        <div className="text-base text-[var(--text)] leading-[1.7]">{detail.specialty}</div>

                        <div className="text-[11px] font-bold uppercase tracking-[.1em] text-[var(--text3)] sm:pt-1">得意なこと</div>
                        <ul className="text-base text-[var(--text)] space-y-1.5">
                          {detail.strengths.map((s) => (
                            <li key={s} className="flex items-start gap-2 leading-[1.7]">
                              <span aria-hidden="true" className="mt-[9px] h-1 w-1 rounded-full bg-[var(--accent)] flex-shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="text-[11px] font-bold uppercase tracking-[.1em] text-[var(--text3)]">入力形式</div>
                        <div className="text-base text-[var(--text)]">{detail.input}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </section>

        {/* Cast Talk バナー（ページ末尾） */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="rounded-[20px] border border-[var(--outline)] bg-[var(--surface)] px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--on-primary-container)] mb-2">キャスト対談</div>
                <p className="text-lg font-semibold text-[var(--text)] mb-1.5">
                  キャストの実際の対話を読んでみる
                </p>
                <p className="text-base text-[var(--text2)] leading-relaxed">
                  ミント・クラウス・レインが実際にどんな質問をするのか。<br className="hidden sm:block" />
                  対話形式の記事で、取材スタイルを確認できます。
                </p>
              </div>
              <Link
                href="/cast-talk"
                className="shrink-0 inline-flex items-center rounded-full border-[1.5px] border-[var(--accent)] px-6 py-3 text-base font-semibold text-[var(--on-primary-container)] transition-colors hover:bg-[var(--accent)] hover:text-white"
              >
                キャスト対談を読む <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>


    </>
  )
}
