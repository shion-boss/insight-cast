import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

import { extractJsonBlock, formatConversationForPrompt, type PromptConversationMessage } from '@/lib/ai-quality'

export type RespondentProfile = {
  user_id: string
  project_id: string | null
  answer_style: 'concrete' | 'abstract' | 'mixed' | null
  pace: 'fast' | 'slow' | 'normal' | null
  generation: '30s' | '40s' | '50s' | '60s+' | 'unknown' | null
  regional_speech: string | null
  tendency: string | null
  updated_count: number
}

const ANSWER_STYLES = ['concrete', 'abstract', 'mixed'] as const
const PACES = ['fast', 'slow', 'normal'] as const
const GENERATIONS = ['30s', '40s', '50s', '60s+', 'unknown'] as const

const ESTIMATE_SYSTEM_PROMPT = `あなたはInsight Castの教育担当です。
取材を行った相手（事業者）の話し方の傾向を、取材会話だけを根拠に控えめに推定してください。

推定の原則:
- 確証がなければ null を返す。雰囲気での断定はしない
- 短い取材（3ターン未満）では多くを推定しない
- 個人の評価ではなく、次の取材を答えやすくするための「話しかけ方の調整材料」として推定する

【出力形式（JSON のみ）】
{
  "answer_style": "concrete" | "abstract" | "mixed" | null,
  "pace": "fast" | "slow" | "normal" | null,
  "generation": "30s" | "40s" | "50s" | "60s+" | "unknown" | null,
  "regional_speech": "標準語" | "関西" | "東北" などの自由記述 | null,
  "tendency": "数字より感情で語る / 一言が短い / お客様の言葉を引用しがち などの癖（120文字以内、null可）"
}

判断の目安:
- answer_style = concrete: 具体名詞・数字・「」引用が多い
- answer_style = abstract: 「丁寧」「安心」など抽象語で終わる回答が多い
- answer_style = mixed: 両方あり
- pace は1ターンあたりの文字数や反応の速さで推測
- generation: 言葉遣い・敬語の使い方から控えめに推測。確証なければ "unknown"
- regional_speech: 方言が明確に出ていれば。なければ null（標準語と書く必要はない）`

function isAnswerStyle(v: unknown): v is RespondentProfile['answer_style'] {
  return v === null || (typeof v === 'string' && (ANSWER_STYLES as readonly string[]).includes(v))
}
function isPace(v: unknown): v is RespondentProfile['pace'] {
  return v === null || (typeof v === 'string' && (PACES as readonly string[]).includes(v))
}
function isGeneration(v: unknown): v is RespondentProfile['generation'] {
  return v === null || (typeof v === 'string' && (GENERATIONS as readonly string[]).includes(v))
}

type EstimatedProfile = Pick<
  RespondentProfile,
  'answer_style' | 'pace' | 'generation' | 'regional_speech' | 'tendency'
>

/**
 * 完了した取材の会話履歴を Claude に渡し、回答者の傾向を推定する。
 * 失敗時は null を返す（呼び出し側でフォールバック）。
 */
export async function estimateRespondentProfile(input: {
  client: Anthropic
  messages: PromptConversationMessage[]
  castName: string
}): Promise<{ profile: EstimatedProfile; usage: { inputTokens: number; outputTokens: number } } | null> {
  if (input.messages.filter((m) => m.role === 'user').length < 2) {
    // 短すぎる取材は推定しない
    return null
  }

  const conversation = formatConversationForPrompt(input.messages, {
    userLabel: '事業者',
    assistantLabel: input.castName,
    maxMessageLength: 600,
  })

  const userMessage = `以下の取材会話から、事業者（聞かれる側）の話し方の傾向を推定してください。\n\n${conversation}`

  let response
  try {
    response = await input.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      temperature: 0.2,
      system: [
        { type: 'text', text: ESTIMATE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: userMessage }],
    })
  } catch (err) {
    console.error('[respondent-profile] Anthropic error:', err)
    return null
  }

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const jsonText = extractJsonBlock(rawText)
  if (!jsonText) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null

  const o = parsed as Record<string, unknown>
  const profile: EstimatedProfile = {
    answer_style: isAnswerStyle(o.answer_style) ? o.answer_style : null,
    pace: isPace(o.pace) ? o.pace : null,
    generation: isGeneration(o.generation) ? o.generation : null,
    regional_speech: typeof o.regional_speech === 'string' ? o.regional_speech.slice(0, 40) : null,
    tendency: typeof o.tendency === 'string' ? o.tendency.slice(0, 200) : null,
  }

  return {
    profile,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  }
}

/**
 * 既存プロファイルと推定結果をマージして DB に upsert する。
 * 既存の null フィールドは新値で埋める。既存の値があれば優先する（更新は手動）。
 * tendency は last_interview ベースで上書き（最新の傾向を反映）。
 */
export async function upsertRespondentProfile(input: {
  supabase: SupabaseClient
  userId: string
  projectId: string
  estimated: EstimatedProfile
  lastInterviewId: string
}): Promise<void> {
  const { supabase, userId, projectId, estimated, lastInterviewId } = input

  const { data: existing } = await supabase
    .from('respondent_profiles')
    .select('answer_style, pace, generation, regional_speech, tendency, updated_count')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .maybeSingle()

  const merged = {
    user_id: userId,
    project_id: projectId,
    answer_style: existing?.answer_style ?? estimated.answer_style ?? null,
    pace: existing?.pace ?? estimated.pace ?? null,
    generation: existing?.generation ?? estimated.generation ?? null,
    regional_speech: existing?.regional_speech ?? estimated.regional_speech ?? null,
    // tendency は最新を反映（傾向は変わるため）
    tendency: estimated.tendency ?? existing?.tendency ?? null,
    last_interview_id: lastInterviewId,
    updated_count: (existing?.updated_count ?? 0) + 1,
  }

  const { error } = await supabase
    .from('respondent_profiles')
    .upsert(merged, { onConflict: 'user_id,project_id' })
  if (error) {
    console.warn('[respondent-profile] upsert failed:', error.message)
  }
}

/**
 * 取材開始時に該当ユーザー × プロジェクトのプロファイルを取得し、
 * プロンプトに注入する用の文字列に整形する。データがなければ空文字。
 */
export function formatProfileForPrompt(profile: RespondentProfile | null): string {
  if (!profile) return ''
  const lines: string[] = []
  if (profile.answer_style) {
    const map: Record<NonNullable<RespondentProfile['answer_style']>, string> = {
      concrete: '具体的な場面・名前・数字で答えがち（深掘りしやすい）',
      abstract: '抽象語で答えがちな傾向（具体例を引き出す工夫が必要）',
      mixed: '具体と抽象の両方が出る',
    }
    lines.push(`- 回答の傾向: ${map[profile.answer_style]}`)
  }
  if (profile.pace) {
    const map: Record<NonNullable<RespondentProfile['pace']>, string> = {
      fast: 'テンポ速め（短いやり取りが向く）',
      slow: 'ゆっくり（時間を急かさない）',
      normal: '普通',
    }
    lines.push(`- ペース: ${map[profile.pace]}`)
  }
  if (profile.generation && profile.generation !== 'unknown') {
    lines.push(`- 推定世代: ${profile.generation}（用語の難度を相手に合わせる）`)
  }
  if (profile.regional_speech) {
    lines.push(`- 推定地域・方言: ${profile.regional_speech}（自分の口調は変えない、相手の語彙は尊重）`)
  }
  if (profile.tendency) {
    lines.push(`- これまでの傾向: ${profile.tendency}`)
  }
  if (lines.length === 0) return ''
  return `【話し相手の傾向（過去取材から推定。あくまで参考）】\n${lines.join('\n')}\n断定的な扱いはしない。今日の語りと違っていれば今日を優先する。`
}

export async function fetchRespondentProfile(input: {
  supabase: SupabaseClient
  userId: string
  projectId: string
}): Promise<RespondentProfile | null> {
  const { data } = await input.supabase
    .from('respondent_profiles')
    .select('user_id, project_id, answer_style, pace, generation, regional_speech, tendency, updated_count')
    .eq('user_id', input.userId)
    .eq('project_id', input.projectId)
    .maybeSingle()
  return (data as RespondentProfile | null) ?? null
}
