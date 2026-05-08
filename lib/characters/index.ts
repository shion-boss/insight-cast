// Public API for @/lib/characters.
// 既存呼び出しコードの import を変えずに済むよう、ここから全シンボルを再エクスポートする。
//
// ファイル分割の責務：
// - data.ts             : Character 型・CHARACTERS 配列・データヘルパー
// - personas.ts         : CharacterPersona 型・CHARACTER_PERSONAS・共通ルール
// - cast-talk-voice.ts  : Cast Talk 生成プロンプト用の派生コンテキスト
// - instructions.ts     : 取材・Cast Talk 共通の長文インストラクション定数
// - prompt-builder.ts   : 取材システムプロンプトの組み立てと辞書
//
// 改訂手順は `.claude/skills/character-persona-feedback-loop/SKILL.md` を参照。

export type { Character } from './data'
export { CHARACTERS, getCharacter, getCastName, getCharacterIntro, getPublicCastIconUrl } from './data'

export type { CharacterPersona } from './personas'
export {
  CHARACTER_PERSONAS,
  getCharacterPersona,
  SHARED_INTERVIEW_RULES,
  SHARED_PROHIBITIONS,
} from './personas'

export type { CastTalkVoice } from './cast-talk-voice'
export {
  CAST_TALK_VOICE,
  buildCastTalkVoiceContext,
  buildCastTalkReactionsContext,
  buildCastTalkFactIntegrityContext,
} from './cast-talk-voice'

export {
  PRIVACY_SCOPE_INSTRUCTION,
  INTERVIEW_SCOPE_INSTRUCTION,
  SUFFICIENCY_INSTRUCTION,
  IDENTITY_INSTRUCTION,
  INSIGHT_CAST_KNOWLEDGE_INSTRUCTION,
  CONVERSATION_QUALITY_INSTRUCTION,
  RELATIONSHIP_INSTRUCTION,
  PSYCHOLOGY_INSTRUCTION,
  FACT_INTEGRITY_INSTRUCTION,
  INTERVIEW_TECHNIQUE_INSTRUCTION,
  CAST_TALK_FACT_INTEGRITY_INSTRUCTION,
  CAST_TALK_INSIGHT_CAST_KNOWLEDGE_INSTRUCTION,
} from './instructions'

export { buildInterviewSystemPrompt, SYSTEM_PROMPTS } from './prompt-builder'
