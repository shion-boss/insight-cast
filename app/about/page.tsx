import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { CharacterAvatar } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'
import { PublicHeader, PublicFooter, PublicHero, PublicPageFrame } from '@/components/public-layout'
import aboutTeamHero from '@/assets/about/about-team-hero.png'
import sceneTeamBreak from '@/assets/scene/scene-team-break.png'
import sceneGrowthStrategyMeeting from '@/assets/scene/scene-growth-strategy-meeting.png'

const teamMembers = [
  {
    id: 'mint',
    role: 'Story Listener',
    summary: 'やわらかい会話で、事業者さん自身も気づいていない安心感や人柄の魅力を引き出します。',
  },
  {
    id: 'claus',
    role: 'Industry Editor',
    summary: '専門性や判断基準を整理して、現場のこだわりが伝わる言葉に翻訳します。',
  },
  {
    id: 'rain',
    role: 'Message Strategist',
    summary: 'お客様視点で魅力の見せ方を整え、比較されたときにも残る訴求へ仕立てます。',
  },
  {
    id: 'hal',
    role: 'Atmosphere Finder',
    summary: '人柄や空気感、写真に宿るストーリーから、その場所らしい温度をすくい上げます。',
  },
  {
    id: 'mogro',
    role: 'Yes / No Deep Dive',
    summary: 'はい / いいえで答えられる質問だけを重ねて、埋もれていた価値の輪郭を言語化します。',
  },
  {
    id: 'cocco',
    role: 'Campaign Voice',
    summary: 'お知らせ、季節の話題、今伝えたい内容を、更新しやすい発信素材に整えます。',
  },
] as const

const principles = [
  {
    title: 'Listen Before Writing',
    description: '文章を先につくらず、まずは会話で現場の言葉を集めることを大切にしています。',
  },
  {
    title: 'Find What Feels Ordinary',
    description: '本人にとって当たり前でも、お客様には価値になるふるまいを中心に拾います。',
  },
  {
    title: 'Turn Insight Into Action',
    description: '気づきで終わらせず、ホームページや記事更新に使える形までつなげます。',
  },
] as const

const workflow = [
  {
    step: '01',
    title: 'Read the current site',
    description: '今のホームページと競合候補を見て、すでに伝わっていることと、まだ眠っている価値を整理します。',
  },
  {
    step: '02',
    title: 'Interview as a cast',
    description: '複数の視点を持つAI取材班が、答えやすい質問を重ねながら価値の輪郭をはっきりさせます。',
  },
  {
    step: '03',
    title: 'Shape it for the page',
    description: '見出し、記事テーマ、差別化ポイントまで落とし込み、更新の次の一手をつくります。',
  },
] as const

const trustPoints = [
  'ホームページ改善のための取材体験を、やさしい会話導線で設計',
  'キャラクターごとに役割を分け、ひとつの視点に偏らない構成',
  '分析結果を記事候補や訴求素材へつなげる実務寄りのアウトプット',
] as const

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Insight Cast の考え方、AI取材班の役割、ホームページ改善につながるチームの進め方を紹介します。',
}

export default function AboutPage() {
  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <PublicHero
          eyebrow="About Us"
          title={<>価値を見つける取材班を、<br />ちゃんとチームとして<br />つくりました。</>}
          description={(
            <>
              Insight Cast は、ホームページ改善のために生まれた AI 取材チームです。
              ただ文章を整えるのではなく、会話から魅力を見つけて、伝わる形へ変えていくことを大切にしています。
            </>
          )}
          actions={(
            <div className="space-y-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                >
                  Insight Cast を試してみる
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white/90 px-6 py-4 text-sm font-medium text-stone-700 transition-colors hover:bg-white hover:text-stone-900"
                >
                  サービス紹介へ戻る
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {trustPoints.map((point) => (
                  <div key={point} className="rounded-[1.6rem] border border-stone-200/90 bg-white/76 px-4 py-4 backdrop-blur-sm">
                    <p className="text-sm leading-6 text-stone-600">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          aside={(
            <div className="relative overflow-hidden rounded-[1.7rem] bg-[#efe4cf]">
              <Image
                src={aboutTeamHero}
                alt="Insight Cast の取材チーム"
                priority
                className="h-auto w-full object-cover"
              />
              <div className="grid gap-3 border-t border-stone-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(255,248,235,0.92))] p-4 sm:grid-cols-3">
                {[
                  ['6 members', '役割の違う取材班'],
                  ['Interview first', '会話から価値を発掘'],
                  ['Ready to publish', '記事素材まで接続'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-white/80 bg-white/85 px-4 py-4">
                    <p className="text-sm font-semibold text-stone-900">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          containerClassName="lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center"
          asideClassName="overflow-hidden p-4"
        />

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="rounded-[2rem] border border-stone-200 bg-stone-900 p-7 text-white">
              <p className="text-xs tracking-[0.2em] text-stone-400 uppercase">Our Mission</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                うまく書けない価値ほど、
                <br />
                きちんと聞きにいく。
              </h2>
              <p className="mt-5 text-sm leading-7 text-stone-300 sm:text-base">
                事業者さんの魅力は、派手な実績だけでは決まりません。
                相談の受け止め方、説明のしかた、迷ったときの判断基準みたいな日常のふるまいに、
                選ばれる理由が宿っていることが多いと私たちは考えています。
              </p>
              <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
                だから Insight Cast は、書く前に聞くことから始めます。
                伝え方に困っている人でも、答えながら自然に価値が見えてくるように、会話の流れそのものを設計しています。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {principles.map((principle) => (
                <article
                  key={principle.title}
                  className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(248,245,238,0.85))] p-6"
                >
                  <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">{principle.title}</p>
                  <p className="mt-4 text-lg font-semibold text-stone-900">{principle.title === 'Listen Before Writing' ? 'まず聞く' : principle.title === 'Find What Feels Ordinary' ? '当たり前を見つける' : '使える形に変える'}</p>
                  <p className="mt-3 text-sm leading-7 text-stone-500">{principle.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,249,240,0.9))] p-7 sm:p-8">
              <Image
                src={sceneGrowthStrategyMeeting}
                alt="Insight Cast のキャストが戦略を話し合っている様子"
                className="absolute inset-y-0 right-0 h-full w-[60%] object-cover opacity-18"
              />
              <Image
                src={sceneTeamBreak}
                alt="Insight Cast のキャストが休憩している様子"
                className="absolute -left-10 bottom-0 h-[72%] w-[36%] object-cover opacity-10"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,246,0.96)_0%,rgba(255,252,246,0.9)_46%,rgba(255,252,246,0.72)_100%)]" />
              <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
                <div className="max-w-2xl">
                  <p className="text-xs font-medium tracking-[0.2em] text-amber-700 uppercase">Behind The Scenes</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                    キャストが本当に
                    <br />
                    働いていそうなチームであること。
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
                    Insight Cast は、ただのマスコットを並べたサービスではありません。
                    役割の違うキャストが、それぞれの視点で聞き、整理し、次の発信へつなげるチームとして設計しています。
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    '立ち絵だけでなく、働いている場面を見せる',
                    '世界観を操作の邪魔ではなく理解補助に使う',
                    'やさしいが幼すぎない、存在感のある会社として見せる',
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-white/76 px-4 py-4 ring-1 ring-white/80 backdrop-blur-sm">
                      <span className="mt-0.5 text-amber-500">✦</span>
                      <p className="text-sm leading-7 text-stone-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">The Cast</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                ひとりの万能役ではなく、
                <br />
                役割の違う6人で聞きます。
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-500 sm:text-base">
                同じ話でも、誰が聞くかで見つかる価値は変わります。
                Insight Cast では、安心感、専門性、訴求、空気感、深掘り、告知という役割を分けてチームを組んでいます。
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member) => {
                const character = CHARACTERS.find((item) => item.id === member.id)

                if (!character) return null

                return (
                  <article
                    key={member.id}
                    className="rounded-[2rem] border border-stone-200 bg-white/88 p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4">
                      <CharacterAvatar
                        src={character.icon96}
                        alt={`${character.name}のアイコン`}
                        emoji={character.emoji}
                        size={64}
                        className="border-stone-100"
                      />
                      <div>
                        <p className="text-lg font-semibold text-stone-900">{character.name}</p>
                        <p className="text-xs font-medium tracking-[0.16em] text-amber-700 uppercase">{member.role}</p>
                      </div>
                    </div>
                    <p className="mt-5 text-sm leading-7 text-stone-500">{member.summary}</p>
                    <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-4">
                      <p className="text-xs font-medium tracking-[0.16em] text-stone-400 uppercase">Specialty</p>
                      <p className="mt-2 text-sm text-stone-700">{character.specialty}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
            <div className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,251,235,0.98),_rgba(255,255,255,0.94))] p-7">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">How We Work</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
                見つけるだけでなく、
                <br />
                公開できる形まで。
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-500">
                分析、取材、整理、記事化の流れを分断せず、次の作業へそのまま渡せる構造にしています。
              </p>
            </div>

            <div className="space-y-4">
              {workflow.map((item) => (
                <article
                  key={item.step}
                  className="flex gap-4 rounded-[2rem] border border-stone-200 bg-white/90 p-5"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold tracking-[0.18em] text-white">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-stone-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-500">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ミッション */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[2rem] border border-stone-200 bg-white/90 p-8 sm:p-10">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">Mission</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                伝わっていない価値を、
                <br />
                言葉にして届ける。
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  {
                    label: '01',
                    title: '一次情報を大切にする',
                    body: '事業者さん本人の言葉にしか宿らない価値があります。会話から引き出した生の言葉を、整理された「情報」ではなく、伝わる「言葉」として扱うことを大切にしています。',
                  },
                  {
                    label: '02',
                    title: '書く前に、聞く',
                    body: 'コンテンツを先につくるのではなく、まず取材をすることから始めます。何を書くかよりも、何を引き出すかの設計が、ホームページの伝わり方を変えると考えています。',
                  },
                  {
                    label: '03',
                    title: '継続的に育てる',
                    body: '一度きりの改善では、ホームページは止まります。インタビューと発信を繰り返すことで、事業者さんの言葉がHPの上に少しずつ積み重なっていく仕組みを目指しています。',
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.6rem] border border-stone-100 bg-stone-50/80 p-6">
                    <p className="text-xs font-semibold tracking-[0.2em] text-stone-400 uppercase">{item.label}</p>
                    <p className="mt-3 text-base font-semibold text-stone-900">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-stone-500">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 運営の考え方 */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">How We Think</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                運営の考え方
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: '自社で使って証明する',
                  body: 'Insight Cast 自身のホームページとブログを、このツールで運用しています。「使えるか」を外から言うのではなく、自分たちで試して実証することを最初の仕事にしています。',
                },
                {
                  title: '業種は絞らず、汎用で戦う',
                  body: '特定の業種に向けてカスタマイズするのではなく、どんな事業者さんにも機能する取材の型を磨くことに集中しています。業種特化は、実際の顧客が求めた時点で対応します。',
                },
                {
                  title: 'AIを前面に出さない',
                  body: '「AI社員にお願いしている」という感覚を大切にしています。専門用語や処理感を出さず、取材班が来てくれる体験として設計することで、構えずに価値を引き出せる場をつくります。',
                },
                {
                  title: '最終判断は人間がする',
                  body: '取材班はたたき台を出す存在です。引き出した内容の評価、HPへの掲載判断、発信の方向性は、事業者さん自身が決めます。Insight Castはその判断を支える情報を整えます。',
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-[2rem] border border-stone-200 bg-white/90 p-7"
                >
                  <p className="text-base font-semibold text-stone-900">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-stone-500">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 会社概要 */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">Company</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">会社概要</h2>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white/90">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: 'サービス名', value: 'Insight Cast' },
                    { label: '運営', value: '（準備中）' },
                    { label: '所在地', value: '（準備中）' },
                    { label: '連絡先', value: 'info@insight-cast.jp' },
                    { label: 'サービス開始', value: '2026年（予定）' },
                    { label: '対象', value: 'ホームページの更新が止まっている、または更新が負担になっている中小企業・小規模事業者' },
                    { label: '技術基盤', value: 'Next.js / Supabase / Anthropic Claude' },
                  ].map((row, i, arr) => (
                    <tr key={row.label} className={i < arr.length - 1 ? 'border-b border-stone-100' : ''}>
                      <td className="w-36 bg-stone-50 px-6 py-5 font-medium text-stone-700 sm:w-48">{row.label}</td>
                      <td className="px-6 py-5 leading-7 text-stone-600">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-stone-400">※ 準備中の情報は正式リリース時に更新します。</p>
          </div>
        </section>

        <section className="px-6 pb-18 pt-10 sm:pb-24">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] border border-stone-200 bg-[linear-gradient(135deg,_#1f2937_0%,_#292524_55%,_#6b4f2c_100%)] px-6 py-10 text-white sm:px-10 sm:py-12">
            <p className="text-xs font-medium tracking-[0.22em] text-amber-200 uppercase">Join Us</p>
            <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  あなたのホームページに、
                  <br />
                  まだ書けていない魅力があるなら。
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-200 sm:text-base">
                  Insight Cast の取材班が、話しやすい問いかけから一緒に掘り起こします。
                  見つかった価値は、そのまま次の更新の材料になります。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
                >
                  無料で始める
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/85 bg-white px-6 py-4 text-sm font-medium text-stone-950 transition-colors hover:border-white/45 hover:bg-white/12 hover:text-white"
                >
                  ログイン
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
