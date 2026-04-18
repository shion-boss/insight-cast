import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { ButtonLink, CharacterAvatar, SectionIntro, StatusPill, SurfaceCard, getButtonClass } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'
import { PublicHeader, PublicFooter, PublicHero, PublicPageFrame } from '@/components/public-layout'

import mintPortrait from '@/assets/characters/mint/portraits/portrait-half.png'
import clausPortrait from '@/assets/characters/claus/portraits/portrait-half.png'
import rainPortrait from '@/assets/characters/rain/portraits/portrait-half.png'
import halPortrait from '@/assets/characters/hal/portraits/portrait-half.png'
import mogroPortrait from '@/assets/characters/mogro/portraits/portrait-half.png'
import coccoPortrait from '@/assets/characters/cocco/portraits/portrait-half.png'

const portraitMap = {
  mint: mintPortrait,
  claus: clausPortrait,
  rain: rainPortrait,
  hal: halPortrait,
  mogro: mogroPortrait,
  cocco: coccoPortrait,
} as const

const castDetails = {
  mint: {
    role: 'Story Listener',
    tagline: 'お客様目線で、やさしく引き出します',
    what: ['初めて会った気がしない会話の進め方', 'お客様が感じる安心感・人柄', 'ふだんの気づかいや心がけ'],
    inputType: 'テキスト',
    inputNote: 'チャット形式で答えるだけ。写真や資料は不要です。',
    free: true,
    color: 'from-amber-50 to-orange-50',
    badge: 'bg-amber-100 text-amber-800',
    accent: 'border-amber-200',
  },
  claus: {
    role: 'Industry Editor',
    tagline: '専門知識を背景に、技術の違いを言葉にします',
    what: ['仕事のこだわりや判断基準', '他社との技術・材料の違い', 'プロだから分かる選び方の理由'],
    inputType: 'テキスト',
    inputNote: 'チャット形式で答えるだけ。専門用語は使わなくて大丈夫です。',
    free: true,
    color: 'from-stone-50 to-slate-50',
    badge: 'bg-stone-100 text-stone-700',
    accent: 'border-stone-200',
  },
  rain: {
    role: 'Message Strategist',
    tagline: 'お客様が選ぶ理由を、一緒に言葉にします',
    what: ['なぜ選ばれているのかの言語化', '競合との比較で見えてくる違い', 'HPやSNSで刺さる伝え方の軸'],
    inputType: 'テキスト',
    inputNote: 'チャット形式で答えるだけ。難しいマーケティング用語は出てきません。',
    free: true,
    color: 'from-sky-50 to-blue-50',
    badge: 'bg-sky-100 text-sky-800',
    accent: 'border-sky-200',
  },
  hal: {
    role: 'Atmosphere Finder',
    tagline: '写真を起点に、その場所らしさを引き出します',
    what: ['スタッフやお客様との関係のエピソード', '仕事場の空気や雰囲気', '数字では伝わらない人柄のストーリー'],
    inputType: '画像 + テキスト',
    inputNote: 'お店や仕事場の写真を1枚送るところから始まります。写真から会話を広げていきます。',
    free: false,
    color: 'from-yellow-50 to-amber-50',
    badge: 'bg-yellow-100 text-yellow-800',
    accent: 'border-yellow-200',
  },
  mogro: {
    role: 'Yes / No Deep Dive',
    tagline: 'はい / いいえだけで、価値の輪郭を深掘りします',
    what: ['当たり前すぎて見落としていた判断やこだわり', '他の人もやると思っていたけれど実は違うこと', '二択の積み重ねから見えてくる選ばれる理由'],
    inputType: 'はい / いいえ',
    inputNote: '質問ごとにボタンを押して答える形式です。自由入力なしで、もぐろが見えてきた価値を言語化します。',
    free: false,
    color: 'from-lime-50 to-green-50',
    badge: 'bg-lime-100 text-lime-800',
    accent: 'border-lime-200',
  },
  cocco: {
    role: 'Campaign Voice',
    tagline: '「今伝えたいこと」を、発信できる言葉にします',
    what: ['新しく始めたことやお知らせ', '季節のおすすめや期間限定の話題', 'SNSやHPにそのまま使えるお知らせ素材'],
    inputType: 'テキスト',
    inputNote: 'チャット形式で答えるだけ。「宣伝が恥ずかしい」という感覚があっても大丈夫です。',
    free: false,
    color: 'from-rose-50 to-pink-50',
    badge: 'bg-rose-100 text-rose-800',
    accent: 'border-rose-200',
  },
} as const

export const metadata: Metadata = {
  title: 'AIキャスト紹介 | Insight Cast',
  description: '6人のAI取材班それぞれの得意分野・入力方式・無料/有料の違いを紹介します。',
}

export default function CastPage() {
  const freeChars = CHARACTERS.filter((c) => c.available)
  const paidChars = CHARACTERS.filter((c) => !c.available)

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <PublicHero
          eyebrow="The Cast"
          title={<>6人の取材班から、<br />今ほしい視点を選べます。</>}
          description={(
            <>
              Insight Cast のキャストは、それぞれ得意な角度が違う取材班です。
              同じ事業者さんでも、誰が聞くかで引き出せる価値が変わるから、悩みに合わせて選べる設計にしています。
            </>
          )}
          actions={(
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <StatusPill tone="success">無料で使える取材班 3人</StatusPill>
                <StatusPill tone="warning">買い切りで追加できる取材班 3人</StatusPill>
                <StatusPill tone="neutral">テキスト入力 4人 / はい・いいえ 1人 / 画像+テキスト 1人</StatusPill>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/auth/signup">無料で3人と話してみる</ButtonLink>
                <ButtonLink href="/pricing" tone="secondary">料金を見る</ButtonLink>
              </div>
            </div>
          )}
          aside={(
            <SurfaceCard tone="soft" className="border-0 bg-transparent p-0">
              <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">おすすめの始め方</p>
              <div className="mt-4 space-y-3">
                {[
                  ['はじめて使うなら', 'ミント', 'やわらかく話を広げやすいので最初の1回に向いています。'],
                  ['違いを強くしたいなら', 'クラウス', '専門性や判断基準を整理して比較で残る言葉にします。'],
                  ['見せ方を整えたいなら', 'レイン', '選ばれる理由をお客様目線の訴求に変えていきます。'],
                ].map(([label, name, body]) => (
                  <div key={label} className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-4">
                    <p className="text-xs font-medium tracking-[0.16em] text-stone-400 uppercase">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-stone-900">{name}</p>
                    <p className="mt-1 text-sm leading-6 text-stone-500">{body}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}
        />

        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="How To Choose"
              title={<>まずは悩みから選ぶのが、<br />いちばん迷いません。</>}
              description="キャストごとの性格よりも、いま何を前に進めたいかで選ぶほうが自然です。"
              className="max-w-2xl"
            />

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                ['安心感や人柄を言葉にしたい', 'ミント / ハル', '接客の温度や通いやすさ、場の雰囲気を伝えたいときに向いています。'],
                ['違いの輪郭をはっきりさせたい', 'クラウス / モグロ', '判断基準を見つけたあと、はい・いいえの深掘りで選ばれる理由を固めたいときに向いています。'],
                ['訴求や発信ネタを増やしたい', 'レイン / コッコ', '告知や記事化の切り口まで含めて整えたいときに使いやすいです。'],
              ].map(([title, members, body]) => (
                <SurfaceCard key={title} className="p-5">
                  <p className="text-sm font-semibold text-stone-900">{title}</p>
                  <p className="mt-3 text-xs font-medium tracking-[0.16em] text-amber-700 uppercase">{members}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-500">{body}</p>
                </SurfaceCard>
              ))}
            </div>
          </div>
        </section>

        {/* Input type explainer */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 lg:grid-cols-3">
              <SurfaceCard className="rounded-[1.8rem] p-6">
                <p className="text-xs font-medium tracking-[0.2em] text-stone-400 uppercase">テキスト入力</p>
                <p className="mt-3 text-xl font-semibold text-stone-900">チャットで話すだけ</p>
                <p className="mt-3 text-sm leading-7 text-stone-500">
                  キャラが質問を投げかけ、答えていくだけで素材が集まります。
                  準備するものは何もありません。スマホでもPCでも、思ったことを入力するだけです。
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {freeChars.concat(paidChars.filter((c) => c.id !== 'hal' && c.id !== 'mogro')).map((c) => (
                    <span key={c.id} className="flex items-center gap-1.5 rounded-full bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
                      <CharacterAvatar src={c.icon48} alt="" emoji={c.emoji} size={18} />
                      {c.name}
                    </span>
                  ))}
                </div>
              </SurfaceCard>

              <SurfaceCard tone="soft" className="rounded-[1.8rem] p-6">
                <p className="text-xs font-medium tracking-[0.2em] text-lime-700 uppercase">はい / いいえ入力</p>
                <p className="mt-3 text-xl font-semibold text-stone-900">クリックだけで深掘りする</p>
                <p className="mt-3 text-sm leading-7 text-stone-500">
                  もぐろは自由入力を求めません。はい・いいえで答えられる質問を順番に重ねて、
                  その結果から見えてきた価値や違いを言葉にしていきます。
                </p>
                <div className="mt-5">
                  {paidChars.filter((c) => c.id === 'mogro').map((c) => (
                    <span key={c.id} className="flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-lime-200">
                      <CharacterAvatar src={c.icon48} alt="" emoji={c.emoji} size={18} />
                      {c.name}（{c.species}）
                    </span>
                  ))}
                </div>
              </SurfaceCard>

              <SurfaceCard tone="warm" className="rounded-[1.8rem] p-6">
                <p className="text-xs font-medium tracking-[0.2em] text-yellow-700 uppercase">画像 + テキスト入力</p>
                <p className="mt-3 text-xl font-semibold text-stone-900">写真から会話を始める</p>
                <p className="mt-3 text-sm leading-7 text-stone-500">
                  お店や仕事場の写真を1枚送るところから始まります。
                  写真に映っている場面や人物から会話が広がり、雰囲気・人柄・エピソードを引き出していきます。
                </p>
                <div className="mt-5">
                  {paidChars.filter((c) => c.id === 'hal').map((c) => (
                    <span key={c.id} className="flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-yellow-200">
                      <CharacterAvatar src={c.icon48} alt="" emoji={c.emoji} size={18} />
                      {c.name}（{c.species}）
                    </span>
                  ))}
                </div>
              </SurfaceCard>
            </div>
          </div>
        </section>

        {/* Free cast */}
        <section className="px-6 pb-14">
          <div className="mx-auto max-w-6xl">
            <SectionIntro eyebrow="Free Cast" title="登録すればすぐ使えます" className="mb-8" />

            <div className="grid gap-6 lg:grid-cols-3">
              {freeChars.map((char) => {
                const detail = castDetails[char.id as keyof typeof castDetails]
                const portrait = portraitMap[char.id as keyof typeof portraitMap]
                return (
                  <article
                    key={char.id}
                    className={`relative overflow-hidden rounded-[2rem] border bg-gradient-to-br ${detail.color} ${detail.accent}`}
                  >
                    {/* Portrait */}
                    <div className="relative h-56 overflow-hidden bg-white/40">
                      <Image
                        src={portrait}
                        alt={`${char.name}のイラスト`}
                        fill
                        className="object-contain object-bottom"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${detail.badge}`}>
                            {char.label || detail.role}
                          </p>
                          <h3 className="mt-2 text-2xl font-bold text-stone-900">{char.name}</h3>
                          <p className="text-sm text-stone-500">{char.species}</p>
                        </div>
                        <CharacterAvatar src={char.icon96} alt="" emoji={char.emoji} size={52} className="flex-shrink-0 border-white/60" />
                      </div>

                      <p className="mt-4 text-sm font-medium leading-6 text-stone-700">{detail.tagline}</p>

                      <div className="mt-4 space-y-2">
                        {detail.what.map((item) => (
                          <div key={item} className="flex items-start gap-2 text-sm text-stone-600">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-400" />
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-[1.2rem] border border-white/70 bg-white/60 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase">入力方式</p>
                        <p className="mt-1 text-sm font-medium text-stone-800">{detail.inputType}</p>
                        <p className="mt-1 text-xs leading-5 text-stone-500">{detail.inputNote}</p>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-medium text-emerald-700">無料で使えます</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Paid cast */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Additional Cast"
              title="必要な視点を、あとから加えられます"
              description="3人の無料取材班でカバーできない角度を、買い切りで追加できます。一度追加すれば、以降はずっと使えます。"
              className="mb-8"
            />

            <div className="grid gap-6 lg:grid-cols-3">
              {paidChars.map((char) => {
                const detail = castDetails[char.id as keyof typeof castDetails]
                const portrait = portraitMap[char.id as keyof typeof portraitMap]
                return (
                  <article
                    key={char.id}
                    className={`relative overflow-hidden rounded-[2rem] border bg-gradient-to-br ${detail.color} ${detail.accent}`}
                  >
                    {/* Coming soon overlay */}
                    <div className="absolute right-4 top-4 z-10 rounded-full border border-stone-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold text-stone-500 backdrop-blur-sm">
                      Coming soon
                    </div>

                    {/* Portrait */}
                    <div className="relative h-56 overflow-hidden bg-white/40">
                      <Image
                        src={portrait}
                        alt={`${char.name}のイラスト`}
                        fill
                        className="object-contain object-bottom"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${detail.badge}`}>
                            {char.label || detail.role}
                          </p>
                          <h3 className="mt-2 text-2xl font-bold text-stone-900">{char.name}</h3>
                          <p className="text-sm text-stone-500">{char.species}</p>
                        </div>
                        <CharacterAvatar src={char.icon96} alt="" emoji={char.emoji} size={52} className="flex-shrink-0 border-white/60" />
                      </div>

                      <p className="mt-4 text-sm font-medium leading-6 text-stone-700">{detail.tagline}</p>

                      <div className="mt-4 space-y-2">
                        {detail.what.map((item) => (
                          <div key={item} className="flex items-start gap-2 text-sm text-stone-600">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-400" />
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-[1.2rem] border border-white/70 bg-white/60 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase">入力方式</p>
                        <p className="mt-1 text-sm font-medium text-stone-800">{detail.inputType}</p>
                        <p className="mt-1 text-xs leading-5 text-stone-500">{detail.inputNote}</p>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-xs font-medium text-amber-700">買い切りで追加（準備中）</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl">
            <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-amber-700/80 uppercase">Compare</p>
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">6人まとめて比較する</h2>
            <div className="overflow-hidden rounded-[1.8rem] border border-stone-200 bg-white/90">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/80">
                      <th className="px-6 py-4 text-left font-semibold text-stone-700">取材班</th>
                      <th className="px-6 py-4 text-left font-semibold text-stone-700">得意分野</th>
                      <th className="px-6 py-4 text-left font-semibold text-stone-700">入力方式</th>
                      <th className="px-6 py-4 text-left font-semibold text-stone-700">料金</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHARACTERS.map((char, i) => {
                      const detail = castDetails[char.id as keyof typeof castDetails]
                      return (
                        <tr
                          key={char.id}
                          className={`border-b border-stone-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-stone-50/50'}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <CharacterAvatar src={char.icon48} alt="" emoji={char.emoji} size={36} />
                              <div>
                                <p className="font-semibold text-stone-900">{char.name}</p>
                                <p className="text-xs text-stone-400">{char.species}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-stone-600">{char.specialty}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${detail.inputType === 'テキスト' ? 'bg-stone-100 text-stone-600' : 'bg-yellow-100 text-yellow-700'}`}>
                              {detail.inputType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {char.available
                              ? <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />無料</span>
                              : <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />買い切り追加</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] border border-stone-200 bg-[linear-gradient(135deg,_#1f2937_0%,_#292524_55%,_#6b4f2c_100%)] px-6 py-10 text-white sm:px-10 sm:py-12">
            <p className="text-xs font-medium tracking-[0.22em] text-amber-200 uppercase">まず3人と話してみる</p>
            <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  ミント、クラウス、レインは
                  <br />
                  無料で今すぐ使えます。
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-200">
                  登録するだけで3人の取材班を呼べます。どのキャラが合うか、まず試してみてください。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className={getButtonClass('secondary', 'px-6 py-4 text-sm')}
                >
                  無料で始める
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/80 bg-transparent px-6 py-4 text-sm font-semibold text-white transition-colors duration-150 hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
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
