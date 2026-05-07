/**
 * 記事生成直後に実行する決定的セルフチェック（正規表現・カウントのみ）。
 *
 * AI セルフ採点（lib/article-self-review.ts）とは別レイヤー。
 * - 決定的チェック: コストゼロ・即時。形式違反・一人称混在・文字数乖離など機械的に検出可能なものを担当
 * - AI セルフ採点: 一次情報密度や CTA の自然さなど、文章の意味を読まないと判断できないものを担当
 *
 * 出力スキーマは `docs/review-log/article-evaluation.md` 8節を参照。
 */

import { ABSTRACT_HINT_PATTERN, normalizePromptText } from '@/lib/ai-quality'

export type ArticleType = 'client' | 'interviewer' | 'conversation'
export type ArticleVolume = 'short' | 'medium' | 'long' | 'pillar'

export const VOLUME_RANGES: Record<ArticleVolume, { min: number; max: number }> = {
  short: { min: 600, max: 800 },
  medium: { min: 1200, max: 1500 },
  long: { min: 2000, max: 2500 },
  pillar: { min: 5000, max: 8000 },
}

export type DeterministicArticleCheck = {
  perspective_violations: string[]
  first_person_mixed: { dominant: string; others: Array<{ token: string; count: number }> } | null
  title: string
  title_length: number
  char_count: number
  volume_range: { min: number; max: number; ok: boolean; tolerance_ok: boolean }
  abstract_density: number
  paragraph_count: number
  h1_count: number
  h2_count: number
  em_dash_lines: string[]
  jp_en_spacing_count: number
  jp_en_spacing_samples: string[]
  warnings: string[]
}

// AI生成の典型サインであるダッシュ記号。日本語ブログで実際にはほぼ使われない。
// U+2014 (—) / U+2015 (―) / U+2500 (─) を対象。タイトル・見出し行で混入したら警告する。
// 本文中（インタビュー記録の引用に元から含まれるケース）まで弾くと誤検出になるため、
// チェック対象は H1/H2/H3 行に限定する。
const EM_DASH_PATTERN = /[—―─]/

// 日本語（ひらがな・カタカナ・漢字）と英数字の間に半角・全角スペースが入った箇所を検出。
// 「Insight Cast は AI を 30 文字で」のような AI 生成癖を炙り出すための機械チェック。
// 日本語ブログでは詰めて書くのが標準で、スペースが入っているのは大抵 AI 由来。
const JP_RANGE = '\\u3041-\\u3096\\u30A1-\\u30FA\\u30FC\\u4E00-\\u9FFF々〆'
const JP_EN_SPACING_PATTERN = new RegExp(
  `[${JP_RANGE}][ \\u3000][a-zA-Z0-9]|[a-zA-Z0-9][ \\u3000][${JP_RANGE}]`,
  'g',
)

const FIRST_PERSON_TOKENS = ['私', '僕', '俺', '弊社', '当社', 'うち', '当方', '我々']

// client（事業者一人称）で混入してはいけない第三者伝聞表現。
// conversation の散文（導入・まとめ）でも避けたいが、interviewer 視点の記事では正常な表現。
const PERSPECTIVE_VIOLATION_PATTERNS: Array<{ pattern: RegExp; example: string }> = [
  { pattern: /(?:と|だ)のことです/g, example: '〜とのことです' },
  { pattern: /とのこと(?:[。、\s])/g, example: '〜とのこと' },
  { pattern: /だそうです/g, example: '〜だそうです' },
  { pattern: /と話してくれ[たてまる]/g, example: '〜と話してくれました' },
  { pattern: /と話していまし[たて]/g, example: '〜と話していました' },
  { pattern: /と語ってくれ[たてまる]/g, example: '〜と語ってくれました' },
  { pattern: /と教えてくれ[たてまる]/g, example: '〜と教えてくれました' },
  { pattern: /というのです/g, example: '〜というのです' },
  { pattern: /と聞きました/g, example: '〜と聞きました' },
]

/**
 * 抜粋行を本文から取り除く（lines/joined 両方を返す）。
 * 末尾近くにある「抜粋: 」「抜粋：」で始まる行を一つだけ取り除く。
 */
function stripExcerpt(content: string): { body: string; excerpt: string | null } {
  const lines = content.split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/^抜粋[:：]\s*(.+)$/)
    if (m) {
      const excerpt = m[1].trim()
      const body = lines.slice(0, i).join('\n').trimEnd()
      return { body, excerpt }
    }
  }
  return { body: content, excerpt: null }
}

/**
 * Markdown 本文を「タイトル / 本文」に分解。
 * `# タイトル` の最初の1行を取る。
 */
function extractTitle(body: string): { title: string; bodyWithoutTitle: string } {
  const m = body.match(/^#\s+(.+)$/m)
  const title = m?.[1].trim() ?? ''
  const bodyWithoutTitle = m
    ? body.replace(m[0], '').replace(/^\n+/, '')
    : body
  return { title, bodyWithoutTitle }
}

/**
 * 会話バブル（**Name**: 内容）の発話者・内容を取り出す。
 * conversation 記事は本文の大半が会話バブルなので、視点・一人称の判定では
 * 「散文部分」と「会話バブル」を分けて扱う必要がある。
 */
type ConversationSegment = {
  prose: string
  bubbles: Array<{ speaker: string; content: string }>
}

function splitConversation(bodyWithoutTitle: string): ConversationSegment {
  const lines = bodyWithoutTitle.split('\n')
  const proseLines: string[] = []
  const bubbles: Array<{ speaker: string; content: string }> = []
  for (const line of lines) {
    const m = line.match(/^\*\*([^*]+)\*\*[:：]\s*(.+)$/)
    if (m) {
      bubbles.push({ speaker: m[1].trim(), content: m[2].trim() })
    } else {
      proseLines.push(line)
    }
  }
  return { prose: proseLines.join('\n'), bubbles }
}

/**
 * 段落分割（空行2連続以上）。
 */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * 抽象密度の計算。各段落について「抽象表現に該当するか」を判定し、
 * 該当段落数 / 全段落数 を返す（0〜1）。
 *
 * `ai-quality.ts` の `looksAbstractResponse` と同じ判定ロジックを段落単位で適用。
 */
function computeAbstractDensity(paragraphs: string[]): number {
  if (paragraphs.length === 0) return 0
  let abstract = 0
  for (const p of paragraphs) {
    const normalized = normalizePromptText(p, 600)
    if (!normalized) continue
    // 段落が短く、抽象キーワードがあれば「抽象段落」として加算。
    // 長い段落は具体例を含む可能性が高いため、より厳しい条件にする。
    if (normalized.length <= 60 && ABSTRACT_HINT_PATTERN.test(normalized)) {
      abstract++
      continue
    }
    if (ABSTRACT_HINT_PATTERN.test(normalized) && !/「[^」]+」|\d/.test(normalized)) {
      // 抽象語があり、かつ具体（カギ括弧の引用 / 数字）が無い段落
      abstract++
    }
  }
  return abstract / paragraphs.length
}

/**
 * client 記事で混入してはいけない第三者伝聞表現を検出。
 * conversation 記事は散文部分のみチェック（会話バブル内の事業者発話には適用しない）。
 * interviewer 記事は対象外（取材者視点の記事ではこれらの表現が正常）。
 */
function detectPerspectiveViolations(text: string): string[] {
  const found = new Set<string>()
  for (const { pattern, example } of PERSPECTIVE_VIOLATION_PATTERNS) {
    if (pattern.test(text)) {
      found.add(example)
    }
  }
  return Array.from(found)
}

/**
 * 一人称混在の検出。
 * 主たる一人称（owner_first_person 設定値）以外が本文に N 回以上出ているかを見る。
 * conversation 記事は会話バブル内の事業者発話を除外して判定する（事業者の発話は
 * 設定された一人称と必ずしも一致しないことを許容するため）。
 */
function detectFirstPersonMixed(input: {
  text: string
  ownerFirstPerson: string | null
}): DeterministicArticleCheck['first_person_mixed'] {
  if (!input.ownerFirstPerson) return null
  const dominant = input.ownerFirstPerson.trim()
  if (!dominant) return null

  const others: Array<{ token: string; count: number }> = []
  for (const token of FIRST_PERSON_TOKENS) {
    if (token === dominant) continue
    // 一人称を意味のある形で検出するため、続く助詞を限定する
    // （単に「私」が含まれるだけでは部分文字列で誤検出される）
    const regex = new RegExp(`(?:^|[\\s。、「『（(])${token}(?=[はがをにのもへで・、。」』！？!?\\s])`, 'g')
    const matches = input.text.match(regex)
    if (matches && matches.length > 0) {
      others.push({ token, count: matches.length })
    }
  }
  if (others.length === 0) return null
  return { dominant, others }
}

/**
 * Markdown 本文の文字数（タイトル・見出し記号・抜粋を除いた純粋な本文）。
 * codepoint 単位でカウント（絵文字・サロゲートペア対策）。
 */
function countCharacters(text: string): number {
  const stripped = text
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~>#-]/g, '')
    .replace(/\s+/g, '')
  return Array.from(stripped).length
}

export function runDeterministicCheck(input: {
  content: string
  articleType: ArticleType
  volume: ArticleVolume
  ownerFirstPerson: string | null
}): DeterministicArticleCheck {
  const { body: contentWithoutExcerpt } = stripExcerpt(input.content)
  const { title, bodyWithoutTitle } = extractTitle(contentWithoutExcerpt)

  const isConversation = input.articleType === 'conversation'
  const segments = isConversation
    ? splitConversation(bodyWithoutTitle)
    : { prose: bodyWithoutTitle, bubbles: [] as ConversationSegment['bubbles'] }

  // 視点違反: client なら全文、conversation なら散文＋インタビュアー発話、interviewer は対象外
  const perspectiveScope =
    input.articleType === 'client'
      ? bodyWithoutTitle
      : input.articleType === 'conversation'
        ? [
            segments.prose,
            ...segments.bubbles
              // 会話バブル内のインタビュアー発話のみ視点違反対象とする
              // （事業者の発話は事業者本人が発したものとして扱い、third-person 表現は
              //  そもそも出にくい）
              .filter((b) => /インタビュアー|ミント|クラウス|レイン|ハル|モグロ|コッコ/.test(b.speaker))
              .map((b) => b.content),
          ].join('\n\n')
        : ''

  const perspective_violations = perspectiveScope
    ? detectPerspectiveViolations(perspectiveScope)
    : []

  // 一人称混在: client / interviewer は本文全体、conversation は散文のみ判定対象
  const firstPersonScope = isConversation ? segments.prose : bodyWithoutTitle
  const first_person_mixed = detectFirstPersonMixed({
    text: firstPersonScope,
    ownerFirstPerson: input.ownerFirstPerson,
  })

  const char_count = countCharacters(bodyWithoutTitle)

  const range = VOLUME_RANGES[input.volume]
  const tolerance_min = Math.floor(range.min * 0.8)
  const tolerance_max = Math.ceil(range.max * 1.2)
  const ok = char_count >= range.min && char_count <= range.max
  const tolerance_ok = char_count >= tolerance_min && char_count <= tolerance_max

  const paragraphs = splitParagraphs(segments.prose || bodyWithoutTitle)
  const abstract_density = computeAbstractDensity(paragraphs)

  const h1_count = (bodyWithoutTitle.match(/^#\s+/gm)?.length ?? 0) + (title ? 1 : 0)
  const h2_count = bodyWithoutTitle.match(/^##\s+/gm)?.length ?? 0

  // ダッシュ記号の検出はタイトル＋見出し行（H1/H2/H3）に限定する。
  // 本文中の引用にユーザーがダッシュを含めるケースはあり得るため、そこは対象外。
  const em_dash_lines: string[] = []
  if (title && EM_DASH_PATTERN.test(title)) {
    em_dash_lines.push(`# ${title}`)
  }
  for (const line of bodyWithoutTitle.split('\n')) {
    if (/^#{1,3}\s+/.test(line) && EM_DASH_PATTERN.test(line)) {
      em_dash_lines.push(line.trim())
    }
  }

  // 日本語×英数字スペースの検出は記事全体（タイトル・本文）から数える。
  // ただし会話バブルの「**Name**: 」のような行頭ラベル直後はスペースが必須なので、
  // 行頭の「**xxx**: 」を除外してからマッチさせる。
  const spacingScanText = [
    title,
    bodyWithoutTitle
      .split('\n')
      .map((line) => line.replace(/^\*\*[^*]+\*\*[:：]\s*/, ''))
      .join('\n'),
  ].filter(Boolean).join('\n')
  const spacingMatches = spacingScanText.match(JP_EN_SPACING_PATTERN) ?? []
  const jp_en_spacing_count = spacingMatches.length
  const jp_en_spacing_samples = Array.from(new Set(spacingMatches)).slice(0, 5)

  const warnings: string[] = []
  if (perspective_violations.length > 0) {
    warnings.push(`視点違反: ${perspective_violations.join(' / ')}`)
  }
  if (first_person_mixed) {
    const others = first_person_mixed.others.map((o) => `${o.token}×${o.count}`).join(' / ')
    warnings.push(`一人称混在: 主="${first_person_mixed.dominant}" 他=${others}`)
  }
  if (Array.from(title).length > 30) {
    warnings.push(`タイトル長: ${Array.from(title).length}字 (30字超)`)
  }
  if (!tolerance_ok) {
    warnings.push(`文字数乖離: ${char_count}字 (許容 ${tolerance_min}〜${tolerance_max})`)
  }
  if (h1_count !== 1) {
    warnings.push(`H1 異常: ${h1_count}個 (期待 1)`)
  }
  if (abstract_density >= 0.5) {
    warnings.push(`抽象段落比率: ${(abstract_density * 100).toFixed(0)}%`)
  }
  if (em_dash_lines.length > 0) {
    warnings.push(`ダッシュ記号 (—/―/─) 混入: ${em_dash_lines.length}行`)
  }
  if (jp_en_spacing_count > 0) {
    const sample = jp_en_spacing_samples.map((s) => `"${s}"`).join(' ')
    warnings.push(`日本語×英数字スペース癖: ${jp_en_spacing_count}箇所 ${sample}`)
  }

  return {
    perspective_violations,
    first_person_mixed,
    title,
    title_length: Array.from(title).length,
    char_count,
    volume_range: { min: range.min, max: range.max, ok, tolerance_ok },
    abstract_density: Number(abstract_density.toFixed(3)),
    paragraph_count: paragraphs.length,
    h1_count,
    h2_count,
    em_dash_lines,
    jp_en_spacing_count,
    jp_en_spacing_samples,
    warnings,
  }
}
