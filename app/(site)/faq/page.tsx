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
        a: 'ホームページの更新に困っている中小事業者向けに、AI取材から記事化までを提供するサービスです。プロジェクトを登録すると、HP調査・競合比較・キャストによる取材・記事の受け取りまで進められます。',
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
        q: 'AIに話しかけてちゃんと伝わるか心配です',
        a: '心配しなくて大丈夫です。キャストがやさしく質問を投げかけるので、あなたは答えるだけでOKです。うまく話せなくても、短い答えでも、キャストが上手に引き出してくれます。チャット形式なので、自分のペースで進められます。',
      },
      {
        q: 'キャストはどのくらい質問しますか？',
        a: '約20分の会話で取材します。途中でまとめて終了することもできます。',
      },
      {
        q: '追加キャストはいつから使えますか？',
        a: 'ハル・モグロ・コッコは現在準備を進めています。提供開始時にはサービス内でお知らせします。',
      },
      {
        q: '同じキャストで何度も取材できますか？',
        a: '可能です。プロジェクトごとに複数回取材ができます。テーマを変えて積み重ねることで、より豊かなコンテンツ素材が溜まっていきます。',
      },
    ],
  },
  {
    id: 'output',
    label: '記事について',
    items: [
      {
        q: '届いた記事はすぐ公開できますか？',
        a: 'そのままコピペして投稿できる状態でお届けします。タイトル・見出し・本文をブロック単位でコピーできるので、自分のブログエディタに貼るだけで完成します。',
      },
      {
        q: '記事のスタイルは選べますか？',
        a: '「通常記事」と「会話のやりとりをそのまま記事にした形式」の2種から選べます。また文字量も選択可能です。',
      },
      {
        q: 'AIが書いた記事はSEOに悪いのでは？',
        a: 'Insight Cast の記事は「あなた自身の言葉や体験」を素材にしています。Googleが重視する「実際の体験・専門性・信頼性」を自然に満たせるため、一般的なAI生成コンテンツとは性質が異なります。あなたにしか語れないことを記事にするので、AI検索時代にもむしろ強い発信になります。',
      },
      {
        q: '取材の答えがうまく言葉にできなくても記事になりますか？',
        a: 'なります。「うまく説明できない」「何から話せばいいか分からない」という状態でも大丈夫です。キャストが質問を重ねながら引き出してくれるので、短い答えや言いかけの言葉でも、ちゃんと記事の素材になります。',
      },
      {
        q: '1回の取材でどのくらいの量の記事が届きますか？',
        a: '1回の取材から、通常1〜3本分の記事を作成できます。取材の内容や選んだ文字量によって異なります。取材を重ねるほど、ホームページに載せられるコンテンツが積み上がっていきます。',
      },
      {
        q: '届いた記事の著作権は誰のものですか？',
        a: '著作権はご利用者に帰属します。ホームページやSNSに自由にお使いください。Insight Cast側は権利を主張しません。',
      },
    ],
  },
  {
    id: 'plan',
    label: 'プラン・料金について',
    items: [
      {
        q: '無料プランは本当に無料ですか？自動で課金されませんか？',
        a: 'はい、完全無料です。クレジットカードの登録も不要で、メールアドレスだけで始められます。自動で課金されることはありません。有料プランに変えたい場合は、ご自身でお申し込みいただく必要があります。',
      },
      {
        q: '無料プランでできることは？',
        a: '2回（単発）のAI取材・3名のフリーキャスト・基本HP分析レポート・取材メモ・記事の受け取りが無料でご利用いただけます。クレジットカードは不要です。',
      },
      {
        q: 'まず無料で試してから有料プランに移行できますか？',
        a: 'できます。無料で2回取材を体験してから、続けたいと思ったタイミングで月額プランに切り替えられます。切り替えはマイページからいつでも手続きできます。',
      },
      {
        q: 'いつでも解約できますか？',
        a: 'はい。マイページの「ご利用プラン」からいつでも解約できます。解約後もこれまでのデータは保持されます。',
      },
      {
        q: 'プランの途中変更は可能ですか？',
        a: 'アップグレード（上位プランへの変更）はマイページの「設定 → ご利用プラン」からお申し込みいただけます。ダウングレード（下位プランへの変更）は現在対応していません。変更をご希望の場合は、一度解約してから再度お申し込みいただく形になります。ご不便をおかけして申し訳ありません。',
      },
    ],
  },
  {
    id: 'data',
    label: 'データ・セキュリティについて',
    items: [
      {
        q: '取材内容は外部に共有されますか？',
        a: '取材でお話しいただいた内容は、あなたのコンテンツを作るためだけに使います。第三者に提供することはありません。安心してお話しください。詳しくはプライバシーポリシーをご覧ください。',
      },
      {
        q: '解約後データはどうなりますか？',
        a: '解約後もこれまでの取材メモや記事はそのまま保持されます。ご自身で削除しない限り、データが消えることはありません。',
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
