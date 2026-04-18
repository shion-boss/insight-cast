import Image from 'next/image'
import { redirect } from 'next/navigation'

import { ButtonLink, CharacterAvatar, EyebrowBadge, SectionIntro, StatusPill, SurfaceCard } from '@/components/ui'
import { PublicFooter, PublicHeader, PublicPageFrame } from '@/components/public-layout'
import { CHARACTERS } from '@/lib/characters'
import { createClient } from '@/lib/supabase/server'

import sceneStoryPlanning from '@/assets/scene/scene-story-planning.png'
import sceneGrowthStrategyMeeting from '@/assets/scene/scene-growth-strategy-meeting.png'
import sceneCompetitorAnalysis from '@/assets/scene/scene-competitor-analysis.png'
import sceneTeamBreak from '@/assets/scene/scene-team-break.png'
import sceneTeamPortrait from '@/assets/scene/scene-team-portrait.png'

const freeCast = CHARACTERS.filter((char) => char.available)

const proofPills = [
  '無料で3人のAIキャストを試せる',
  'ホームページと競合を先に読む',
  '記事の素までつながる',
] as const

const pains = [
  'ホームページはあるのに、何が選ばれる理由なのか自分でも言い切れない',
  'ブログやお知らせを増やしたいが、毎回「何を書けばいいか」で止まる',
  '接客や判断の良さはあるのに、サイトではうまく伝わっていない',
] as const

const outcomes = [
  {
    title: '選ばれる理由が、会話から見えてくる',
    body: '強みをひねり出すのではなく、普段の説明や対応の中にある価値を取材で拾います。',
  },
  {
    title: '比較されたときに残る言葉になる',
    body: '競合や他社との違いを踏まえて、ホームページに載せるべき材料を整理します。',
  },
  {
    title: '更新できる状態までそのまま進める',
    body: '会話が終わったら記事や見出しの芯が残るので、次の更新作業にすぐ移れます。',
  },
] as const

const workflow = [
  {
    step: '01',
    title: 'ホームページと競合を読む',
    body: '今すでに伝わっていることと、まだ埋もれている価値を先に整理します。',
  },
  {
    step: '02',
    title: 'AIキャストが取材する',
    body: '役割の違うキャストが、答えやすい質問で価値の輪郭を少しずつ見つけます。',
  },
  {
    step: '03',
    title: '記事と訴求の材料に整える',
    body: 'そのままブログやLPづくりに使える見出し、比較軸、発信テーマへつなげます。',
  },
] as const

const outputExamples = [
  '「図を書きながら説明する」ことが、相談しやすさの理由になっていた',
  '工事後のフォロー連絡が、地域で選ばれる安心感につながっていた',
  '他社が断った案件を引き受ける判断基準が、専門性として言語化できた',
] as const

const faqs = [
  {
    q: 'どんな業種でも使えますか？',
    a: 'はい。まずホームページと競合候補を読み、その内容に合わせて取材の切り口を変えていきます。',
  },
  {
    q: '文章が苦手でも進められますか？',
    a: '進められます。会話に答えることを中心にしているので、最初からうまくまとめる必要はありません。',
  },
  {
    q: '最初に何を用意すればいいですか？',
    a: 'まずは自社ホームページのURLだけで始められます。競合候補はあとから追加しても大丈夫です。',
  },
] as const

export default async function LandingPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) redirect('/dashboard')
  } catch {
    // 公開トップは認証失敗時も表示する
  }

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <section className="px-6 pb-16 pt-10 sm:pb-24 sm:pt-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center">
            <div className="max-w-3xl">
              <EyebrowBadge>Insight Cast</EyebrowBadge>
              <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.01] tracking-[-0.05em] text-stone-950 sm:text-5xl lg:text-[4.8rem]">
                ホームページに
                <br />
                まだ載っていない価値を、
                <br />
                AI取材で見つける。
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-[1.08rem]">
                Insight Cast は、AIキャストがホームページと競合を先に読み、
                取材を通して選ばれる理由を引き出すサービスです。いきなり文章を出すツールではなく、
                まず会話で価値を見つけるところから始めます。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/auth/signup" className="py-4 px-7 text-base">無料で試してみる</ButtonLink>
                <ButtonLink href="/service" tone="secondary" className="py-4 px-7 text-base">
                  サービスの流れを見る
                </ButtonLink>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {proofPills.map((pill) => (
                  <StatusPill
                    key={pill}
                    tone="neutral"
                  >
                    {pill}
                  </StatusPill>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.6rem] bg-amber-300/30 blur-3xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[2.6rem] border border-stone-300/80 bg-[rgba(255,253,249,0.94)] p-4 backdrop-blur-md sm:p-5">
                <div className="relative overflow-hidden rounded-[2rem] border border-stone-900/80 bg-stone-950">
                  <Image
                    src={sceneStoryPlanning}
                    alt="Insight Cast のキャストが企画を進めている様子"
                    priority
                    className="h-[31rem] w-full object-cover sm:h-[36rem]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.38)_52%,rgba(15,23,42,0.92)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 px-6 pb-6 pt-24 sm:px-8 sm:pb-8">
                    <p className="text-xs tracking-[0.2em] text-amber-200 uppercase">取材班 / AI Cast Team</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
                      調べて、聞いて、整えて、
                      <br />
                      更新の手前までつなぐ。
                    </p>
                    <p className="mt-3 max-w-md text-sm leading-7 text-stone-200">
                      かわいいだけのキャラではなく、役割の違う取材班として動くのが Insight Cast です。
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 px-1 pb-1 pt-4 sm:grid-cols-3">
                  {[
                    ['HP調査', '何が埋もれているか先に見る'],
                    ['AI取材', '会話から価値を発見する'],
                    ['記事素材化', '更新の芯まで残す'],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-2xl border border-stone-300 bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-stone-950">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-stone-600">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-14">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <SurfaceCard tone="dark" className="rounded-[2.3rem]">
              <p className="text-xs tracking-[0.2em] text-stone-400 uppercase">Before Insight Cast</p>
              <div className="mt-5 space-y-3">
                {pains.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
                    <span className="mt-0.5 text-amber-300">●</span>
                    <p className="text-sm leading-7 text-stone-200">{item}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <div className="relative overflow-hidden rounded-[2.3rem] border border-stone-300 bg-[linear-gradient(135deg,rgba(255,250,243,0.98),rgba(254,246,237,0.96))] p-6 sm:p-8">
              <Image
                src={sceneCompetitorAnalysis}
                alt="Insight Cast のキャストが競合分析をしている様子"
                className="absolute inset-y-0 right-0 h-full w-[56%] object-cover opacity-12"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_top,rgba(251,191,36,0.14),transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.9)_42%,rgba(255,255,255,0.82)_100%)]" />
              <div className="relative">
                <p className="text-xs font-medium tracking-[0.22em] text-amber-700 uppercase">What Changes</p>
                <div className="mt-5 grid gap-4">
                  {outcomes.map((item) => (
                    <div key={item.title} className="rounded-[1.7rem] border border-white/90 bg-white/94 px-5 py-5 backdrop-blur-sm">
                      <p className="text-lg font-semibold tracking-tight text-stone-950">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-600">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2.6rem] border border-stone-300 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,249,240,0.94))] p-7 sm:p-9">
              <Image
                src={sceneGrowthStrategyMeeting}
                alt="Insight Cast のキャストがサービス設計を話し合っている様子"
                className="absolute inset-y-0 right-0 h-full w-[54%] object-cover opacity-16"
              />
              <Image
                src={sceneTeamBreak}
                alt="Insight Cast のキャストが休憩しながら相談している様子"
                className="absolute -left-8 bottom-0 h-[66%] w-[34%] object-cover opacity-10"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,246,0.97)_0%,rgba(255,252,246,0.92)_42%,rgba(255,252,246,0.76)_100%)]" />

              <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                <SectionIntro
                  eyebrow="How It Works"
                  title={<>書く前に、<br />取材の流れを通す。</>}
                  description="Insight Cast は、いきなり文章を出すツールではありません。ホームページ調査、競合比較、AI取材、記事素材化までを一本の体験として設計しています。"
                />

                <div className="grid gap-4 md:grid-cols-3">
                  {workflow.map((item) => (
                    <SurfaceCard key={item.step} className="rounded-[1.9rem] p-5" interactive>
                      <p className="text-xs font-semibold tracking-[0.2em] text-stone-400 uppercase">{item.step}</p>
                      <p className="mt-4 text-lg font-semibold text-stone-900">{item.title}</p>
                      <p className="mt-3 text-sm leading-7 text-stone-500">{item.body}</p>
                    </SurfaceCard>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="The Cast"
              title={<>役割の違う3人が、<br />最初の取材班です。</>}
              description="登録すると、まずはミント・クラウス・レインの3人を無料で使えます。同じ事業でも、誰が聞くかで引き出せる価値が変わります。"
              className="max-w-2xl"
            />

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {freeCast.map((char) => (
                <SurfaceCard key={char.id} className="rounded-[2rem] p-6" interactive>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium tracking-[0.16em] text-stone-400 uppercase">
                        {char.label || 'Story Listener'}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-stone-900">{char.name}</h3>
                      <p className="text-sm text-stone-500">{char.species}</p>
                    </div>
                    <CharacterAvatar
                      src={char.icon96}
                      alt={`${char.name}のアイコン`}
                      emoji={char.emoji}
                      size={52}
                      className="border-stone-100"
                    />
                  </div>
                  <p className="mt-5 text-sm leading-7 text-stone-600">{char.description}</p>
                  <div className="mt-5 rounded-[1.4rem] border border-stone-200 bg-stone-50/90 px-4 py-4">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase">得意なこと</p>
                    <p className="mt-2 text-sm text-stone-700">{char.specialty}</p>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="relative overflow-hidden rounded-[2.4rem] border border-stone-200 bg-white/86 p-4 backdrop-blur-md">
              <div className="relative overflow-hidden rounded-[1.9rem] bg-[#f0e4ce]">
                <Image
                  src={sceneTeamPortrait}
                  alt="Insight Cast のキャストチーム"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div>
              <SectionIntro
                eyebrow="Output Image"
                title={<>会話が終わると、<br />更新の芯が残ります。</>}
                description="インタビューのゴールは会話そのものではなく、ホームページや記事に使える材料が残ることです。"
              />

              <div className="mt-7 space-y-3">
                {outputExamples.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[1.7rem] border border-stone-200 bg-white/92 px-5 py-4">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    <p className="text-sm leading-7 text-stone-600">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/service">詳しい流れを見る</ButtonLink>
                <ButtonLink href="/cast" tone="secondary">
                  キャスト紹介へ
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          {(() => {
            const mint = CHARACTERS.find((c) => c.id === 'mint')
            return (
              <div className="mx-auto max-w-6xl rounded-[2.3rem] border border-stone-200 bg-stone-900 p-8 text-white sm:p-10">
                <div className="flex items-center gap-3">
                  {mint && (
                    <CharacterAvatar src={mint.icon48} alt={`${mint.name}のアイコン`} emoji={mint.emoji} size={36} />
                  )}
                  <p className="text-xs tracking-[0.22em] text-stone-400 uppercase">FAQ — よくある質問</p>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {faqs.map((item) => (
                    <div key={item.q} className="rounded-[1.7rem] border border-white/10 bg-white/6 p-5">
                      <p className="text-base font-semibold text-white">{item.q}</p>
                      <p className="mt-3 text-sm leading-7 text-stone-300">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </section>

        <section className="px-6 pb-20 pt-4">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.6rem] border border-stone-200 bg-[linear-gradient(135deg,_#1f2937_0%,_#292524_58%,_#7c5a31_100%)] px-6 py-10 text-white sm:px-10 sm:py-12">
            <p className="text-xs font-medium tracking-[0.22em] text-amber-200 uppercase">Start Your First Interview</p>
            <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  まず1回、AI取材を体験してください。
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-200">
                  登録無料・クレジットカード不要。最初の3人の取材班をすぐに試せます。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/auth/signup" className="bg-white text-stone-900 hover:bg-stone-100">
                  無料で始める
                </ButtonLink>
                <ButtonLink href="/pricing" tone="ghost" className="border-white/60 bg-transparent text-white hover:border-white/40 hover:bg-white/10">
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
