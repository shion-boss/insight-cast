import type { Metadata } from 'next'
import Image from 'next/image'

import { ButtonLink, CharacterAvatar, SectionIntro, StatusPill, SurfaceCard } from '@/components/ui'
import { PublicFooter, PublicHeader, PublicHero, PublicPageFrame } from '@/components/public-layout'
import { getCharacter } from '@/lib/characters'

import sceneCompetitorAnalysis from '@/assets/scene/scene-competitor-analysis.png'
import sceneStoryPlanning from '@/assets/scene/scene-story-planning.png'
import sceneTeamBreak from '@/assets/scene/scene-team-break.png'

export const metadata: Metadata = {
  title: 'サービス紹介 | Insight Cast',
  description: 'Insight Cast がホームページ調査、競合比較、AI取材、記事素材化までをどう進めるかを紹介します。',
}

const serviceSteps = [
  {
    step: '01',
    title: 'HP調査',
    body: 'まず今のホームページを読み、何が伝わっていて何が埋もれているかを整理します。',
  },
  {
    step: '02',
    title: '競合比較',
    body: '同業他社と並べながら、違いとして残せるポイントを洗い出します。',
  },
  {
    step: '03',
    title: 'AI取材',
    body: '役割の違うキャストが、答えやすい質問で価値の輪郭を引き出します。',
  },
  {
    step: '04',
    title: '記事素材化',
    body: '見出し、比較軸、発信テーマまで整えて、更新の手前までつなげます。',
  },
] as const

const deliverables = [
  'ホームページでまだ伝わっていない価値の整理',
  '競合と比べて残る違いの候補',
  'インタビューから見えた訴求ポイント',
  '記事やLPに使える見出しと話材の下書き',
] as const

const castFlow = [
  {
    name: 'クラウス',
    title: '調査と比較の視点',
    body: 'ホームページと競合を先に読み、どこを深掘りすべきか論点を整理します。',
  },
  {
    name: 'ミント',
    title: '会話から魅力を拾う視点',
    body: '安心感や人柄の価値を、構えず答えられる質問で引き出します。',
  },
  {
    name: 'レイン',
    title: '訴求へ変える視点',
    body: 'お客様が選ぶ理由として、ホームページに載せる言葉へ整えていきます。',
  },
] as const

const reports = [
  {
    title: '現在伝わっていること',
    items: ['施工実績や対応エリアは見える', 'サービス内容の大枠は分かる', '問い合わせ導線は整っている'],
  },
  {
    title: 'まだ埋もれていること',
    items: ['説明の丁寧さが安心感につながっていること', '他社が断る案件への対応力', '判断基準や材料選びのこだわり'],
  },
  {
    title: '取材で聞くべきこと',
    items: ['図で説明する理由は何か', '相談時に特に気をつけていることは何か', '他社との違いが出る判断場面はどこか'],
  },
] as const

const articleFormats = [
  {
    title: '通常記事',
    tag: 'SEO・比較・解説向き',
    body: '比較やFAQも交えながら、検索で読まれやすい構成に整えます。',
  },
  {
    title: 'インタビュー風記事',
    tag: '一次情報・人柄訴求向き',
    body: '話した内容の温度を残しながら、本人らしい言葉が見える記事に仕立てます。',
  },
] as const

export default function ServicePage() {
  const claus = getCharacter('claus')
  const rain = getCharacter('rain')

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <PublicHero
          eyebrow="Service"
          title={<>調べて、聞いて、整えて、<br />更新できる状態まで運ぶ。</>}
          description={(
            <>
              Insight Cast は、ホームページ調査、競合比較、AI取材、記事素材化を
              ひとつの流れとしてまとめたサービスです。何を聞けばいいか分からないところから、
              何を書けばいいか見えるところまで伴走します。
            </>
          )}
          actions={(
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <StatusPill tone="neutral">URL登録から開始</StatusPill>
                <StatusPill tone="neutral">競合比較も対応</StatusPill>
                <StatusPill tone="success">記事の素まで残る</StatusPill>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/auth/signup">無料で試してみる</ButtonLink>
                <ButtonLink href="/cast" tone="secondary">
                  キャストを見る
                </ButtonLink>
              </div>
            </div>
          )}
          aside={(
            <SurfaceCard tone="soft" className="border-0 bg-transparent p-0">
              <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">このページで分かること</p>
              <div className="mt-4 space-y-3">
                {serviceSteps.map((item) => (
                  <div key={item.step} className="rounded-2xl border border-stone-300 bg-white px-4 py-4">
                    <p className="text-xs font-medium tracking-[0.16em] text-stone-400 uppercase">{item.step}</p>
                    <p className="mt-2 text-sm font-semibold text-stone-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-stone-700">{item.body}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}
        />

        <section className="px-6 pb-10 sm:pb-14">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-stone-300 bg-[linear-gradient(135deg,rgba(255,252,246,0.97),rgba(255,248,240,0.94))] p-6 sm:p-8">
              <Image
                src={sceneCompetitorAnalysis}
                alt="Insight Cast のキャストが競合分析をしている様子"
                className="absolute inset-y-0 right-0 h-full w-[46%] object-cover opacity-12"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_top,rgba(251,191,36,0.14),transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.9)_38%,rgba(255,255,255,0.84)_72%,rgba(255,255,255,0.92)_100%)]" />
              <div className="relative grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.9rem] border border-white bg-white/94 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-stone-950">いきなり質問しないから、取材がぶれにくい</p>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    ホームページと競合を先に見てから会話に入るので、聞く内容が感覚頼みになりません。
                  </p>
                </div>
                <div className="rounded-[1.9rem] border border-white bg-white/94 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-stone-950">比較があるから、違いを言葉にしやすい</p>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    強みを考えるのではなく、他社と比べて何が違うかを見ながら整理できる構成です。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="What We Deliver"
              title={<>ホームページ改善に必要な材料を、<br />一連の流れで残します。</>}
              description="単発の会話ではなく、調査から記事の芯までがつながるのがこのサービスの役割です。"
              className="max-w-2xl"
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {deliverables.map((item) => (
                <SurfaceCard key={item} className="rounded-[1.9rem] p-5">
                  <p className="text-sm leading-7 text-stone-600">{item}</p>
                </SurfaceCard>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
              <div>
                <SectionIntro
                  eyebrow="Step 01"
                  title={<>まず、今のホームページを<br />丁寧に読み込みます。</>}
                  description="クラウスがホームページ全体を見て、すでに伝わっていること、まだ言葉になっていないこと、取材で聞くべきことを整理します。"
                />
              </div>

              <SurfaceCard className="rounded-[2rem] p-6">
                {claus && (
                  <div className="flex items-center gap-4">
                    <CharacterAvatar src={claus.icon96} alt={`${claus.name}のアイコン`} emoji={claus.emoji} size={56} className="border-stone-100" />
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-stone-400 uppercase">{claus.label || 'Industry Insight'}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-stone-900">{claus.name}</h3>
                      <p className="text-sm text-stone-500">{claus.species}</p>
                    </div>
                  </div>
                )}
                <div className="mt-5 space-y-3">
                  {reports.map((block) => (
                    <div key={block.title} className="rounded-[1.4rem] border border-stone-200 bg-stone-50/90 px-5 py-4">
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase">{block.title}</p>
                      <ul className="mt-2 space-y-1">
                        {block.items.map((item) => (
                          <li key={item} className="text-sm text-stone-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,249,240,0.9))] p-7 sm:p-8">
              <Image
                src={sceneStoryPlanning}
                alt="Insight Cast のキャストが取材の流れを組み立てている様子"
                className="absolute inset-y-0 right-0 h-full w-[55%] object-cover opacity-14"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,246,0.97)_0%,rgba(255,252,246,0.92)_44%,rgba(255,252,246,0.76)_100%)]" />
              <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <SectionIntro
                  eyebrow="Step 02"
                  title={<>次に、役割の違うキャストが<br />会話で価値を引き出します。</>}
                  description="同じ質問を誰にでも投げるのではなく、何を見つけたいかに応じて視点を変えながら取材を進めます。"
                />

                <div className="space-y-4">
                  {castFlow.map((item) => {
                    const char = getCharacter(item.name === 'クラウス' ? 'claus' : item.name === 'ミント' ? 'mint' : 'rain')

                    return (
                      <div key={item.name} className="rounded-[1.7rem] border border-white/80 bg-white/84 px-5 py-5">
                        <div className="flex items-center gap-3">
                          {char && (
                            <CharacterAvatar
                              src={char.icon48}
                              alt={`${char.name}のアイコン`}
                              emoji={char.emoji}
                              size={36}
                              className="border-stone-100"
                            />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-stone-900">{item.name}</p>
                            <p className="text-xs text-stone-500">{item.title}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-stone-500">{item.body}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <SectionIntro
                  eyebrow="Step 03"
                  title={<>引き出した言葉を、<br />更新できる形に整えます。</>}
                  description="会話が終わったら、通常記事やインタビュー風記事に使える形で話材を整理します。見出し候補や比較軸も一緒に残るので、そのまま次の更新へ進めます。"
                />
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {articleFormats.map((format) => (
                    <div key={format.title} className="rounded-[1.6rem] border border-stone-200 bg-white/90 p-5">
                      <p className="text-sm font-semibold text-stone-900">{format.title}</p>
                      <span className="mt-2 inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[11px] text-stone-500">
                        {format.tag}
                      </span>
                      <p className="mt-3 text-sm leading-6 text-stone-500">{format.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <SurfaceCard tone="warm" className="rounded-[2rem] p-6">
                {rain && (
                  <div className="flex items-center gap-3">
                    <CharacterAvatar src={rain.icon96} alt={`${rain.name}のアイコン`} emoji={rain.emoji} size={44} className="border-amber-100" />
                    <div>
                      <p className="font-semibold text-stone-900">{rain.name}の整理メモ</p>
                      <p className="text-xs text-stone-400">見出し候補のイメージ</p>
                    </div>
                  </div>
                )}
                <div className="mt-5 rounded-[1.4rem] border border-amber-100 bg-white p-5">
                  <p className="text-xs font-semibold tracking-[0.16em] text-stone-400 uppercase">Headline Draft</p>
                  <p className="mt-2 text-lg font-semibold leading-8 text-stone-900">
                    「図を書いて説明する」習慣が、
                    <br />
                    相談しやすさの理由だった
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    '口頭だけでなく図を使うことで、お客様の不安を減らしている',
                    '説明の丁寧さが安心感につながり、初回相談のしやすさを生んでいる',
                    '他社が断る案件を引き受ける判断基準が、専門性として差別化になる',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/84 px-4 py-3">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      <p className="text-sm leading-6 text-stone-700">{item}</p>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2.4rem] border border-stone-200 bg-stone-900 p-8 text-white sm:p-10">
              <Image
                src={sceneTeamBreak}
                alt="Insight Cast のキャストが休憩しながら話している様子"
                className="absolute inset-y-0 right-0 h-full w-[44%] object-cover opacity-12"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(28,25,23,0.96)_0%,rgba(28,25,23,0.92)_55%,rgba(28,25,23,0.78)_100%)]" />
              <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
                <div className="max-w-2xl">
                  <p className="text-xs tracking-[0.22em] text-stone-400 uppercase">Continuous Update</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                    一度で終わらず、
                    <br />
                    ホームページを育て続ける。
                  </h2>
                  <p className="mt-5 text-sm leading-8 text-stone-300">
                    話すテーマを変えながら何度も取材を重ねることで、サービス紹介、事例、FAQ、お知らせまで
                    ホームページ全体の言葉が少しずつ増えていきます。
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    '1回目: 接客の安心感を言葉にする',
                    '2回目: 専門性や判断基準を整理する',
                    '3回目: 季節のおすすめや新サービスを発信する',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-stone-200">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 pt-4">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.6rem] border border-stone-200 bg-[linear-gradient(135deg,_#1f2937_0%,_#292524_58%,_#7c5a31_100%)] px-6 py-10 text-white sm:px-10 sm:py-12">
            <p className="text-xs font-medium tracking-[0.22em] text-amber-200 uppercase">Try The Service</p>
            <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  まず1回、取材の流れを体験してください。
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-200">
                  登録無料・クレジットカード不要。最初の3人の取材班をすぐに試せます。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/auth/signup" className="bg-white text-stone-900 hover:bg-stone-100">
                  無料で始める
                </ButtonLink>
                <ButtonLink href="/pricing" tone="ghost" className="border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white">
                  料金を見る
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
