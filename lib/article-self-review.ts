/**
 * 記事生成直後に実行する AI 軽量セルフ採点（Haiku）。
 *
 * `docs/review-log/article-evaluation.md` のルーブリック10軸を参照し、
 * 1〜3 の整数で各軸を採点する。決定的チェック（lib/article-quality-check.ts）が
 * 拾えない「意味」レベルの判定（一次情報密度、CTAの自然さなど）を担当する。
 *
 * 採点結果は `articles.quality_review.ai_self` に保存される。
 * 失敗時は null を返し、生成自体はブロックしない。
 *
 * パターン元: lib/ai-self-review.ts（AIキャストの取材自己採点）
 */

import Anthropic from '@anthropic-ai/sdk'

import { extractJsonBlock } from '@/lib/ai-quality'
import { logApiUsage } from '@/lib/api-usage'

export type ArticleSelfReviewScores = {
  primary_info: number       // [AA] 一次情報密度
  perspective: number        // [AB] 視点一貫性
  abstract_density: number   // [AC] 抽象表現の少なさ
  title_quality: number      // [AD] タイトル品質
  excerpt_quality: number    // [AE] 抜粋品質
  structure: number          // [AF] 構造整合
  cta: number                // [AG] CTA・次の行動
  internal_link: number | null   // [AH] 内部リンク活用（候補なしなら null）
  first_person: number | null    // [AI] 一人称統一（owner_first_person 未設定なら null）
  char_count: number         // [AJ] 文字数遵守
}

export type ArticleSelfReview = {
  scores: ArticleSelfReviewScores
  total: number
  total_max: number
  weakest_axes: string[]
  comment: string
}

const SYSTEM_PROMPT = `あなたは Insight Cast の記事生成品質を評価する編集レビュアーです。
渡された記事を以下の10軸で 1〜3 の整数で採点してください。
辛口でも構いませんが、根拠のある採点をしてください。

【評価軸】
[AA] primary_info（一次情報密度）
- 3: 事業者本人しか言えない具体エピソード・判断・お客様反応が3件以上
- 2: 1〜2件あるが汎用記述が混じる
- 1: 抽象論ばかりで他社でも書ける内容

[AB] perspective（視点一貫性）
- articleType=client: 事業者一人称が崩れていないか
- articleType=interviewer: 取材者視点が崩れていないか
- articleType=conversation: 二者の発話が会話バブル形式に沿っているか
- 3: 完全統一 / 2: 1〜2箇所で揺れ / 1: 複数箇所で崩れ

[AC] abstract_density（抽象表現の少なさ）
- 3: 抽象語が出ても具体例が必ず伴う
- 2: 抽象語のみで終わる段落が1〜2箇所
- 1: 抽象語の羅列で具体性が乏しい

[AD] title_quality（タイトル品質）
- 3: 30字以内 / 検索意図か感情フックを含む / 汎用語で終わらない / 事業者の特徴が透ける / ダッシュ記号（— —— ── ―）を使っていない
- 2: 条件を1〜2個満たさない
- 1: 「〇〇のこだわり」「私たちの想い」などの汎用タイトル / 30字超 / ダッシュ記号で副題をつないでいる（例: 「タイトル——副題」は AI生成の典型サインなので必ず1点）

[AE] excerpt_quality（抜粋品質）
- 3: 150字に「誰の・何の話・読むと何が分かる」が3要素入っている
- 2: 要素のいずれかが弱い
- 1: 機械切り出しに見える / 内容が伝わらない

[AF] structure（構造整合）
- 3: H1が1個 / H2が論理的順序 / 各セクションが一論点
- 2: 論理ジャンプ / 一段落に複数論点
- 1: H1複数か無し / 構造崩壊

[AG] cta（CTA・次の行動）
- 3: 押し売りでない自然な次アクションへの橋渡し
- 2: CTAはあるが押し売り的・唐突・弱い
- 1: CTAなし / 唐突に終わる / 「ぜひお問い合わせください」だけの定型文

[AH] internal_link（内部リンク活用）
- 候補が渡されている時のみ採点。渡されていなければ null
- 3: 1〜3件が文脈に合った形で配置
- 2: 候補があるのに使っていない / 不自然な位置
- 1: 候補にないURLを作っている / 全く活用していない

[AI] first_person（一人称統一）
- owner_first_person が指定されている時のみ採点。未指定なら null
- 3: 設定通りに完全統一
- 2: 1〜2箇所で他の一人称が混ざる
- 1: 複数箇所で混在

[AJ] char_count（文字数遵守）
- 3: volume 範囲内 / 2: ±20% 以内 / 1: ±20% 超

【出力形式（JSONのみ。それ以外は出さない）】
{
  "scores": {
    "primary_info": 1〜3の整数,
    "perspective": 1〜3の整数,
    "abstract_density": 1〜3の整数,
    "title_quality": 1〜3の整数,
    "excerpt_quality": 1〜3の整数,
    "structure": 1〜3の整数,
    "cta": 1〜3の整数,
    "internal_link": 1〜3の整数 | null,
    "first_person": 1〜3の整数 | null,
    "char_count": 1〜3の整数
  },
  "weakest_axes": ["primary_info", "cta"],
  "comment": "弱かった点を具体的に1〜2文で（240字以内）"
}

注意:
- スコアは「演出」しない。本当に良かった/悪かったところに正直に
- weakest_axes は 1〜3 軸まで。スコア 2 以下の軸から最も低いものを選ぶ
- comment は具体的な箇所（タイトル文字列、見出し名、段落の一部）を引用すると良い`

const SCORE_KEYS: Array<keyof ArticleSelfReviewScores> = [
  'primary_info',
  'perspective',
  'abstract_density',
  'title_quality',
  'excerpt_quality',
  'structure',
  'cta',
  'internal_link',
  'first_person',
  'char_count',
]

function clamp(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(3, Math.max(1, Math.round(n)))
}

function clampNullable(value: unknown): number | null {
  if (value === null || value === undefined) return null
  return clamp(value, 2)
}

function asString(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function asStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= 40)
    .slice(0, max)
}

function computeTotal(scores: ArticleSelfReviewScores): { total: number; max: number } {
  let total = 0
  let max = 0
  for (const key of SCORE_KEYS) {
    const v = scores[key]
    if (v !== null) {
      total += v
      max += 3
    }
  }
  return { total, max }
}

export async function generateArticleSelfReview(input: {
  client: Anthropic
  articleMarkdown: string
  articleType: 'client' | 'interviewer' | 'conversation'
  volume: 'short' | 'medium' | 'long' | 'pillar'
  audience: string | null
  ownerFirstPerson: string | null
  hasInternalLinkCandidates: boolean
  projectId: string
  userId?: string | null
}): Promise<ArticleSelfReview | null> {
  const headerLines = [
    `articleType: ${input.articleType}`,
    `volume: ${input.volume}`,
    input.audience ? `audience: ${input.audience}` : 'audience: new (default)',
    input.ownerFirstPerson
      ? `owner_first_person: "${input.ownerFirstPerson}"（[AI] 採点対象）`
      : 'owner_first_person: 未設定（[AI] は null にする）',
    input.hasInternalLinkCandidates
      ? '内部リンク候補: 渡されている（[AH] 採点対象）'
      : '内部リンク候補: なし（[AH] は null にする）',
  ]

  const userMessage = `以下は完了直後の生成記事です。10軸で採点してください。

--- 記事メタ ---
${headerLines.join('\n')}

--- 記事本文（Markdown） ---
${input.articleMarkdown}
--- 本文ここまで ---

JSONで採点を出してください。`

  let response
  try {
    response = await input.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      temperature: 0.2,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: userMessage }],
    })
  } catch (err) {
    console.error('[article-self-review] Anthropic error:', err)
    return null
  }

  logApiUsage({
    userId: input.userId ?? undefined,
    projectId: input.projectId,
    route: 'article/self-review',
    model: 'claude-haiku-4-5-20251001',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }).catch(() => {})

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const jsonText = extractJsonBlock(rawText)
  if (!jsonText) {
    console.error('[article-self-review] no JSON in response', { rawTextHead: rawText.slice(0, 120) })
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    console.error('[article-self-review] JSON parse failed', { jsonHead: jsonText.slice(0, 120) })
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null

  const o = parsed as Record<string, unknown>
  const scoresIn = (o.scores ?? {}) as Record<string, unknown>

  const scores: ArticleSelfReviewScores = {
    primary_info: clamp(scoresIn.primary_info, 2),
    perspective: clamp(scoresIn.perspective, 2),
    abstract_density: clamp(scoresIn.abstract_density, 2),
    title_quality: clamp(scoresIn.title_quality, 2),
    excerpt_quality: clamp(scoresIn.excerpt_quality, 2),
    structure: clamp(scoresIn.structure, 2),
    cta: clamp(scoresIn.cta, 2),
    internal_link: input.hasInternalLinkCandidates
      ? clamp(scoresIn.internal_link, 2)
      : clampNullable(null),
    first_person: input.ownerFirstPerson
      ? clamp(scoresIn.first_person, 2)
      : clampNullable(null),
    char_count: clamp(scoresIn.char_count, 2),
  }

  const { total, max } = computeTotal(scores)
  const weakest_axes = asStringArray(o.weakest_axes, 3)
    .filter((axis) => SCORE_KEYS.includes(axis as keyof ArticleSelfReviewScores))
  const comment = asString(o.comment, 240)

  return {
    scores,
    total,
    total_max: max,
    weakest_axes,
    comment,
  }
}
