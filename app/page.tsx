import { createClient } from '@/lib/supabase/server'
import { CHARACTERS } from '@/lib/characters'
import { CharacterAvatar } from '@/components/ui'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import mintPortrait from '@/assets/characters/mint/portraits/portrait-half.png'
import clausPortrait from '@/assets/characters/claus/portraits/portrait-half.png'
import rainPortrait from '@/assets/characters/rain/portraits/portrait-half.png'
import halPortrait from '@/assets/characters/hal/portraits/portrait-half.png'
import mogroPortrait from '@/assets/characters/mogro/portraits/portrait-half.png'
import coccoPortrait from '@/assets/characters/cocco/portraits/portrait-half.png'

const featuredCharacters = CHARACTERS.filter((char) => ['mint', 'claus', 'rain'].includes(char.id))
const allCastCharacters = CHARACTERS.filter((char) => ['mint', 'claus', 'rain', 'hal', 'mogro', 'cocco'].includes(char.id))
const portraitMap = {
  mint: mintPortrait,
  claus: clausPortrait,
  rain: rainPortrait,
  hal: halPortrait,
  mogro: mogroPortrait,
  cocco: coccoPortrait,
} as const

const valuePoints = [
  {
    title: '見過ごされている価値を見つける',
    description: 'ふだんの接客や判断基準、こだわりの中にある「それ、選ばれる理由です」を会話から拾い上げます。',
  },
  {
    title: '競合と並べて伝え方を整える',
    description: 'ただ褒めるのではなく、他社と比べてどこが違うのかを言葉にして、ホームページの軸を作ります。',
  },
  {
    title: 'そのまま記事づくりにつながる',
    description: '取材の内容は要約と記事素材までつながるので、単発の会話で終わらず更新の流れまで前に進みます。',
  },
]

const steps = [
  {
    number: '01',
    title: 'ホームページと競合を読み込む',
    description: '掲載中の情報と競合候補を見比べながら、「すでに言えていること」と「まだ眠っている魅力」を整理します。',
    characterId: 'claus',
  },
  {
    number: '02',
    title: 'AI取材班が会話で深掘りする',
    description: 'やわらかい質問で答えやすく進めながら、お客様が喜ぶ理由や現場の判断基準を少しずつ引き出します。',
    characterId: 'mint',
  },
  {
    number: '03',
    title: '伝わる形にまとめて記事化する',
    description: '取材メモを土台に、ホームページへ載せやすい見出しや記事素材までつなげて更新を早くします。',
    characterId: 'rain',
  },
]

const proofPoints = [
  '専門性・接客・差別化をそれぞれ別の視点で取材',
  '会話は短い質問ベースで、構えず進めやすい設計',
  '登録後すぐに試せて、クレジットカードも不要',
]

const useCases = [
  'サービスの良さはあるのに、ホームページの言葉がふわっとしている',
  'お客様には伝わっている魅力が、サイトでは拾い切れていない',
  '記事を増やしたいけれど、何を書けばいいか毎回止まってしまう',
]

const transformationPoints = [
  {
    label: 'Before',
    title: 'なんとなく良さそうで止まる',
    description: '「丁寧です」「安心です」だけでは、比較されたときに違いが伝わりません。',
    tone: 'border-stone-200 bg-white/85 text-stone-500',
  },
  {
    label: 'After',
    title: '選ばれる理由が具体的に残る',
    description: '誰が、どんな場面で、なぜ安心するのかまで言葉にして、記事や見出しに落とし込みます。',
    tone: 'border-amber-200 bg-amber-50 text-stone-700',
  },
]

const industryExamples = [
  {
    name: '工務店・リフォーム',
    issue: '施工事例はあるのに、判断基準や安心感が言葉になっていない',
    shift: '現場で何を見ているか、相談時にどこで安心されるかを引き出す',
  },
  {
    name: '美容室・サロン',
    issue: '雰囲気は伝わるが、通い続けたくなる理由が弱い',
    shift: '接客の距離感や提案のしかたを、お客様目線の言葉へ整理する',
  },
  {
    name: '士業・専門サービス',
    issue: '専門性は高いのに、初回相談のハードルが下がらない',
    shift: '難しい話をどう噛みくだいているかを、信頼の材料として見せる',
  },
]

const interviewMock = [
  {
    role: 'interviewer',
    name: 'ミント',
    content: '「初めて来た方が、ここでホッとする瞬間ってどこですか？」',
  },
  {
    role: 'user',
    name: '事業者さん',
    content: '「最初に困っていることを急かさず聞くので、そこで安心されることが多いです。」',
  },
  {
    role: 'interviewer',
    name: 'レイン',
    content: '「その“急かさない”って、選ばれている理由っぽいですね。サイトにはまだ出ていないかもです。」',
  },
]

const outputMock = [
  '初回相談で急かさず話を聞く姿勢',
  '専門的な内容をかみくだいて伝える工夫',
  '比較されたときに伝わる「安心の理由」',
]

const dashboardSnapshot = [
  { label: '取材先', value: '12件' },
  { label: '進行中', value: '3件' },
  { label: '記事候補', value: '8本' },
]

const dashboardTimeline = [
  {
    title: '○○工務店',
    status: 'インタビュー完了',
    detail: 'クラウスが専門性の違いを整理',
  },
  {
    title: '△△サロン',
    status: '記事ドラフトへ',
    detail: 'ミントが接客の安心感を抽出',
  },
  {
    title: '□□事務所',
    status: '比較軸を更新',
    detail: 'レインが訴求ポイントを再構成',
  },
]

const articleSections = [
  '相談しやすさが伝わる導入文',
  '選ばれる理由を支える3つの具体例',
  'お客様の不安を下げる説明パート',
]

const castFitGuide = [
  {
    title: '安心感や接客の魅力を言葉にしたい',
    members: 'ミント / ハル',
    description: 'お客様がホッとする理由や、人柄・空気感まで含めて伝えたいときに向いています。',
  },
  {
    title: '専門性や判断基準の違いを見せたい',
    members: 'クラウス / モグロ',
    description: '技術・判断・こだわりを深く掘って、比較されたときの理由を強くしたい場面向けです。',
  },
  {
    title: '訴求や告知の切り口を増やしたい',
    members: 'レイン / コッコ',
    description: '選ばれる見せ方や、キャンペーン・告知に転換しやすい切り口を整理できます。',
  },
]

const interviewerRecommendations = [
  {
    concern: 'ホームページが無難で、やさしさや安心感が伝わっていない',
    characterIds: ['mint', 'hal'],
    summary: '接客の温度や人柄、来店前の不安を下げる言葉を引き出したいときに向いています。',
  },
  {
    concern: '専門性はあるのに、違いが伝わらず比較で埋もれてしまう',
    characterIds: ['claus', 'mogro'],
    summary: '技術・判断・こだわりの背景まで掘って、他社と比べた理由を強くしたい場面向けです。',
  },
  {
    concern: '訴求の切り口やキャンペーンの見せ方をもっと増やしたい',
    characterIds: ['rain', 'cocco'],
    summary: '選ばれる見せ方と告知の素材を同時に整理して、更新ネタまで作りたいときに合います。',
  },
]

const faqs = [
  {
    question: 'どんな業種でも使えますか？',
    answer: 'はい。まずはホームページの内容と競合候補を見ながら、業種に合わせて質問の角度を調整します。',
  },
  {
    question: '文章が苦手でも進められますか？',
    answer: '進められます。インタビュー形式なので、思いつくまま答えるだけでも素材がたまるように作っています。',
  },
  {
    question: '最初に何を用意すればいいですか？',
    answer: '取材先のホームページURLがあれば始められます。競合候補は登録時に一緒に整えられます。',
  },
]

export default async function LandingPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/dashboard')
  } catch {
    // 認証状態の取得に失敗しても、公開トップはそのまま表示する
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_28%),radial-gradient(circle_at_80%_12%,_rgba(251,191,36,0.1),_transparent_24%),linear-gradient(180deg,_#fffcf5_0%,_#f5f5f4_50%,_#fffdf8_100%)] text-stone-900">
      <div className="pointer-events-none absolute left-[-7rem] top-28 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-6rem] top-[34rem] h-80 w-80 rounded-full bg-stone-200/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-[56rem] h-px bg-gradient-to-r from-transparent via-stone-200/70 to-transparent" aria-hidden="true" />

      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-white/72 shadow-[0_8px_30px_rgba(28,25,23,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {featuredCharacters.map((char) => (
                <CharacterAvatar
                  key={char.id}
                  src={char.icon48}
                  alt={`${char.name}のアイコン`}
                  emoji={char.emoji}
                  size={36}
                  className="border-white shadow-sm"
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-stone-700 uppercase">Insight Cast</p>
              <p className="text-xs text-stone-400">AI取材で、ホームページの伝わり方を育てる</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden text-sm text-stone-500 transition-colors hover:text-stone-800 sm:inline-block"
            >
              ログイン
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
            >
              無料ではじめる
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative overflow-hidden px-6 pb-18 pt-10 sm:pb-24 sm:pt-16">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[30rem] max-w-6xl rounded-[3rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(255,255,255,0.24))]"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute left-1/2 top-8 h-56 w-56 -translate-x-[160%] rounded-full bg-amber-100/80 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.08fr)_450px] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-4 py-2 text-xs font-medium tracking-[0.18em] text-amber-800 uppercase shadow-sm ring-1 ring-amber-100/70">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Interview-driven Website Messaging
              </div>
              <h1 className="mt-7 text-4xl font-semibold leading-[1.03] tracking-[-0.03em] text-stone-950 sm:text-5xl lg:text-[4.25rem]">
                当たり前すぎて
                <br />
                自分では書けない価値を、
                <br />
                AI取材で言葉にする。
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-stone-600 sm:text-[1.05rem]">
                Insight Cast は、ホームページと競合をふまえて質問するAI取材班です。
                事業者さんの中にある判断基準、接客の工夫、選ばれる理由を引き出して、
                そのまま記事や訴求の素材に変えていきます。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-6 py-4 text-sm font-medium text-white shadow-[0_14px_34px_rgba(28,25,23,0.18)] transition-transform transition-colors hover:-translate-y-0.5 hover:bg-stone-800"
                >
                  まずは無料で試す
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white/92 px-6 py-4 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-white hover:text-stone-900"
                >
                  ログインして続きから
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {proofPoints.map((point) => (
                  <span key={point} className="rounded-full bg-white/88 px-3 py-1.5 text-xs text-stone-500 ring-1 ring-stone-200 shadow-[0_6px_18px_rgba(28,25,23,0.03)]">
                    {point}
                  </span>
                ))}
              </div>

              <div className="mt-9 grid gap-3 sm:grid-cols-3">
                {[
                  ['調査から開始', 'HPと競合候補を見たうえで質問'],
                  ['会話で深掘り', '構えず答えられる短い問いかけ'],
                  ['記事素材化', '見出しと訴求の素までつながる'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-[1.6rem] border border-stone-200/90 bg-white/78 px-4 py-4 shadow-[0_12px_30px_rgba(28,25,23,0.04)] backdrop-blur-sm">
                    <p className="text-sm font-medium text-stone-800">{title}</p>
                    <p className="mt-1.5 text-xs leading-5 text-stone-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 translate-x-4 translate-y-5 rounded-[2rem] bg-amber-100/45 blur-2xl" aria-hidden="true" />
              <div className="relative rounded-[2.1rem] border border-stone-200/80 bg-white/92 p-5 shadow-[0_28px_80px_rgba(28,25,23,0.1)] backdrop-blur">
                <div className="rounded-[1.7rem] bg-[linear-gradient(160deg,_#1c1917_0%,_#292524_100%)] p-5 text-white shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs tracking-[0.2em] text-stone-400 uppercase">Live Interview</p>
                      <p className="mt-1 text-lg font-medium">取材班が聞き出すこと</p>
                    </div>
                    <div className="flex -space-x-2">
                      {featuredCharacters.map((char) => (
                        <CharacterAvatar
                          key={char.id}
                          src={char.icon48}
                          alt={`${char.name}のアイコン`}
                          emoji={char.emoji}
                          size={34}
                          className="border-stone-800"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      'なぜそのやり方にしているんですか？',
                      'お客さまが安心する瞬間って、どこですか？',
                      '他ではなく、ここを選ぶ決め手は何でしょう？',
                    ].map((message, index) => (
                      <div
                        key={message}
                        className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          index % 2 === 0
                            ? 'bg-white/10 text-stone-100'
                            : 'ml-auto rounded-tr-sm bg-amber-300 text-stone-900'
                        }`}
                      >
                        {message}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ['3人の取材班', '視点を変えて魅力を発掘'],
                    ['競合比較つき', '違いをそのまま言語化'],
                    ['記事素材まで', '更新の手前まで進める'],
                  ].map(([title, desc]) => (
                          <div key={title} className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#fafaf9_100%)] px-4 py-4 shadow-sm">
                      <p className="text-sm font-medium text-stone-800">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            {valuePoints.map((item, index) => (
              <div
                key={item.title}
                className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(250,250,249,0.9))] p-6 shadow-[0_18px_45px_rgba(28,25,23,0.05)]"
              >
                <div className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-stone-500 uppercase">
                  0{index + 1}
                </div>
                <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-stone-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-10 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="rounded-[2rem] border border-stone-200 bg-stone-900 p-6 text-white shadow-[0_18px_50px_rgba(28,25,23,0.08)]">
              <p className="text-xs tracking-[0.22em] text-stone-400 uppercase">For Teams Like Yours</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                こんな状態なら、
                <br />
                かなり相性がいいです。
              </h2>
              <div className="mt-6 space-y-3">
                {useCases.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
                    <span className="mt-0.5 text-amber-300">●</span>
                    <p className="text-sm leading-7 text-stone-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(255,247,219,0.88))] p-6 shadow-[0_18px_50px_rgba(28,25,23,0.06)]">
              <p className="text-xs tracking-[0.22em] text-stone-400 uppercase">Message Shift</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                伝え方は、
                <br />
                こう変わっていきます。
              </h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {transformationPoints.map((item) => (
                  <div key={item.label} className={`rounded-[1.75rem] border px-5 py-5 ${item.tone}`}>
                    <p className="text-xs font-medium tracking-[0.18em] uppercase">{item.label}</p>
                    <p className="mt-3 text-lg font-medium text-stone-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-7">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">By Industry</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                業種が違っても、
                <br />
                引き出すべき価値の形は見つけられます。
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-500 sm:text-base">
                何を聞くかは業種によって変わります。けれど、選ばれる理由が現場のふるまいに眠っている点は共通です。
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {industryExamples.map((item) => (
                <div key={item.name} className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.85))] p-6 shadow-[0_16px_40px_rgba(28,25,23,0.04)]">
                  <p className="text-sm font-semibold text-stone-900">{item.name}</p>
                  <p className="mt-4 text-xs font-medium tracking-[0.16em] text-stone-400 uppercase">よくある状態</p>
                  <p className="mt-2 text-sm leading-7 text-stone-500">{item.issue}</p>
                  <p className="mt-5 text-xs font-medium tracking-[0.16em] text-amber-700 uppercase">Insight Cast で変わること</p>
                  <p className="mt-2 text-sm leading-7 text-stone-700">{item.shift}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
            <div>
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">How It Works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                会話だけで終わらず、
                <br />
                ホームページ改善までつなげる流れです。
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-stone-500 sm:text-base">
                なんとなく良さそう、で止めずに、調査から取材、記事素材化までを一つの導線にまとめています。
                少人数の事業者でも続けやすいように、やることを順番に絞っています。
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step) => {
                const char = CHARACTERS.find((item) => item.id === step.characterId)

                return (
                  <div key={step.number} className="flex gap-4 rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.97),_rgba(250,250,249,0.9))] p-5 shadow-[0_16px_36px_rgba(28,25,23,0.05)]">
                    <div className="flex flex-col items-center gap-3">
                      <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium tracking-[0.16em] text-white">
                        {step.number}
                      </span>
                      <CharacterAvatar
                        src={char?.icon96}
                        alt={`${char?.name ?? step.title}のアイコン`}
                        emoji={char?.emoji}
                        size={52}
                        className="border-stone-100"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-stone-900">{step.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-500">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div>
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">Interview To Output</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                会話が、そのまま
                <br />
                発信の材料になっていく流れ。
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-stone-500 sm:text-base">
                答えて終わりではなく、「いまの話、そこが大事です」と拾いながら、記事や見出しに変えやすい粒度まで整理します。
              </p>

              <div className="mt-6 space-y-3">
                {interviewMock.map((item) => (
                  <div
                    key={`${item.role}-${item.content}`}
                    className={`max-w-xl rounded-[1.75rem] px-5 py-4 text-sm leading-7 shadow-[0_10px_28px_rgba(28,25,23,0.05)] ${
                      item.role === 'interviewer'
                        ? 'border border-stone-200 bg-white text-stone-700'
                        : 'ml-auto bg-stone-900 text-white'
                    }`}
                  >
                    <p className={`text-xs font-medium ${item.role === 'interviewer' ? 'text-stone-400' : 'text-stone-300'}`}>
                      {item.name}
                    </p>
                    <p className="mt-1">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-[linear-gradient(160deg,_#fff8e6_0%,_#fffdf8_100%)] p-6 shadow-[0_22px_55px_rgba(245,158,11,0.1)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] text-amber-700 uppercase">Output Snapshot</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                    記事の素は、
                    <br />
                    こんな形で残ります。
                  </h3>
                </div>
                <div className="flex -space-x-2">
                  {featuredCharacters.map((char) => (
                    <CharacterAvatar
                      key={char.id}
                      src={char.icon48}
                      alt={`${char.name}のアイコン`}
                      emoji={char.emoji}
                      size={36}
                      className="border-white shadow-sm"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-amber-100 bg-white/90 p-5">
                <p className="text-sm font-medium text-stone-900">見出し候補</p>
                <p className="mt-2 text-lg font-semibold leading-8 text-stone-800">
                  「急かさず話を聞く」から始まる、
                  <br />
                  相談しやすさの理由
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {outputMock.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-4 text-sm text-stone-700">
                    <span className="mt-0.5 text-amber-600">✦</span>
                    <p className="leading-7">{item}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-7 text-stone-500">
                取材メモ、見出し候補、訴求の軸が同時に残るので、次の更新作業がかなり軽くなります。
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 sm:py-14">
          <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(245,245,244,0.9))] p-6 shadow-[0_22px_60px_rgba(28,25,23,0.06)] sm:p-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">Who To Start With</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                いまの悩みから、
                <br />
                最初の取材班を選べます。
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-500 sm:text-base">
                6人いると迷いやすいので、「今どこを強くしたいか」から選べる形にしています。最初の1回は、いちばん困っている課題に近い取材班から始めるのがおすすめです。
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {interviewerRecommendations.map((item) => (
                <div key={item.concern} className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(245,245,244,0.92))] p-5 shadow-sm">
                  <p className="text-sm font-medium leading-7 text-stone-900">{item.concern}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.characterIds.map((id) => {
                      const char = CHARACTERS.find((entry) => entry.id === id)
                      if (!char) return null

                      return (
                        <div key={char.id} className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2">
                          <CharacterAvatar
                            src={char.icon48}
                            alt={`${char.name}のアイコン`}
                            emoji={char.emoji}
                            size={28}
                            className="border-stone-100"
                          />
                          <span className="text-xs font-medium text-stone-700">{char.name}</span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-stone-500">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-18">
          <div className="mx-auto max-w-6xl rounded-[2.7rem] border border-stone-200 bg-[linear-gradient(180deg,_#1c1917_0%,_#292524_100%)] px-6 py-8 text-white shadow-[0_32px_90px_rgba(28,25,23,0.16)] sm:px-8 sm:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs tracking-[0.22em] text-stone-400 uppercase">Cast</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  6人の取材班から、
                  <br />
                  今ほしい視点を選べます。
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
                  やさしく聞く、深く見る、伝わり方を整える、写真から人柄をひらく、言い切れない核を掘る、告知の材料へ変える。
                  同じ質問を繰り返すのではなく、役割の違うインタビュアーが別の面を引き出します。
                </p>
              </div>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
              >
                取材班を呼んでみる
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {allCastCharacters.map((char) => (
                <div key={char.id} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 shadow-[0_14px_34px_rgba(0,0,0,0.12)]">
                  <div className="relative h-56 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_60%)]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-950/70" />
                    <Image
                      src={portraitMap[char.id as keyof typeof portraitMap]}
                      alt={`${char.name}のポートレート`}
                      fill
                      className="object-cover object-center"
                      sizes="(min-width: 768px) 33vw, 100vw"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-4">
                      <div>
                        <p className="text-lg font-medium text-white">{char.name}</p>
                        <p className="text-sm text-stone-300">{char.species}</p>
                      </div>
                      <CharacterAvatar
                        src={char.icon48}
                        alt={`${char.name}のアイコン`}
                        emoji={char.emoji}
                        size={40}
                        className="border-white/30 bg-white/10"
                      />
                    </div>
                  </div>
                  <div className="p-5">
                    {char.label && (
                      <p className="text-xs font-medium tracking-[0.16em] text-amber-300 uppercase">{char.label}</p>
                    )}
                    <p className="mt-3 text-sm leading-7 text-stone-300">{char.description}</p>
                    <p className="mt-4 rounded-2xl bg-white/6 px-4 py-3 text-sm text-stone-100">
                      {char.specialty}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {castFitGuide.map((item) => (
                <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 shadow-sm">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-3 text-xs font-medium tracking-[0.16em] text-amber-300 uppercase">{item.members}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">FAQ</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                はじめる前に気になること。
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-stone-500 sm:text-base">
                最低限の準備で始められるように設計しています。まずは1件登録して、実際の会話の流れを見てもらうのが早いです。
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(250,250,249,0.92))] p-5 shadow-sm">
                  <p className="text-sm font-medium text-stone-900 sm:text-base">{faq.question}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-500">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-10 sm:py-14">
          <div className="mx-auto max-w-6xl rounded-[2.75rem] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(245,245,244,0.92))] p-6 shadow-[0_30px_95px_rgba(28,25,23,0.08)] sm:p-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.22em] text-stone-400 uppercase">Product Preview</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                取材のあと、
                <br />
                管理画面ではこう見えてきます。
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-500 sm:text-base">
                どの取材先が進んでいて、何が記事の素として残っているかを、そのまま追いかけられる構成です。
              </p>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,_#111827_0%,_#0f172a_100%)] text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">Dashboard Preview</p>
                    <p className="mt-1 text-lg font-medium">Insight Cast</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {featuredCharacters.map((char) => (
                      <CharacterAvatar
                        key={char.id}
                        src={char.icon48}
                        alt={`${char.name}のアイコン`}
                        emoji={char.emoji}
                        size={32}
                        className="border-white/10 bg-white/10"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    {dashboardSnapshot.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
                        <p className="text-xs text-stone-400">{item.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">最近の進行状況</p>
                        <p className="mt-1 text-xs text-stone-400">インタビューから記事候補までを一覧で確認</p>
                      </div>
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
                        live
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {dashboardTimeline.map((item) => (
                        <div key={item.title} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-stone-900/40 px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-stone-400">{item.detail}</p>
                          </div>
                          <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-stone-300">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-amber-200 bg-[linear-gradient(180deg,_#fff9ea_0%,_#ffffff_100%)] p-5 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.18em] text-amber-700 uppercase">Article Draft Preview</p>
                    <p className="mt-1 text-xl font-semibold text-stone-900">公開前のドラフト画面</p>
                  </div>
                  <div className="rounded-full bg-stone-900 px-3 py-1 text-xs text-white">
                    Draft
                  </div>
                </div>

                <div className="mt-5 rounded-[1.75rem] border border-amber-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">Headline</p>
                  <h3 className="mt-2 text-2xl font-semibold leading-9 text-stone-900">
                    「急かさず話を聞く」から始まる、
                    <br />
                    相談しやすい会社のつくり方
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-stone-500">
                    インタビューから出てきた表現をもとに、読み手に伝わる順序へ並び替えたドラフトです。
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {articleSections.map((item, index) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white/90 px-4 py-4">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-stone-800">{item}</p>
                        <p className="mt-1 text-xs leading-5 text-stone-400">
                          取材メモから見出し候補と本文の芯を自動で整理
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-18 pt-6 sm:pb-24">
          <div className="mx-auto max-w-5xl rounded-[2.8rem] border border-amber-200 bg-[linear-gradient(135deg,_#fff7db_0%,_#fffaf0_42%,_#ffffff_100%)] px-6 py-12 text-center shadow-[0_30px_95px_rgba(245,158,11,0.16)] sm:px-10">
            <div className="flex justify-center gap-3">
              {featuredCharacters.map((char) => (
                <CharacterAvatar
                  key={char.id}
                  src={char.icon96}
                  alt={`${char.name}のアイコン`}
                  emoji={char.emoji}
                  size={58}
                  className="border-white shadow-sm"
                />
              ))}
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-stone-950 sm:text-[2.6rem]">
              まずは1回、AI取材を受けてみてください。
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              事業のことをよく知っている人ほど、自分たちの良さは書きにくいものです。
              Insight Cast は、その言いにくさを会話でほどいて、ホームページの言葉に変えるところまで伴走します。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-6 py-4 text-sm font-medium text-white shadow-[0_14px_34px_rgba(28,25,23,0.18)] transition-colors hover:bg-stone-800"
              >
                無料で始める
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white px-6 py-4 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
              >
                ログイン
              </Link>
            </div>
            <p className="mt-4 text-xs text-stone-400">登録は無料。クレジットカード不要です。</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/80 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Insight Cast</p>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="transition-colors hover:text-stone-700">
              ログイン
            </Link>
            <Link href="/auth/signup" className="transition-colors hover:text-stone-700">
              新規登録
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
