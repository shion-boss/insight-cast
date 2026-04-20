'use client'

import { useState } from 'react'

import { PublicFooter, PublicHeader, PublicPageFrame } from '@/components/public-layout'

type FaqGroup = {
  id: string
  label: string
  items: Array<{ q: string; a: string }>
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'service',
    label: 'サービスについて',
    items: [
      {
        q: 'Insight Castはどんなサービスですか？',
        a: 'ホームページの更新に困っている中小事業者向けに、AI取材から記事素材化までを提供するサービスです。URLを入れるだけでHP調査から競合比較、キャストによる取材、記事素材の生成までを担います。',
      },
      {
        q: 'AIライティングツールと何が違いますか？',
        a: 'Insight Castは「一次情報を引き出す」取材プロセスを重視します。あなた自身の言葉・体験・こだわりを素材にするため、他社のコンテンツとは差別化しやすくなります。',
      },
      {
        q: 'どんな業種に向いていますか？',
        a: '特定の業種制限はありませんが、「専門性があるのに伝えられていない」事業者に特に効果的です。建設業・整骨院・美容・飲食・士業など、様々な業種でご利用いただいています。',
      },
    ],
  },
  {
    id: 'cast',
    label: 'キャストについて',
    items: [
      {
        q: 'キャストとは何ですか？',
        a: 'AIが担う「取材担当者」です。それぞれ異なる取材スタイルを持ち、目的に合わせて選べます。ミント・クラウス・レインの3名が無料でご利用いただけます。',
      },
      {
        q: 'キャストはどのくらい質問しますか？',
        a: '平均10〜15問、所要時間は20分前後です。途中で終了することも可能です。最低7回の応答で素材生成が可能です。',
      },
      {
        q: '追加キャストはいつから使えますか？',
        a: 'ハル・モグロ・コッコは近日公開予定です。将来的に追加オプションとして提供予定です。',
      },
      {
        q: '同じキャストで何度も取材できますか？',
        a: '可能です。取材先ごとに複数回取材ができます。テーマを変えて積み重ねることで、より豊かなコンテンツ素材が溜まっていきます。',
      },
    ],
  },
  {
    id: 'output',
    label: '記事素材について',
    items: [
      {
        q: '生成された記事はすぐ公開できますか？',
        a: '「素材」として提供されます。そのまま使うことも可能ですが、ご自身の言葉に合わせて整えることで、より自然な仕上がりになります。',
      },
      {
        q: '記事のスタイルは選べますか？',
        a: '通常記事・インタビュー形式の2種から選べます。また文字量も選択可能です。',
      },
      {
        q: 'コピーライトはどちらに帰属しますか？',
        a: '生成された記事素材の権利はご利用者に帰属します。Insight Cast側は権利を主張しません。',
      },
    ],
  },
  {
    id: 'plan',
    label: 'プラン・料金について',
    items: [
      {
        q: '無料プランでできることは？',
        a: '月2回のAI取材・3名のフリーキャスト・基本HP分析レポート・取材メモ生成・記事素材月2本が無料でご利用いただけます。クレジットカードは不要です。',
      },
      {
        q: 'いつでも解約できますか？',
        a: '有料プランはいつでも解約可能です。解約後も月末まではサービスをご利用いただけます。',
      },
      {
        q: 'プランの途中変更は可能ですか？',
        a: '可能です。アップグレードは即時、ダウングレードは翌月から適用されます。',
      },
    ],
  },
  {
    id: 'data',
    label: 'データ・セキュリティについて',
    items: [
      {
        q: '取材内容は外部に共有されますか？',
        a: '取材内容は当社サービスの改善目的以外には使用しません。第三者への提供は行いません。詳細はプライバシーポリシーをご確認ください。',
      },
      {
        q: '解約後データはどうなりますか？',
        a: '解約後30日以内はデータにアクセス可能です。事前にエクスポートしてください。30日経過後は順次削除されます。',
      },
    ],
  },
] as const

function FaqGroupSection({ group }: { group: FaqGroup }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id={group.id} className="scroll-mt-32">
      <h2 className="border-b border-[var(--border)] pb-4 font-serif text-2xl font-bold text-[var(--text)]">
        {group.label}
      </h2>
      <div className="mt-6 overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)]">
        {group.items.map((item, index) => {
          const open = openIndex === index
          return (
            <div key={item.q} className={index < group.items.length - 1 ? 'border-b border-[var(--border)]' : ''}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 bg-[var(--surface)] px-6 py-5 text-left transition-colors hover:bg-[var(--surface2)]"
                aria-expanded={open}
              >
                <span className="text-[15px] font-semibold text-[var(--text)]">{item.q}</span>
                <span className={`text-[var(--text3)] transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              {open && (
                <div className="bg-[var(--bg2)] px-6 pb-6 pt-4 text-sm leading-8 text-[var(--text2)]">
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function FaqPage() {
  const [activeId, setActiveId] = useState('service')

  return (
    <PublicPageFrame>
      <PublicHeader />

      <main className="relative z-10">
        <section className="bg-gradient-to-br from-[#fdf7f0] to-[#f5e8d8] px-6 pb-14 pt-[88px] sm:pb-16 sm:pt-[96px]">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">FAQ</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-[var(--text)] sm:text-5xl">よくある質問</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text2)]">
              サービス・キャスト・料金・データについてまとめています。解決しない場合はお気軽にお問い合わせください。
            </p>
          </div>
        </section>

        <section className="px-6 py-[88px]">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="space-y-1">
                {FAQ_GROUPS.map((group) => (
                  <a
                    key={group.id}
                    href={`#${group.id}`}
                    onClick={() => setActiveId(group.id)}
                    className={`block rounded-[var(--r-sm)] border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                      activeId === group.id
                        ? 'border-[var(--accent)] bg-[var(--accent-l)] text-[var(--accent)]'
                        : 'border-transparent text-[var(--text2)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {group.label}
                  </a>
                ))}
              </div>
            </aside>

            <div className="space-y-14">
              {FAQ_GROUPS.map((group) => (
                <FaqGroupSection key={group.id} group={group} />
              ))}

              <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-l)] text-2xl text-[var(--accent)]">
                  ?
                </div>
                <h2 className="mt-5 font-serif text-2xl font-bold text-[var(--text)]">解決しない質問がありますか？</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text2)]">
                  お問い合わせフォームからお気軽にご連絡ください。
                </p>
                <a
                  href="mailto:hello@insightcast.jp"
                  className="mt-6 inline-flex items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-h)]"
                >
                  お問い合わせ →
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  )
}
