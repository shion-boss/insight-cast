import type { Metadata } from 'next'

import { LegalPageTemplate } from '@/components/public-layout'

export const metadata: Metadata = { title: '特定商取引法に基づく表記 | Insight Cast' }

const rows: { label: string; value: string; breakAll?: boolean }[] = [
  { label: '販売事業者', value: '大槻詞音' },
  { label: '所在地', value: '特定商取引法第11条に基づき、請求があった場合には遅滞なく開示します' },
  { label: '連絡先', value: 'info@insight-cast.jp', breakAll: true },
  { label: '販売価格', value: '各プランページに記載' },
  { label: '代金の支払時期', value: '月次払い（翌月分を当月末に請求）' },
  { label: '支払方法', value: 'クレジットカード（Stripe経由）' },
  { label: 'サービス提供時期', value: '申込み完了後、即時' },
  { label: 'キャンセル・返金', value: '月途中のキャンセルは翌月より停止。既払い分の返金はお受けしておりません' },
  { label: '動作環境', value: '最新版のChrome、Safari、Firefoxを推奨' },
]

export default function TokushohoPage() {
  return (
    <LegalPageTemplate
      title="特定商取引法に基づく表記"
      updatedAt="2026年4月24日"
      summary="販売事業者、価格、支払方法、提供時期、キャンセル・返金条件など、取引に関する法定表示を掲載しています。"
    >
      <section>
        <table>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th>{row.label}</th>
                <td style={row.breakAll ? { wordBreak: 'break-all', overflowWrap: 'anywhere' } : undefined}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </LegalPageTemplate>
  )
}
