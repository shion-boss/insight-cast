import type { Metadata } from 'next'

import { LegalPageTemplate } from '@/components/public-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp'

export const metadata: Metadata = {
  title: '利用規約 | Insight Cast',
  description: 'Insight Cast を利用いただく際の基本条件、禁止事項、権利関係、免責事項などを定めています。',
  alternates: { canonical: `${APP_URL}/terms` },
  robots: { index: false },
}

export default function TermsPage() {
  return (
    <LegalPageTemplate
      title="利用規約"
      updatedAt="2026年4月18日"
      summary="Insight Cast を利用いただく際の基本条件、禁止事項、権利関係、免責事項などを定めています。"
    >
      <section>
        <h2>1. 適用</h2>
        <p>
          本規約は、Insight Cast（以下「当サービス」）を利用するすべての方（以下「ユーザー」）に適用されます。
          当サービスをご利用いただくことで、本規約の内容にご同意いただいたものとみなします。
        </p>
      </section>

      <section>
        <h2>2. アカウント</h2>
        <p>
          ユーザーは、正確かつ最新の情報でアカウントを登録する責任を負います。
          アカウントの管理・セキュリティはユーザー本人の責任となります。
          第三者によるアカウントの不正利用に気づいた場合は、速やかにご連絡ください。
        </p>
      </section>

      <section>
        <h2>3. 禁止事項</h2>
        <p>以下の行為を禁止します。</p>
        <ul>
          <li>不正アクセスまたはその試み</li>
          <li>スパムの送信や迷惑行為</li>
          <li>著作権・商標権その他の知的財産権の侵害</li>
          <li>法令に違反する行為または公序良俗に反する行為</li>
          <li>サービスに過大な負荷をかける行為</li>
        </ul>
      </section>

      <section>
        <h2>4. コンテンツの権利</h2>
        <p>
          ユーザーが当サービスに入力したコンテンツの権利は、ユーザーに帰属します。
          当サービスは、サービスの改善を目的として、個人を特定できない形に匿名化したうえで分析に利用する場合があります。
        </p>
      </section>

      <section>
        <h2>5. 免責事項</h2>
        <p>
          当サービスは現状有姿で提供されます。
          当サービスを通じて生成・提示されたコンテンツの正確性・完全性・特定目的への適合性について、保証するものではありません。
          ユーザーは、当サービスの利用から生じるいかなる損害についても、自己の責任において対処するものとします。
        </p>
      </section>

      <section>
        <h2>6. サービスの変更・停止</h2>
        <p>
          当サービスは、事前に通知のうえ、サービスの内容を変更または停止する場合があります。
          やむを得ない事情がある場合には、予告なく停止することがあります。
        </p>
      </section>

      <section>
        <h2>7. 準拠法・管轄</h2>
        <p>
          本規約は日本法に準拠します。
          当サービスに関して紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
      </section>

      <section>
        <h2>8. お問い合わせ</h2>
        <p>本規約に関するお問い合わせは、以下のメールアドレスまでご連絡ください。</p>
        <p>
          メールアドレス: <a href="mailto:info@insight-cast.jp">info@insight-cast.jp</a>
        </p>
      </section>
    </LegalPageTemplate>
  )
}
