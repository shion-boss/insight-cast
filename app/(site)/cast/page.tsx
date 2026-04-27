import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { CharacterAvatar } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'
import { PublicHero } from '@/components/public-layout'
import { createAdminClient } from '@/lib/supabase/admin'

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIキャスト紹介 | Insight Cast',
    description: '6名のAIキャストを紹介。ミント・クラウス・レインの3名は無料で使えます。',
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

async function getLatestTalkByCharacter(characterId: string): Promise<TalkPreview> {
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

      <main className="relative z-10">
        <PublicHero
          compact
          eyebrow="Cast"
          title={<>あなたの話を聞く<br />キャストたち</>}
          description="6名のキャストが、それぞれ違う角度から話を聞きます。いま深めたいテーマに合わせて選べます。"
          aside={
            <div className="grid grid-cols-3 gap-3">
              {CHARACTERS.map((char) => (
                <div key={char.id} className={`rounded-[16px] overflow-hidden border border-[var(--border)] text-center p-3 ${!char.available ? 'opacity-70' : ''}`}>
                  <CharacterAvatar
                    src={char.icon96}
                    alt={char.available ? `${char.name}のアイコン` : `${char.name}のアイコン（準備中）`}
                    emoji={char.emoji}
                    size={64}
                    className="mx-auto"
                  />
                  <div className="font-[family-name:var(--font-noto-serif-jp)] text-sm font-bold text-[var(--text)] mt-2">{char.name}</div>
                  <div className="text-[10px] text-[var(--accent)] font-semibold tracking-[.06em] mt-0.5">
                    {char.available ? char.label : '準備中'}
                  </div>
                </div>
              ))}
            </div>
          }
          asideClassName="p-4"
        />

        {/* How to choose */}
        <section className="py-10 sm:py-14 bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] text-lg font-bold text-[var(--text)]">どのキャストを選べばいいですか？</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { q: '自社の雰囲気や人柄を伝えたい', a: '→ ミント' },
                { q: '技術・専門性の違いを言語化したい', a: '→ クラウス' },
                { q: '選ばれる理由・差別化を整理したい', a: '→ レイン' },
              ].map((item) => (
                <div key={item.q} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-5">
                  <div className="text-sm text-[var(--text2)] mb-2">{item.q}</div>
                  <div className="text-sm font-bold text-[var(--accent)]">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Free Casts Detail */}
        <section className="py-14 sm:py-[88px]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Free Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              無料キャスト
            </h2>
            <div className="mt-12">
              {freeCasts.map((char, index) => {
                const detail = castDetails[char.id]
                if (!detail) return null
                return (
                  <div
                    key={char.id}
                    id={char.id}
                    className={`grid gap-8 pb-14 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-14 ${index < freeCasts.length - 1 ? 'mb-14 border-b border-[var(--border)]' : ''}`}
                  >
                    <div>
                      <div className="rounded-[24px] overflow-hidden shadow-[0_16px_48px_var(--shadow)] bg-[var(--bg2)] aspect-square flex items-center justify-center">
                        <Image
                          src={char.portrait}
                          alt={`${char.name}のポートレート`}
                          width={340}
                          height={340}
                          className="h-full w-full object-contain"
                          priority={index === 0}
                          sizes="(min-width: 1024px) 340px, 100vw"
                        />
                      </div>
                      <div className="mt-4 flex gap-2 flex-wrap">
                        <span className="bg-[var(--teal-l)] text-[var(--teal)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">無料</span>
                        <span className="inline-flex items-center gap-1.5 bg-[var(--accent-l)] text-[var(--accent)] rounded-full text-[12px] font-semibold px-3.5 py-1.5">
                          入力: {detail.input}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[13px] text-[var(--text3)] mb-1.5">{char.species}</div>
                      <div className="font-[family-name:var(--font-noto-serif-jp)] text-[36px] font-bold text-[var(--text)] mb-1.5">{char.name}</div>
                      <div className="text-[13px] text-[var(--accent)] font-semibold tracking-[.1em] uppercase mb-4">{char.label}</div>
                      <div className="font-[family-name:var(--font-noto-serif-jp)] text-xl font-semibold text-[var(--text)] leading-[1.45] mb-5 pl-4 border-l-[3px] border-[var(--accent)]">
                        {char.id === 'mint'
                          ? 'お客様目線で、やさしく引き出します'
                          : char.id === 'claus'
                          ? '専門知識をやさしい言葉に変えます'
                          : char.id === 'rain'
                          ? '選ばれる理由を一緒に見つけます'
                          : char.specialty || detail.specialty}
                      </div>
                      <p className="text-[15px] text-[var(--text2)] leading-[1.9] mb-3">{detail.desc}</p>
                      <div className="bg-[var(--bg2)] rounded-[14px] px-6 py-5 mt-5">
                        <div className="flex items-start gap-3 py-2.5 border-b border-[var(--border)]">
                          <span className="text-sm font-semibold text-[var(--text)] w-[100px] flex-shrink-0">専門分野</span>
                          <span className="text-sm text-[var(--text2)]">{detail.specialty}</span>
                        </div>
                        <div className="flex items-start gap-3 py-2.5 border-b border-[var(--border)]">
                          <span className="text-sm font-semibold text-[var(--text)] w-[100px] flex-shrink-0">得意なこと</span>
                          <span className="text-sm text-[var(--text2)]">
                            {detail.strengths.map((s, i) => <span key={i} className="block">• {s}</span>)}
                          </span>
                        </div>
                        <div className="flex items-start gap-3 py-2.5">
                          <span className="text-sm font-semibold text-[var(--text)] w-[100px] flex-shrink-0">入力形式</span>
                          <span className="text-sm text-[var(--text2)]">{detail.input}</span>
                        </div>
                      </div>
                      {/* Cast Talk 対話記事プレビュー */}
                      {talksByChar[char.id] && (
                        <Link
                          href={`/cast-talk/${talksByChar[char.id]!.slug}`}
                          className="group mt-5 flex items-start gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--bg2)] p-4 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--accent-l)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 text-[11px] font-bold tracking-[0.08em] text-[var(--accent)]">Cast Talk</div>
                            <div className="text-sm font-semibold leading-[1.5] text-[var(--text)] line-clamp-2 group-hover:text-[var(--accent)]">
                              {talksByChar[char.id]!.title}
                            </div>
                            {talksByChar[char.id]!.summary && (
                              <div className="mt-1 text-[12px] leading-relaxed text-[var(--text3)] line-clamp-2">
                                {talksByChar[char.id]!.summary}
                              </div>
                            )}
                          </div>
                          <span className="shrink-0 text-[12px] font-bold text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-1 inline-block mt-0.5">
                            読む →
                          </span>
                        </Link>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cast Talk バナー */}
            <div className="mt-16 rounded-[20px] border border-[#e2d5c3] bg-[#fffdf9] px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--accent)] mb-2">Cast Talk</div>
                <p className="text-lg font-semibold text-[var(--text)] mb-1.5">
                  キャストの実際の対話を読んでみる
                </p>
                <p className="text-sm text-[var(--text2)] leading-relaxed">
                  ミント・クラウス・レインが実際にどんな質問をするのか。<br className="hidden sm:block" />
                  対話形式の記事で、取材スタイルを確認できます。
                </p>
              </div>
              <Link
                href="/cast-talk"
                className="shrink-0 inline-flex items-center rounded-[var(--r-sm)] border-[1.5px] border-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                Cast Talk を読む →
              </Link>
            </div>
          </div>
        </section>

        {/* Addon Casts */}
        <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
          <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Add-on Cast</div>
            <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
              追加キャスト（近日公開）
            </h2>
            <p className="text-base text-[var(--text2)] mt-3">今後、追加購入で選べるようになる予定のキャストです。</p>

            <div className="mt-10 space-y-4">
              {addonCasts.map((char) => {
                const detail = castDetails[char.id]
                if (!detail) return null
                return (
                  <div
                    key={char.id}
                    className="grid gap-8 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6 opacity-75 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-10 lg:p-10"
                  >
                    <div>
                      <div className="rounded-[18px] overflow-hidden bg-[var(--bg2)] aspect-square flex items-center justify-center">
                        <Image
                          src={char.portrait}
                          alt={`${char.name}のポートレート`}
                          width={200}
                          height={200}
                          className="h-full w-full object-contain grayscale-[15%]"
                          sizes="(min-width: 1024px) 200px, 100vw"
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <span className="bg-[var(--bg2)] text-[var(--text3)] border border-[var(--border)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">準備中</span>
                        <span className="bg-[var(--bg2)] text-[var(--text3)] border border-[var(--border)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">入力: {detail.input}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[13px] text-[var(--text3)] mb-1">{char.species}</div>
                      <div className="font-[family-name:var(--font-noto-serif-jp)] text-[28px] font-bold text-[var(--text)] mb-1">{char.name}</div>
                      <div className="text-[13px] text-[var(--accent)] font-semibold tracking-[.1em] uppercase mb-4">{char.label}</div>
                      <div className="font-[family-name:var(--font-noto-serif-jp)] text-[17px] font-semibold text-[var(--text)] leading-[1.45] mb-4 pl-4 border-l-[3px] border-[var(--accent)]">
                        {char.specialty}
                      </div>
                      <p className="text-sm text-[var(--text2)] leading-[1.9]">{detail.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </section>
      </main>


    </>
  )
}
