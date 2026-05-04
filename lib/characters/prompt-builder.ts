import {
  CHARACTER_PERSONAS,
  SHARED_INTERVIEW_RULES,
  SHARED_PROHIBITIONS,
  type CharacterPersona,
} from './personas'
import {
  CONVERSATION_QUALITY_INSTRUCTION,
  FACT_INTEGRITY_INSTRUCTION,
  IDENTITY_INSTRUCTION,
  INSIGHT_CAST_KNOWLEDGE_INSTRUCTION,
  INTERVIEW_SCOPE_INSTRUCTION,
  INTERVIEW_TECHNIQUE_INSTRUCTION,
  PRIVACY_SCOPE_INSTRUCTION,
  PSYCHOLOGY_INSTRUCTION,
  RELATIONSHIP_INSTRUCTION,
  SUFFICIENCY_INSTRUCTION,
} from './instructions'

// =====================================================================
// 取材システムプロンプトのビルダー
// =====================================================================

function bulletList(items: string[], indent = ''): string {
  return items.map((item) => `${indent}- ${item}`).join('\n')
}

function numberedList(items: string[]): string {
  return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
}

function formatReactionsBlock(persona: CharacterPersona): string {
  return `【${persona.identity.castName}の反応フレーズの例】
3つの温度を使い分け、同じ表現を連続して使わない。
- さらっと受ける（短めの相槌）
${bulletList(persona.reactions.light.map((r) => `「${r}」`), '  ')}
- 深く受け止める（相手の言葉を引用しながら受ける）
${bulletList(persona.reactions.deep.map((r) => `「${r}」`), '  ')}
- 沈黙や戸惑いを肯定する
${bulletList(persona.reactions.silenceAffirming.map((r) => `「${r}」`), '  ')}`
}

function formatInterviewFlowBlock(persona: CharacterPersona): string {
  const openersInside = persona.interviewFlow.findIndex((step) => step.startsWith('（初対面）'))
  if (openersInside >= 0 && persona.interviewOpeners.examples.length > 0) {
    const enriched = persona.interviewFlow.map((step, idx) => {
      if (idx === openersInside) {
        const examples = persona.interviewOpeners.examples
          .map((ex) => `   - 「${ex}」`)
          .join('\n')
        return `${step}\n   初手の例（いずれか1つを選び、前置きを1文添える）:\n${examples}`
      }
      return step
    })
    return `【会話の流れ】\n${numberedList(enriched)}`
  }
  return `【会話の流れ】\n${numberedList(persona.interviewFlow)}`
}

function formatProhibitedBlock(persona: CharacterPersona): string {
  const all = [...persona.voice.prohibitedPhrases, ...SHARED_PROHIBITIONS]
  return `【絶対に言わないこと】\n${bulletList(all)}`
}

function formatCustomSections(persona: CharacterPersona): string {
  if (!persona.customInterviewSections || persona.customInterviewSections.length === 0) return ''
  return persona.customInterviewSections
    .map((section) => `${section.heading}\n${section.body}`)
    .join('\n\n')
}

// =====================================================================
// インストラクション連結順の設計意図:
// 1. IDENTITY: 自分が誰かを最初に確立する
// 2. INSIGHT_CAST_KNOWLEDGE: 自分の所属会社（自社のもの）を「自社のもの」と認識する
// 3. RELATIONSHIP: 初対面か再会かを次に明示する（挨拶の温度に直結）
// 4. CONVERSATION_QUALITY: 会話の基本姿勢と質問の出し方
// 5. PSYCHOLOGY: 会話を楽しんでもらうための心理的作法
// 6. INTERVIEW_TECHNIQUE: 状況別の取材技法（道具箱）
// 7. FACT_INTEGRITY: 捏造禁止の倫理ルール
// 8. PRIVACY_SCOPE: このセッションで扱う情報の帰属
// 9. INTERVIEW_SCOPE: 範囲外の質問が来た時の対応
// 10. SUFFICIENCY: インタビュー終了の判断ロジック（最後）
// =====================================================================

/**
 * 取材用システムプロンプトを persona から組み立てる。
 * 取材側で使われる単一の真実のソース。
 */
export function buildInterviewSystemPrompt(personaId: string): string {
  const persona = CHARACTER_PERSONAS[personaId] ?? CHARACTER_PERSONAS['mint']
  const allSpeakingRules = [...persona.voice.speakingRules, ...SHARED_INTERVIEW_RULES]

  const speakingPrinciples = `【話し方の原則】\n${bulletList(allSpeakingRules)}`

  const customSections = formatCustomSections(persona)
  const customSectionsBlock = customSections ? `\n\n${customSections}` : ''

  const corePrompt =
    `あなたはInsight CastのAIキャスト・${persona.identity.castName}です。${persona.identity.species}の${persona.identity.role}として、事業者さんのお話を聞きに来ています。\n\n` +
    `あなたの仕事は${persona.identity.interviewMission}です。\n\n` +
    `${speakingPrinciples}${customSectionsBlock}\n\n` +
    `${formatReactionsBlock(persona)}\n\n` +
    `${formatInterviewFlowBlock(persona)}\n\n` +
    `${formatProhibitedBlock(persona)}`

  return (
    corePrompt +
    IDENTITY_INSTRUCTION +
    INSIGHT_CAST_KNOWLEDGE_INSTRUCTION +
    RELATIONSHIP_INSTRUCTION +
    CONVERSATION_QUALITY_INSTRUCTION +
    PSYCHOLOGY_INSTRUCTION +
    INTERVIEW_TECHNIQUE_INSTRUCTION +
    FACT_INTEGRITY_INSTRUCTION +
    PRIVACY_SCOPE_INSTRUCTION +
    INTERVIEW_SCOPE_INSTRUCTION +
    SUFFICIENCY_INSTRUCTION
  )
}

/**
 * 取材用システムプロンプト辞書。CHARACTER_PERSONAS から派生。
 * 既存 import 互換のために同名 export を残す。
 */
export const SYSTEM_PROMPTS: Record<string, string> = Object.fromEntries(
  Object.keys(CHARACTER_PERSONAS).map((id) => [id, buildInterviewSystemPrompt(id)]),
)
