import type { Metadata } from 'next'
import Link from 'next/link'

import { PublicHero } from '@/components/public-layout'
import { getButtonClass } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'AI時代の発信について | Insight Cast',
  description:
    'AI検索時代に一次情報が重要な理由、インタビューが効く理由、ホームページ更新が止まる理由。Insight Cast の思想を伝えるページです。',
}

const articles = [
  {
    id: 'ai-search',
    tag: 'AI検索時代',
    title: 'AI検索時代に、一次情報だけが残る理由',
    lead: 'ChatGPTやGeminiで調べるとき、誰もが気づいていることがあります。まとめ記事が要約されて表示されるようになった、ということです。',
    sections: [
      {
        heading: '「誰でも書けるコンテンツ」の価値が下がっている',
        body: [
          '従来のSEO記事は「検索ワードに答える」ことで評価されてきました。しかしAI検索は、そのような記事を大量に学習したうえで要約して答えを出します。つまり、AIだけでも書ける記事は、要約の中に埋もれやすくなっています。',
          'これは「何を書くか」ではなく「誰が話したか」が価値になる時代の始まりです。ページが表示されるかどうかよりも、その情報の出どころが信頼できるかどうかが問われるようになっています。',
        ],
      },
      {
        heading: '一次情報とは何か',
        body: [
          '一次情報とは、現場にいる人だけが知っていることです。30年間続けてきた職人の判断基準。最初の相談で必ず確認することとその理由。同じ業種の他社がやっていないこだわり。これらはどこにも書いていないし、AIも学習していません。',
          '事業者さん本人が「普通のことですよ」と言うことの中に、一次情報が眠っています。それを引き出して言葉にすること——これがAI時代のコンテンツ戦略の核になります。',
        ],
      },
      {
        heading: 'ホームページが「引用される場所」になる',
        body: [
          'AI検索は参照元を示します。「〇〇工務店のホームページによると」と引用されるためには、その情報が他のどこにも書いていない独自のものである必要があります。',
          '一次情報が積み重なったホームページは、AI検索時代に「引用される場所」になります。まとめサイトではなく、情報の出どころとして機能するためには、事業者さん本人の言葉が要です。',
        ],
      },
    ],
  },
  {
    id: 'interview',
    tag: 'インタビューの効果',
    title: 'なぜインタビューで、価値が引き出せるのか',
    lead: '「自社の強みを教えてください」と聞かれると、人は身構えます。営業的な答えを返してしまいます。インタビューはそれを避けるための設計です。',
    sections: [
      {
        heading: '「強みを教えてください」が機能しない理由',
        body: [
          '強みを直接聞くと、事業者さんは「丁寧です」「安心です」「経験があります」と答えます。これはウソではないのですが、伝わりません。同じことをどの会社も言っているからです。',
          '問題は、本当の強みは「直接聞いても出てこない」ことにあります。本人にとって当たり前すぎて、強みだと思っていないからです。「朝一番に現場を確認する」「見積もりのときに必ず聞くこと」——こういう話は、聞き方を工夫しなければ出てきません。',
        ],
      },
      {
        heading: '「エピソード」から入る理由',
        body: [
          'インタビュアーが使うアプローチは、エピソードから入ることです。「最近、印象に残っているお客様はいますか」「うまくいった仕事を1つ教えてください」——こういう質問には、具体的な話が返ってきます。',
          '具体的なエピソードの中に、価値の核があります。「あの方が喜んでくださったのは、実はこういうことをしていたからで」という部分。それを「それって他ではあまりないのでは？」と返したとき、事業者さんが「そうかもしれないですね」と気づく瞬間が、取材の本当の仕事です。',
        ],
      },
      {
        heading: '構えさせないことが、引き出す力になる',
        body: [
          '動物キャラクターをAIキャストにしているのも、この理由からです。スーツのコンサルタントに「御社の差別化ポイントは」と聞かれると、人は身構えます。でも「最近どんなお客さん来てますか？」と話しかけられると、ふだんの言葉で答えられます。',
          '構えさせない状況設計が、インタビューの価値を左右します。場の空気をつくることが、引き出す力の源です。',
        ],
      },
    ],
  },
  {
    id: 'update',
    tag: 'ホームページ更新',
    title: 'なぜホームページの更新は止まるのか',
    lead: 'ホームページを持っている事業者さんの多くが、更新を止めています。制作会社が悪いわけでも、事業者さんが怠けているわけでもありません。',
    sections: [
      {
        heading: '「何を書けばいいか分からない」が正直なところ',
        body: [
          'ホームページを更新したいとは思っている。でも何を書けばいいか分からない。これが、更新が止まる最大の理由です。',
          '事業者さんにとって「自社の強み」は当たり前すぎて言葉にならないし、「今どんな情報が必要か」を判断するのは専門外です。更新したくても、「書く素材」がないまま止まっています。',
        ],
      },
      {
        heading: '更新が負担になる設計の問題',
        body: [
          'CMSを使えば自分で更新できる——そう聞いて始めたものの、実際は「記事を書く」という作業そのものがハードルになります。文章を書くのが得意な人ばかりではないし、SEOのために何かをしなければという焦りもあります。',
          '更新が負担になるのは、事業者さんの問題ではなく、「まず文章を書く」という設計の問題です。インタビューを起点にすれば、事業者さんは「答える」だけでいい。書くのは後工程にできます。',
        ],
      },
      {
        heading: '「ネタ切れ」は実は存在しない',
        body: [
          '数回更新して止まる理由のひとつに、「もう書くことがない」という感覚があります。しかしAIキャストの目から見ると、話せることは尽きていません。',
          '仕事の現場は毎日動いています。お客様との会話の中に、サービスの季節性の中に、素材はいくらでも眠っています。問題は「それが記事になる」と気づけないことです。AIキャストがいれば、その気づきを一緒に拾っていけます。',
        ],
      },
    ],
  },
]

export default async function PhilosophyPage() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = Boolean(user)
  } catch {
    // 認証失敗時も表示する
  }

  return (
    <>


      <main className="relative z-10">
        <PublicHero
          eyebrow="Our Thinking"
          title={<>AI時代に、<br />なぜ一次情報なのか。</>}
          description={(
            <>
              検索のあり方が変わり、コンテンツの価値の基準が変わっています。
              Insight Cast がインタビューを起点にする理由、ホームページを「育てる」という考え方の背景を、3つのテーマで整理しました。
            </>
          )}
          actions={(
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {articles.map((a) => (
                <a
                  key={a.id}
                  href={`#${a.id}`}
                  className="flex items-center gap-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm text-[var(--text2)] transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  <span className="rounded-full bg-[var(--bg2)] px-2 py-0.5 text-[11px] font-medium text-[var(--text2)]">{a.tag}</span>
                  {a.title}
                </a>
              ))}
            </div>
          )}
          contentClassName="max-w-none"
        />

        {/* 記事本文 */}
        {articles.map((article, articleIndex) => (
          <section
            key={article.id}
            id={article.id}
            className="px-6 py-[88px]"
          >
            <div className="mx-auto max-w-6xl">
              <div className={`grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] ${articleIndex % 2 === 1 ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : ''}`}>
                {/* 左: ラベル・タイトル */}
                <div className={articleIndex % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="sticky top-24">
                    <span className="inline-block rounded-full border border-[var(--accent)]/20 bg-[var(--accent-l)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
                      {article.tag}
                    </span>
                    <h2 className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-[var(--text)] sm:text-3xl">
                      {article.title}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-[var(--text2)]">{article.lead}</p>

                    <div className="mt-8 h-px bg-gradient-to-r from-[var(--border2)] to-transparent" />
                    <p className="mt-6 text-xs text-[var(--text3)]">
                      {article.sections.length} つの観点で整理しています
                    </p>
                  </div>
                </div>

                {/* 右: 本文 */}
                <div className={`space-y-8 ${articleIndex % 2 === 1 ? 'lg:order-1' : ''}`}>
                  {article.sections.map((section, i) => (
                    <article
                      key={i}
                      className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-7"
                    >
                      <div className="flex items-start gap-4">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--text)] text-xs font-semibold text-white">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="pt-1 text-base font-semibold leading-snug text-[var(--text)] sm:text-lg">
                          {section.heading}
                        </h3>
                      </div>
                      <div className="mt-5 space-y-4 pl-12">
                        {section.body.map((para, j) => (
                          <p key={j} className="text-sm leading-8 text-[var(--text2)]">
                            {para}
                          </p>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* まとめ */}
        <section className="px-6 py-[88px]">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[var(--r-xl)] border border-[var(--text)]/10 bg-[var(--text)] p-8 text-white sm:p-10">
              <p className="text-xs font-medium tracking-[0.22em] text-[var(--text3)] uppercase">Summary</p>
              <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
                「書く」より「聞く」が先。
                <br />
                一次情報が、HPを育てる。
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { num: '01', text: 'AI検索時代は、現場の言葉だけが引用される' },
                  { num: '02', text: 'インタビューは「強みを聞く」のではなく「エピソードから引き出す」' },
                  { num: '03', text: '更新が止まる理由は「ネタ不足」ではなく「素材の気づかれなさ」' },
                ].map((item) => (
                  <div key={item.num} className="rounded-[var(--r-sm)] border border-white/10 bg-white/6 p-5">
                    <p className="text-xs font-semibold tracking-[0.2em] text-[var(--text3)] uppercase">{item.num}</p>
                    <p className="mt-3 text-sm leading-7 text-[rgba(255,255,255,0.72)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-[88px]">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[var(--r-xl)] border border-[var(--text)]/10 bg-[var(--text)] px-6 py-10 text-white sm:px-10 sm:py-12">
            <p className="text-xs font-medium tracking-[0.22em] text-[var(--accent-l)] uppercase">Try It</p>
            <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  まず一度、AIキャストに話しかけてみてください。
                </h2>
                <p className="mt-4 text-sm leading-7 text-[rgba(255,255,255,0.72)]">
                  ここまで読んでくださった方は、ぜひ一度試してみてください。
                  登録無料で、ミント・クラウス・レインの取材を試せます。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className={getButtonClass('secondary', 'px-6 py-4 text-sm')}
                  >
                    ダッシュボードへ →
                  </Link>
                ) : (
                  <Link
                    href="/auth/signup"
                    className={getButtonClass('secondary', 'px-6 py-4 text-sm')}
                  >
                    無料で取材を始める
                  </Link>
                )}
                <Link
                  href="/cast"
                  className="inline-flex items-center justify-center rounded-[var(--r-sm)] border border-white/80 bg-transparent px-6 py-4 text-sm font-semibold text-white transition-colors duration-150 hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  キャストを見る
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>


    </>
  )
}
