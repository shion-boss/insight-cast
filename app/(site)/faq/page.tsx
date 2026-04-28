import type { Metadata } from 'next'
import { PublicHero } from '@/components/public-layout'
import { FaqContent } from './faq-client'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'よくある質問 | Insight Cast',
  description: 'Insight Cast のよくある質問をまとめています。サービス内容・キャストの使い方・料金プランの違い・データの扱いについてお答えします。解決しない場合はお気軽にお問い合わせください。',
  alternates: { canonical: `${APP_URL}/faq` },
  openGraph: {
    title: 'よくある質問 | Insight Cast',
    description: 'サービス内容・キャストの使い方・料金プランの違い・データの扱いについてよくある質問をまとめています。',
    url: `${APP_URL}/faq`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/logo.jpg', width: 1116, height: 350, alt: 'Insight Cast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'よくある質問 | Insight Cast',
    description: 'Insight Cast のサービス内容・キャスト・料金・データ管理についてよくある質問をまとめています。',
    images: ['/logo.jpg'],
  },
}

const FAQ_GROUPS = [
  {
    id: 'service',
    label: 'サービスについて',
    items: [
      {
        q: 'Insight Castはどんなサービスですか？',
        a: 'ホームページの更新に困っている中小事業者向けに、AI取材から記事素材化までを提供するサービスです。取材先を登録すると、HP調査・競合比較・キャストによる取材・記事素材の受け取りまで進められます。',
      },
      {
        q: 'AIライティングツールと何が違いますか？',
        a: 'Insight Castは「一次情報を引き出す」取材プロセスを重視します。あなた自身の言葉・体験・こだわりを素材にするため、他社のコンテンツとは差別化しやすくなります。',
      },
      {
        q: 'どんな業種に向いていますか？',
        a: '特定の業種制限はありません。「専門性があるのに伝えられていない」事業者に特に効果的です。建設業・整骨院・美容・飲食・士業など、どの業種でもご利用いただけます。',
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
        a: '約20分の会話で取材します。途中でまとめて終了することもできます。',
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
        q: '届いた記事素材はすぐ公開できますか？',
        a: '「素材」として提供されます。そのまま使うことも可能ですが、ご自身の言葉に合わせて整えることで、より自然な仕上がりになります。',
      },
      {
        q: '記事のスタイルは選べますか？',
        a: '通常記事・インタビュー形式の2種から選べます。また文字量も選択可能です。',
      },
      {
        q: '届いた記事素材の著作権は誰のものですか？',
        a: '著作権はご利用者に帰属します。ホームページやSNSに自由にお使いください。Insight Cast側は権利を主張しません。',
      },
    ],
  },
  {
    id: 'plan',
    label: 'プラン・料金について',
    items: [
      {
        q: '無料プランでできることは？',
        a: '2回（単発）のAI取材・3名のフリーキャスト・基本HP分析レポート・取材メモ・記事素材の受け取りが無料でご利用いただけます。クレジットカードは不要です。',
      },
      {
        q: 'いつでも解約できますか？',
        a: 'はい。マイページの「ご利用プラン」からいつでも解約できます。解約後もこれまでのデータは保持されます。',
      },
      {
        q: 'プランの途中変更は可能ですか？',
        a: 'アップグレード（上位プランへの変更）はマイページの「設定 → ご利用プラン」からお申し込みいただけます。ダウングレードは現在対応しておりません。',
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
        a: '解約後もこれまでの取材メモや記事素材はそのまま保持されます。ご自身で削除しない限り、データが消えることはありません。',
      },
    ],
  },
] as const

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'よくある質問', item: `${APP_URL}/faq` },
  ],
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }))
  ),
}

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main id="main-content" className="relative z-10">
        <PublicHero
          compact
          eyebrow="FAQ"
          title="よくある質問"
          description="サービス・キャスト・料金・データについてまとめています。解決しない場合はお気軽にお問い合わせください。"
        />

        <section className="px-6 py-[88px]">
          <FaqContent groups={FAQ_GROUPS} />
        </section>
      </main>


    </>
  )
}
