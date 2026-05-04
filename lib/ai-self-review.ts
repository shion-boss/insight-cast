import Anthropic from '@anthropic-ai/sdk'

import { extractJsonBlock, formatConversationForPrompt, type PromptConversationMessage } from '@/lib/ai-quality'

export type AiSelfReview = {
  overall_score: number
  character_score: number
  question_quality_score: number
  enjoyment_score: number
  good_points: string
  improve_points: string
}

const SYSTEM_PROMPT = `あなたはInsight CastのAIキャストの教育担当です。
取材を行ったAIキャスト本人の代理として、いま終わった取材を客観的に自己採点してください。
これは品質改善のためのフィードバックループに使われるので、辛口でも構いませんが、根拠を必ず示してください。

評価軸（すべて 1〜5 の整数）:
- overall_score: 全体としてどう感じたか（記事化材料が取れたか、相手の負担が大きすぎなかったか の総合）
- character_score: キャラの人格・口調・観点が崩れていなかったか
- question_quality_score: 問いが答えやすく、抽象に流れず、専門ラベルに沿っていたか
- enjoyment_score: 相手が「また話したい」と感じる温度の会話だったか

【出力形式（JSON のみ。それ以外は出さない）】
{
  "overall_score": 1〜5の整数,
  "character_score": 1〜5の整数,
  "question_quality_score": 1〜5の整数,
  "enjoyment_score": 1〜5の整数,
  "good_points": "ここは深掘りできた / ここは具体材料が取れた などの具体例（120文字以内）",
  "improve_points": "ここは抽象的に流した / ここで誘導してしまった / 同じ問いを言い換えてしまった などの具体例（160文字以内）"
}

注意:
- スコアは「演出」しない。本当に良かった/悪かったところに正直に
- good_points / improve_points は具体的なターン番号やフレーズを引用すると良い
- 取材が3ターン未満で終わった場合は overall_score を3以下にする`

const USER_PROMPT_HEADER = `以下は完了した取材の会話履歴です。
このAIキャストの取材を自己採点してください。`

function clamp(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(5, Math.max(1, Math.round(n)))
}

function asString(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

/**
 * 完了した取材の会話履歴を Claude に渡し、AI 自己採点を JSON で返してもらう。
 * 失敗時は null を返す（呼び出し側でフォールバック）。
 */
export async function generateAiSelfReview(input: {
  client: Anthropic
  castName: string
  castSpecialty: string
  focusTheme: string | null
  messages: PromptConversationMessage[]
}): Promise<{ review: AiSelfReview; usage: { inputTokens: number; outputTokens: number } } | null> {
  const conversation = formatConversationForPrompt(input.messages, {
    userLabel: '事業者',
    assistantLabel: input.castName,
    maxMessageLength: 600,
  })

  const focusLine = input.focusTheme ? `今回の取材テーマ: ${input.focusTheme}\n` : ''
  const userMessage = `${USER_PROMPT_HEADER}\n\n取材を担当したキャスト: ${input.castName}（専門: ${input.castSpecialty}）\n${focusLine}\n--- 会話 ---\n${conversation}\n--- 会話ここまで ---\n\n上記を踏まえて、JSONで自己採点を出してください。`

  let response
  try {
    response = await input.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      temperature: 0.2,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: userMessage }],
    })
  } catch (err) {
    console.error('[ai-self-review] Anthropic error:', err)
    return null
  }

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const jsonText = extractJsonBlock(rawText)
  if (!jsonText) {
    console.error('[ai-self-review] no JSON in response', { rawTextHead: rawText.slice(0, 120) })
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    console.error('[ai-self-review] JSON parse failed', { jsonHead: jsonText.slice(0, 120) })
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null

  const o = parsed as Record<string, unknown>
  const review: AiSelfReview = {
    overall_score: clamp(o.overall_score, 3),
    character_score: clamp(o.character_score, 3),
    question_quality_score: clamp(o.question_quality_score, 3),
    enjoyment_score: clamp(o.enjoyment_score, 3),
    good_points: asString(o.good_points, 200),
    improve_points: asString(o.improve_points, 240),
  }

  return {
    review,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  }
}
