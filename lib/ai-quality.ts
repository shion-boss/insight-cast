export type PromptConversationMessage = {
  role: 'user' | 'assistant' | 'interviewer'
  content: string
}

type FormatConversationOptions = {
  userLabel?: string
  assistantLabel?: string
  maxMessageLength?: number
}

type NormalizeListOptions = {
  maxItems?: number
  maxLength?: number
}

const DEFAULT_LIST_MAX_ITEMS = 5
const DEFAULT_LIST_MAX_LENGTH = 120

const CONCRETE_SIGNAL_PATTERN = /(\d+|先月|先週|去年|今年|最近|お客様|現場|相談|見積|施工|来店|予約|問い合わせ|再依頼|写真|電話|メール|そのとき|この前|スタッフ|家族|具体)/u
const CUSTOMER_REACTION_PATTERN = /(喜|安心|助か|選ば|頼|また|ありがとう|反応|驚|うれし|再依頼|問い合わせ)/u
const ABSTRACT_HINT_PATTERN = /(丁寧|安心|信頼|品質|対応|こだわり|親切|誠実|まじめ|真面目|がんば|頑張|経験)/u

export function normalizePromptText(value: unknown, maxLength = 160) {
  if (typeof value !== 'string') return ''
  const normalized = value.replace(/\s+/g, ' ').trim()
  // Use Array.from to split by Unicode codepoint (handles emoji surrogate pairs)
  return Array.from(normalized).slice(0, maxLength).join('')
}

export function formatConversationForPrompt(
  messages: PromptConversationMessage[],
  options: FormatConversationOptions = {},
) {
  const userLabel = options.userLabel ?? '事業者'
  const assistantLabel = options.assistantLabel ?? 'インタビュアー'
  const maxMessageLength = options.maxMessageLength ?? 1200

  return messages
    .map((message) => {
      const content = normalizePromptText(message.content, maxMessageLength)
      if (!content) return null
      const label = message.role === 'user' ? userLabel : assistantLabel
      return `${label}: ${content}`
    })
    .filter((line): line is string => Boolean(line))
    .join('\n\n')
}

export function extractJsonBlock(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  return match?.[0] ?? null
}

function toCandidateStrings(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => (typeof item === 'string' ? [item] : []))
  }
  if (typeof value === 'string') {
    return value.split(/\n+/)
  }
  return [] as string[]
}

export function normalizeUniqueStringList(value: unknown, options: NormalizeListOptions = {}) {
  const maxItems = options.maxItems ?? DEFAULT_LIST_MAX_ITEMS
  const maxLength = options.maxLength ?? DEFAULT_LIST_MAX_LENGTH
  const seen = new Set<string>()
  const normalizedValues: string[] = []

  for (const item of toCandidateStrings(value)) {
    const normalized = Array.from(
      item.replace(/^[\s・*•\-0-9.]+/u, '').replace(/\s+/g, ' ').trim()
    ).slice(0, maxLength).join('')

    if (!normalized) continue

    const dedupeKey = normalized.toLowerCase()
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    normalizedValues.push(normalized)

    if (normalizedValues.length >= maxItems) break
  }

  return normalizedValues
}

function hasConcreteSignal(text: string) {
  return CONCRETE_SIGNAL_PATTERN.test(text) || /「[^」]+」/u.test(text)
}

function hasCustomerReactionSignal(text: string) {
  return CUSTOMER_REACTION_PATTERN.test(text)
}

function looksAbstractResponse(text: string) {
  const normalized = normalizePromptText(text, 220)
  if (!normalized) return false
  if (hasConcreteSignal(normalized)) return false
  if (normalized.length <= 32) return true
  return ABSTRACT_HINT_PATTERN.test(normalized)
}

/**
 * 文字列の bigram 集合を返す（簡易類似度用）。
 */
function bigrams(text: string): Set<string> {
  const normalized = normalizePromptText(text, 400)
  const grams = new Set<string>()
  for (let i = 0; i < normalized.length - 1; i++) {
    grams.add(normalized.slice(i, i + 2))
  }
  return grams
}

/**
 * 直近のインタビュアー発言と、新しい候補発言の類似度を計算（Jaccard / bigram）。
 * 0.0 = 全く違う、1.0 = 完全一致。0.55 以上で「ほぼ同じ問い」と判定する想定。
 */
export function computeQuestionSimilarity(prevText: string, candidateText: string): number {
  const a = bigrams(prevText)
  const b = bigrams(candidateText)
  if (a.size === 0 || b.size === 0) return 0
  let intersect = 0
  for (const g of a) if (b.has(g)) intersect++
  const union = a.size + b.size - intersect
  if (union === 0) return 0
  return intersect / union
}

/**
 * 直近 N ターンのインタビュアー発言の中に、候補発言と高類似度のものがあれば true。
 * 「同じ質問の繰り返し」を機械的に検出するためのヘルパー。
 */
export function detectQuestionRepetition(input: {
  history: PromptConversationMessage[]
  candidate: string
  windowTurns?: number
  threshold?: number
}): { repeated: boolean; similarity: number; matchedText?: string } {
  const window = input.windowTurns ?? 3
  const threshold = input.threshold ?? 0.55
  const interviewerTurns = input.history.filter(
    (m) => m.role === 'interviewer' || m.role === 'assistant',
  )
  const recent = interviewerTurns.slice(-window)
  let max = 0
  let matched: string | undefined
  for (const m of recent) {
    const sim = computeQuestionSimilarity(m.content, input.candidate)
    if (sim > max) {
      max = sim
      matched = m.content
    }
  }
  return { repeated: max >= threshold, similarity: max, matchedText: matched }
}

export type PastInterviewMemo = {
  focusTheme?: string | null
  summary?: string | null
  themes?: string[] | null
  createdAt?: string | null
}

export type InterviewStructure = 'chronological' | 'topical' | 'contrast' | 'qa' | 'omakase'

const STRUCTURE_HINTS: Record<InterviewStructure, string> = {
  chronological:
    '【取材構造: 時系列】\n' +
    '取材は時系列で進める。「お仕事の1日を朝からざっと教えてください」のグランド・ツアーから入り、\n' +
    '時間の流れに沿って深掘りする。途中の判断・選択・お客様との接点をその場で1つずつ拾う。\n' +
    '時間が見えると行動・判断・場面が見えやすくなる。',
  topical:
    '【取材構造: トピック別】\n' +
    '取材はトピックを順に切り替えて進める。focus_theme があればそれを最優先のトピックにし、\n' +
    'ひとつのトピックで具体エピソードが1つ取れたら次のトピックに移る。長居しすぎない。\n' +
    '複数の話題を浅すぎず深すぎず取れるのが利点。',
  contrast:
    '【取材構造: 対比】\n' +
    '取材は対比軸を立てて進める。「過去と今」「他社と自社」「うまくいった例と困った例」のいずれかで、\n' +
    '違いが見える話を引き出す。差を語ることで事業者の判断基準・価値観が浮かぶ。',
  qa:
    '【取材構造: Q&A】\n' +
    '取材は読者からの想定質問に答える形で進める。「お客様がよく聞くこと」「初めて検討する人が不安なこと」\n' +
    'を1つずつ拾い、それに答えてもらう。答えはそのまま FAQ 候補になる。',
  omakase: '',
}

/**
 * 取材構造のヒントをプロンプト注入用に整形する。omakase または不明なら空文字。
 */
export function buildInterviewStructureContext(structure: string | null | undefined): string {
  if (!structure || structure === 'omakase') return ''
  if (!(structure in STRUCTURE_HINTS)) return ''
  return STRUCTURE_HINTS[structure as InterviewStructure]
}

export function buildInterviewQualityContext(input: {
  messages: PromptConversationMessage[]
  userTurnCount: number
  isGreeting?: boolean
  isPassQuestion?: boolean
  focusTheme?: string | null
  relationship?: 'first' | 'returning'
  priorMeetingsCount?: number
  pastInterviewMemos?: PastInterviewMemo[]
}) {
  const userMessages = input.messages.filter((message) => message.role === 'user')
  const latestUserMessage = userMessages.at(-1)?.content ?? ''
  const recentUserFacts = userMessages
    .slice(-3)
    .map((message) => normalizePromptText(message.content, 120))
    .filter(Boolean)

  // 直近のインタビュアー発言（重複回避のための材料）
  const interviewerTurns = input.messages.filter(
    (message) => message.role === 'interviewer' || message.role === 'assistant',
  )
  const recentInterviewerQuestions = interviewerTurns
    .slice(-3)
    .map((message) => normalizePromptText(message.content, 200))
    .filter(Boolean)

  const relationship = input.relationship ?? 'first'
  const priorMeetingsCount = input.priorMeetingsCount ?? 0

  const parts = [
    `【会話品質ガイド】
- 同じ質問や言い換えを繰り返さない
- 次の発言では質問は1つだけにする
- 質問の前に短い前置きを1文だけ置き、何を聞きたいかを伝える
- 抽象的になりやすい問いには、答えの方向の例示・選択肢を2〜3個添える（ただし答えを誘導しない）
- 抽象的な答えには、具体例・場面・やり取りを聞く
- 具体例が出たら、次は理由・判断基準・相手の反応のどれか1つを掘る
- 反応では相手が言った具体的な単語を1つそのまま引用してから次の問いへ進む（ミラーリング）
- 調査結果や競合情報はヒントとして使い、そのまま読み上げない`,
  ]

  if (relationship === 'returning') {
    const memos = (input.pastInterviewMemos ?? []).slice(0, 2)
    const memoLines = memos
      .map((memo) => {
        const theme = memo.focusTheme ? normalizePromptText(memo.focusTheme, 60) : ''
        const summary = memo.summary ? normalizePromptText(memo.summary, 220) : ''
        const themes = (memo.themes ?? []).map((t) => normalizePromptText(t, 40)).filter(Boolean).slice(0, 4)
        const detailParts: string[] = []
        if (theme) detailParts.push(`テーマ「${theme}」`)
        if (themes.length > 0) detailParts.push(`扱った話題: ${themes.join(' / ')}`)
        if (summary) detailParts.push(`要点: ${summary}`)
        if (detailParts.length === 0) return null
        return `・${detailParts.join(' / ')}`
      })
      .filter((line): line is string => Boolean(line))

    parts.push(`【関係性: 再会（このユーザーとの取材は${priorMeetingsCount}回目）】
- 「はじめまして」「初めまして」と言わない
- 「またお話を聞きにきました」「前回の続きから少し」のような温度で入る
- 過去に話してくれた具体的な内容を、最初の1〜2ターンのうちに1つ自然に触れる（覚えていることを示す）
- 過去の話を執拗に蒸し返さない。今日のテーマに早めに着地する${
      memoLines.length > 0
        ? `\n\n【参考: 前回までのやりとりの記憶】\n${memoLines.join('\n')}\nこの内容と重複する質問はしない。今日のテーマと近い場合は、そこから自然に深掘りする。`
        : ''
    }`)
  } else {
    parts.push(`【関係性: 初対面】
- 短い自己紹介と取材の目的を1〜2文で添えてから、1問目に入る
- 自分の専門ラベルに沿った具体的な初手から入り、汎用的な「最近どうですか」「お名前を教えてください」は避ける`)
  }

  if (recentUserFacts.length > 0) {
    parts.push(`【直近で聞けたこと】
${recentUserFacts.map((fact) => `・${fact}`).join('\n')}
上の内容と重複しないよう、次は一段深い質問に進んでください。`)
  }

  if (recentInterviewerQuestions.length > 0) {
    parts.push(`【直近で自分が投げた問い（重複回避）】
${recentInterviewerQuestions.map((q) => `・${q}`).join('\n')}
これらと同じ角度・同じ言い回しの問いは出さない。同じ単語の繰り返し、同じ語尾、同じ前置きも避ける。違う切り口（時間軸 / 人 / 場所 / 行動 / 感情）に変える。`)
  }

  if (input.focusTheme) {
    parts.push(`【テーマの扱い方】
「${normalizePromptText(input.focusTheme, 80)}」を意識しつつも、テーマ名を繰り返すのではなく、事業者の実話や判断から自然に深掘りしてください。`)
  }

  if (input.isGreeting) {
    if (relationship === 'returning') {
      parts.push(`【最初の質問（再会）】
「はじめまして」「初めまして」と言わない。前回までのやりとりの記憶から、具体的な話題を1つ自然に触れてから、今日のテーマに合った答えやすい1問を出してください。`)
    } else {
      parts.push(`【最初の質問（初対面）】
短い自己紹介と取材の目的を1〜2文で添えたあと、答えやすくて具体的な話が出やすい入口から入ってください。いきなり「強み」「差別化」を聞かず、自分の専門ラベルに沿った具体的な問い（「最近の場面」「印象に残ったお客様」「いつもの仕事の流れ」のどれか）を選び、前置きと例示を1つ添えてください。`)
    }
  }

  if (input.isPassQuestion) {
    parts.push(`【パス後の対応】
直前と同じ角度の質問はやめて、切り口を変えた短い質問を1つだけ返してください。前置きを1文添え、答えやすい例示を1つ置いてください。`)
  } else if (latestUserMessage) {
    if (looksAbstractResponse(latestUserMessage)) {
      parts.push(`【次に聞くべきこと（答えやすさを優先）】
直近の回答はまだ抽象的です。次は「いつ・誰に・何をしたか」が出る具体例を1つだけ聞いてください。質問の前に短い前置きを置き、答え方の例示を2つ添えて、答えやすくしてください（例: 「最近のお客様の場面でも、現場での気づきでも、どちらでも構いません」）。`)
    } else if (hasConcreteSignal(latestUserMessage)) {
      if (hasCustomerReactionSignal(latestUserMessage)) {
        parts.push(`【次に聞くべきこと】
具体例と相手の反応が出ています。次は「なぜそうしたか」「その判断を続けている理由」「他との違い」のどれか1つを掘ってください。相手の言葉を1つそのまま引用してから問い直してください。`)
      } else {
        parts.push(`【次に聞くべきこと】
具体例は出ています。次は「相手がどう感じたか」「なぜその対応をしたのか」「その後どうなったか」のどれか1つを聞いてください。相手の言葉を1つそのまま引用してから問い直してください。`)
      }
    }
  }

  if (input.userTurnCount >= 6) {
    parts.push(`【終盤の進め方】
新しい話題を広げすぎず、選ばれる理由や再現性が見える締めの質問を優先してください。前向きな振り返りで終わるよう、最後の問いはポジティブな方向に置いてください。十分な情報が揃ったら、自然にまとめへ向かって構いません。`)
  } else if (input.userTurnCount >= 3) {
    parts.push(`【中盤の進め方】
直近の会話で出たエピソードを1つ選び、「なぜそうしたのか」「その判断を続けている理由」「相手がどう反応したか」のどれか1つを掘ってください。新しいエピソードを求めるより、出ているエピソードを深める方向を優先してください。`)
  }

  // 中盤（5ターン目）に1度だけ自己点検を促す。誘導・言い換え・繰り返しの自己検出。
  if (input.userTurnCount === 5) {
    parts.push(`【中盤の自己点検（このターンだけ）】
これまでの自分の問いを振り返り、以下に当てはまるものがあれば次の問いで必ず修正してください。
- 「○○ですよね？」のような誘導質問になっていた → 修正: 「○○についてはどう感じていますか」のように開く
- 同じ問いを言い換えて2回以上聞いていた → 修正: 別の角度（時間軸 / 人 / 場所 / 行動 / 感情）に切り替える
- 「なるほど、つまり〜ですね」と勝手にまとめて先に進んでいた → 修正: 相手の言葉のまま受け取る
- 抽象語の答えに「そうなんですね」だけで返して掘らなかった → 修正: 場面を1つ聞き直す
これは1ターンだけの内省。次のターン以降は通常の取材姿勢に戻る。`)
  }

  return parts.join('\n\n')
}
