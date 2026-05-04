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

export type PastInterviewMemo = {
  focusTheme?: string | null
  summary?: string | null
  themes?: string[] | null
  createdAt?: string | null
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

  return parts.join('\n\n')
}
