'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CharacterAvatar, getButtonClass } from '@/components/ui'
import { CHARACTERS, getCharacter } from '@/lib/characters'
import { PublicHeader, PublicFooter, PublicHero, PublicPageFrame } from '@/components/public-layout'

const featuredCharacters = CHARACTERS.filter((c) => ['mint', 'claus', 'rain'].includes(c.id))

type Faq = {
  q: string
  a: string
  characterId?: 'mint' | 'claus' | 'rain'
}

type FaqGroup = {
  label: string
  faqs: Faq[]
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    label: 'サービスについて',
    faqs: [
      {
        q: 'AIだけで作るの？人は関わらないの？',
        a: 'AI取材班が会話を進め、素材の整理や記事の下書きまで手伝います。ただし、最終的に「これをホームページに使う」と決めるのは事業者さん自身です。AIはたたき台を用意する存在で、公開する言葉や内容の判断は、あなたが行います。',
        characterId: 'mint',
      },
      {
        q: 'ホームページがなくても使えますか？',
        a: 'Insight Cast は「すでにホームページがある」事業者さんを主な対象にしています。インタビューそのものは利用できますが、HP分析や競合比較の機能はURLが必要です。制作中・リニューアル前の段階でのインタビューにも活用いただけます。',
        characterId: 'claus',
      },
      {
        q: 'どんな業種でも使えますか？',
        a: 'はい。特定の業種に絞らず、汎用的に機能するように設計しています。工務店・美容室・士業・飲食店・整体院・EC事業者など、インタビューを重ねてきた業種は多岐にわたります。業種特化の型は、今後の顧客の声をもとに追加していく予定です。',
        characterId: 'rain',
      },
      {
        q: '記事を自動で公開してもらえますか？',
        a: 'インタビュー素材の整理と記事の下書きまでが Insight Cast の役割です。公開作業（WordPressへの投稿など）はご自身で行っていただく形になります。コピー・Markdownダウンロードで、そのまま貼り付けやすい形で出力します。',
      },
    ],
  },
  {
    label: 'インタビューについて',
    faqs: [
      {
        q: '何を話せばいいか分からなくても大丈夫ですか？',
        a: '大丈夫です。取材班が質問を投げかけますので、答えていくだけで話が進みます。「自社の強みを考えてきてください」といった事前準備も必要ありません。むしろ、事前に整理されていない言葉の中に、本当の価値が眠っていることが多いです。',
        characterId: 'mint',
      },
      {
        q: 'どのキャラクターを選べばいいか分かりません',
        a: '迷ったらミントから始めてください。ミントはお客様目線でやさしく話を引き出すので、初めてのインタビューでも構えずに進められます。2回目以降は、「専門性を掘りたい」ならクラウス、「訴求の言葉を整理したい」ならレインと切り替えてみてください。',
        characterId: 'mint',
      },
      {
        q: '1回のインタビューでどれくらい話しますか？',
        a: '目安は15〜30分程度です。会話の深まり方によって変わりますが、取材班が「素材が集まった」と判断したタイミングで「まとめに入りましょうか？」と確認します。途中で止めることもできますし、続けて深掘りすることもできます。',
        characterId: 'claus',
      },
      {
        q: '同じキャラクターに何度もインタビューしてもいいですか？',
        a: 'はい、何度でもご利用いただけます。季節のトピック、新しい取り組み、別のサービスについてなど、テーマを変えてインタビューするほど、ホームページで伝えられる素材が増えていきます。繰り返し使うことを前提にしています。',
      },
    ],
  },
  {
    label: '料金・プランについて',
    faqs: [
      {
        q: '無料でどこまで使えますか？',
        a: '登録すると、ミント・クラウス・レインの3人の取材班が無料でご利用いただけます。インタビュー・素材整理・記事下書きまでの一連の流れを体験できます。ハル・モグロ・コッコは買い切りでの追加対応を予定しています。',
        characterId: 'rain',
      },
      {
        q: '月額プランと買い切りの違いは？',
        a: 'インタビューの基本機能は月額プランで継続的にご利用いただけます。追加キャラクター（ハル・モグロ・コッコ）は買い切り形式で、一度購入すれば以降は使い続けられる予定です。料金の詳細はリリース時にお知らせします。',
      },
      {
        q: '途中でやめたらどうなりますか？',
        a: '月途中でのキャンセルは翌月から停止します。それまでに作成したインタビュー記録や記事素材のデータは、退会後も一定期間保持します（詳細はリリース時にご案内します）。クレジットカード不要で始められる無料プランからお試しください。',
      },
    ],
  },
  {
    label: '品質・精度について',
    faqs: [
      {
        q: '出てきた記事は、そのまま使えますか？',
        a: 'そのまま使えるケースもありますが、事実確認と微調整をおすすめしています。取材班は会話から素材を引き出し下書きまで作りますが、事業者さんしか知らない細かいニュアンスや最新情報は、ご自身で補っていただくと完成度が上がります。',
        characterId: 'rain',
      },
      {
        q: '競合調査はどこまで正確ですか？',
        a: '登録いただいたURLをもとにホームページを読み込み、伝えている内容・構成・訴求軸を分析します。公開情報の範囲での分析になるため、価格・実績・口コミなど非公開情報は含まれません。「HPの見せ方の差」を整理することを目的にしています。',
        characterId: 'claus',
      },
    ],
  },
]

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false)
  const character = faq.characterId ? getCharacter(faq.characterId) : undefined

  return (
    <div className="rounded-[1.6rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600/40"
        aria-expanded={open}
      >
        <span className="mt-0.5 flex-shrink-0 text-base font-semibold text-amber-500">Q</span>
        <span className="flex-1 text-sm font-medium leading-7 text-stone-800 sm:text-base">{faq.q}</span>
        <span className={`mt-1 flex-shrink-0 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-stone-100 px-6 pb-6 pt-5">
          <div className="flex gap-4">
            {character ? (
              <CharacterAvatar
                src={character.icon96}
                alt={`${character.name}のアイコン`}
                emoji={character.emoji}
                size={40}
                className="flex-shrink-0 border-stone-100"
              />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-base font-semibold text-stone-400">
                A
              </div>
            )}
            <p className="flex-1 text-sm leading-8 text-stone-600">{faq.a}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <PublicHero
          eyebrow="FAQ"
          title="よくある質問"
          description={(
            <>
              使い始める前の不安を、まとめて解消しておきましょう。
              答えが見つからないときは、取材班に直接聞いてみてください。
            </>
          )}
          actions={(
            <div className="flex flex-wrap gap-2">
              {FAQ_GROUPS.map((g) => (
                <a
                  key={g.label}
                  href={`#${g.label}`}
                  className="rounded-full border border-stone-200/80 bg-[rgba(255,253,249,0.94)] px-4 py-2 text-sm text-stone-600 transition-all duration-150 hover:border-stone-300 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                >
                  {g.label}
                </a>
              ))}
            </div>
          )}
        />

        {/* FAQグループ */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-3xl space-y-14">
            {FAQ_GROUPS.map((group) => (
              <div key={group.label} id={group.label}>
                <h2 className="mb-5 text-xs font-semibold tracking-[0.2em] text-stone-400 uppercase">
                  {group.label}
                </h2>
                <div className="space-y-3">
                  {group.faqs.map((faq) => (
                    <FaqItem key={faq.q} faq={faq} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* まだ疑問がある人向け */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[2rem] border border-stone-200/80 bg-[rgba(255,253,249,0.94)] p-8 sm:p-10 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-3">
                {featuredCharacters.map((c) => (
                  <CharacterAvatar
                    key={c.id}
                    src={c.icon48}
                    alt={`${c.name}のアイコン`}
                    emoji={c.emoji}
                    size={40}
                    className="border-stone-100"
                  />
                ))}
              </div>
              <h2 className="mt-5 text-xl font-semibold text-stone-900">
                答えが見つからなかった方へ
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-500">
                まずは無料で試してみてください。登録してインタビューを1回体験すると、
                疑問のほとんどが解消します。クレジットカードは不要です。
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className={getButtonClass('primary', 'px-6 py-4 text-sm')}
                >
                  無料で始める
                </Link>
                <Link
                  href="/cast"
                  className={getButtonClass('secondary', 'px-6 py-4 text-sm font-medium')}
                >
                  キャストを見る
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
