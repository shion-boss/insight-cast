import { createClient } from '@/lib/supabase/server'
import { CHARACTERS } from '@/lib/characters'
import { CharacterAvatar } from '@/components/ui'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import mintPortrait from '@/assets/characters/mint/portraits/portrait-half.png'
import clausPortrait from '@/assets/characters/claus/portraits/portrait-half.png'
import rainPortrait from '@/assets/characters/rain/portraits/portrait-half.png'

const featuredCharacters = CHARACTERS.filter((char) => ['mint', 'claus', 'rain'].includes(char.id))
const portraitMap = {
  mint: mintPortrait,
  claus: clausPortrait,
  rain: rainPortrait,
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_32%),linear-gradient(180deg,_#fffcf5_0%,_#f5f5f4_52%,_#fefefe_100%)] text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/75 backdrop-blur-xl">
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

      <main>
        <section className="relative overflow-hidden px-6 pb-16 pt-10 sm:pb-20 sm:pt-14">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[28rem] max-w-6xl rounded-[3rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,255,255,0.2))]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-4 py-2 text-xs font-medium tracking-[0.18em] text-amber-800 uppercase">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Interview-driven Website Messaging
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                当たり前すぎて
                <br />
                自分では書けない価値を、
                <br />
                AI取材で言葉にする。
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                Insight Cast は、ホームページと競合をふまえて質問するAI取材班です。
                事業者さんの中にある判断基準、接客の工夫、選ばれる理由を引き出して、
                そのまま記事や訴求の素材に変えていきます。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-6 py-4 text-sm font-medium text-white transition-transform transition-colors hover:-translate-y-0.5 hover:bg-stone-700"
                >
                  まずは無料で試す
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white/90 px-6 py-4 text-sm font-medium text-stone-700 transition-colors hover:bg-white hover:text-stone-900"
                >
                  ログインして続きから
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {proofPoints.map((point) => (
                  <span key={point} className="rounded-full bg-white/85 px-3 py-1.5 text-xs text-stone-500 ring-1 ring-stone-200">
                    {point}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ['調査から開始', 'HPと競合候補を見たうえで質問'],
                  ['会話で深掘り', '構えず答えられる短い問いかけ'],
                  ['記事素材化', '見出しと訴求の素までつながる'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-stone-200 bg-white/72 px-4 py-4 backdrop-blur-sm">
                    <p className="text-sm font-medium text-stone-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-stone-200 bg-white/90 p-5 shadow-[0_24px_80px_rgba(28,25,23,0.08)] backdrop-blur">
                <div className="rounded-[1.6rem] bg-stone-900 p-5 text-white">
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
                    <div key={title} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                      <p className="text-sm font-medium text-stone-800">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            {valuePoints.map((item) => (
              <div
                key={item.title}
                className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-[0_16px_40px_rgba(28,25,23,0.04)]"
              >
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
                <div key={item.name} className="rounded-[2rem] border border-stone-200 bg-white/88 p-6 shadow-[0_16px_40px_rgba(28,25,23,0.04)]">
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
                  <div
                    key={step.number}
                    className="flex gap-4 rounded-[2rem] border border-stone-200 bg-white/88 p-5 shadow-[0_12px_30px_rgba(28,25,23,0.04)]"
                  >
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
                    className={`max-w-xl rounded-[1.75rem] px-5 py-4 text-sm leading-7 shadow-sm ${
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

            <div className="rounded-[2rem] border border-amber-200 bg-[linear-gradient(160deg,_#fff8e6_0%,_#fffdf8_100%)] p-6 shadow-[0_18px_50px_rgba(245,158,11,0.08)]">
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

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-stone-200 bg-stone-900 px-6 py-8 text-white sm:px-8 sm:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs tracking-[0.22em] text-stone-400 uppercase">Cast</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  取材の角度が違う3人で、
                  <br />
                  ひとつの魅力を立体的に拾います。
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
                  やさしく聞く、深く見る、伝わり方を整える。
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

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {featuredCharacters.map((char) => (
                <div key={char.id} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6">
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
                <div key={faq.question} className="rounded-[1.75rem] border border-stone-200 bg-white/88 p-5">
                  <p className="text-sm font-medium text-stone-900 sm:text-base">{faq.question}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-500">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 pt-4 sm:pb-20">
          <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-amber-200 bg-[linear-gradient(135deg,_#fff7db_0%,_#fffaf0_45%,_#ffffff_100%)] px-6 py-10 text-center shadow-[0_24px_80px_rgba(245,158,11,0.12)] sm:px-10">
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
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              まずは1回、AI取材を受けてみてください。
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              事業のことをよく知っている人ほど、自分たちの良さは書きにくいものです。
              Insight Cast は、その言いにくさを会話でほどいて、ホームページの言葉に変えるところまで伴走します。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-stone-700"
              >
                無料で始める
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white px-6 py-4 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
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
