/**
 * 業種ヒントを取材プロンプトに薄く注入するためのモジュール。
 *
 * `projects.industry_memo` の内容から業種カテゴリを推定（簡易キーワードマッチ）し、
 * 該当ヒントを返す。完全版は .claude/skills/interview-quality/SKILL.md を参照。
 *
 * 業種が推定できない場合は空文字を返し、AIキャストはグランドツアーから入る方針に任せる。
 */

type IndustryAxis = {
  customerType: 'btoc' | 'btob' | 'mixed' | null
  goodsType: 'tangible' | 'intangible' | 'mixed' | null
  category: 'manufacturing' | 'service' | 'profession' | 'retail' | 'construction' | null
}

const BTOB_KEYWORDS = ['BtoB', 'B2B', '法人', '企業向け', '事業者向け', '取引先', '商社', '卸', 'B-to-B']
const BTOC_KEYWORDS = ['BtoC', 'B2C', '一般客', '消費者', 'お客様', '個人客', '来店', 'B-to-C']

const TANGIBLE_KEYWORDS = ['製造', '加工', '商品', '製品', '物販', '小売', '飲食', '食品', 'メーカー']
const INTANGIBLE_KEYWORDS = ['サービス', '相談', 'コンサル', '士業', '医療', '教育', '指導', '施術']

const CATEGORY_KEYWORDS: Array<{ key: IndustryAxis['category']; words: string[] }> = [
  { key: 'manufacturing', words: ['製造', '加工', '工場', '製作', '機械', '部品', '素材', '建材'] },
  { key: 'service', words: ['美容', '整体', 'クリーニング', '修理', 'サロン', 'エステ', 'マッサージ'] },
  { key: 'profession', words: ['士業', '医療', 'クリニック', '弁護士', '税理士', '会計士', '行政書士', '司法書士', '社労士', '教室', '塾', '指導'] },
  { key: 'retail', words: ['小売', '物販', '飲食', 'カフェ', 'レストラン', '居酒屋', '販売', 'ショップ', '店舗'] },
  { key: 'construction', words: ['建設', 'リフォーム', '外壁', '塗装', '内装', '工務店', '水道', '電気工事', '庭', '造園', '解体'] },
]

function detectAxes(industryMemo: string): IndustryAxis {
  const text = industryMemo

  const customerType: IndustryAxis['customerType'] =
    BTOB_KEYWORDS.some((w) => text.includes(w)) && BTOC_KEYWORDS.some((w) => text.includes(w))
      ? 'mixed'
      : BTOB_KEYWORDS.some((w) => text.includes(w))
        ? 'btob'
        : BTOC_KEYWORDS.some((w) => text.includes(w))
          ? 'btoc'
          : null

  const goodsType: IndustryAxis['goodsType'] =
    TANGIBLE_KEYWORDS.some((w) => text.includes(w)) && INTANGIBLE_KEYWORDS.some((w) => text.includes(w))
      ? 'mixed'
      : TANGIBLE_KEYWORDS.some((w) => text.includes(w))
        ? 'tangible'
        : INTANGIBLE_KEYWORDS.some((w) => text.includes(w))
          ? 'intangible'
          : null

  let category: IndustryAxis['category'] = null
  for (const { key, words } of CATEGORY_KEYWORDS) {
    if (words.some((w) => text.includes(w))) {
      category = key
      break
    }
  }

  return { customerType, goodsType, category }
}

const CATEGORY_HINT: Record<NonNullable<IndustryAxis['category']>, string> = {
  manufacturing: '製造業の典型的な深掘り: 機械/手作業の使い分け、検品基準、業界用語、職人の判断、ロスの考え方。「判断に迷う加工は」「機械が出来ないと感じた場面」「同業ではどう判断するか」',
  service: 'サービス業の典型: 接客時間の使い方、説明の言葉選び、リピート顧客との関係、シーズナリティ。「初回と2回目以降で話し方を変えてるか」「予約が埋まる時期と空く時期で何が違うか」',
  profession: '専門職の典型: 判断の根拠、選ばれた理由、相談しやすさの工夫、専門外の人への翻訳力。「専門用語をお客様に説明するときの工夫」「あえてお断りする案件はあるか」',
  retail: '小売業の典型: 仕入れ・選定基準、店構え、接客のリズム、地域との関係。「常連さんの動き」「仕入れ先を選ぶ基準」「最近お客様に勧めて喜ばれた商品」',
  construction: '建設・施工の典型: 現場判断、見積もり時のすり合わせ、追加発生時の対応、職人とお客様の橋渡し。「現場で予定と違ったときの判断」「お客様への説明で気をつけていること」',
}

const CUSTOMER_HINT: Record<NonNullable<IndustryAxis['customerType']>, string> = {
  btoc: 'BtoC: 個人客の感情・口コミ・リピート理由・季節性を拾う。「最近のお客様で印象に残った人を一人」「最初に言われた一言」「なぜ戻ってきてくれたか」',
  btob: 'BtoB: 取引のきっかけ・継続している理由・他社との比較・担当者との関係を拾う。「最近の引き合いはどんな経緯で来たか」「リピート受注の理由を担当者から直接聞いたことは」',
  mixed: 'BtoC と BtoB が混在。両方の文脈で問いを変える',
}

const GOODS_HINT: Record<NonNullable<IndustryAxis['goodsType']>, string> = {
  tangible: '有形商材: 素材・製法・工程・選別基準・保管/配送のこだわりを拾う。「同業と素材の選び方で違うところは」「お客様には見えていない手間」',
  intangible: '無形商材: 提供プロセス・判断基準・お客様の言葉・信頼形成の流れを拾う。「最初の相談から納品までの流れを朝から教えてください（グランド・ツアー）」「お客様が安心したと感じた瞬間」',
  mixed: '有形・無形が混在。プロセスと物理工程の両方を拾う',
}

/**
 * industry_memo から業種ヒントを生成。空文字なら注入しない（AIがグランドツアーから入る）。
 */
export function buildIndustryHintContext(industryMemo: string | null | undefined): string {
  if (!industryMemo || !industryMemo.trim()) return ''
  const axes = detectAxes(industryMemo)
  if (!axes.customerType && !axes.goodsType && !axes.category) return ''

  const lines: string[] = []
  if (axes.category) lines.push(`- ${CATEGORY_HINT[axes.category]}`)
  if (axes.customerType) lines.push(`- ${CUSTOMER_HINT[axes.customerType]}`)
  if (axes.goodsType) lines.push(`- ${GOODS_HINT[axes.goodsType]}`)

  return `【業種別の深掘りヒント（取材スタイルの参考）】\n${lines.join('\n')}\nこれは "効きそうな観点" のヒントです。事業者の実際の語りに合わない場合は使わない。`
}
