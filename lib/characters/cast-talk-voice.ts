// =====================================================================
// Cast Talk 口調定義（CHARACTER_PERSONAS から派生）
// =====================================================================
//
// 旧 CAST_TALK_VOICE は 2026-05-04 から CHARACTER_PERSONAS の voice フィールドから派生する。
// Cast Talk 生成プロンプトはこの voice を参照することで、取材人格と同じ口調を保つ。
// 新規追加・口調変更は CHARACTER_PERSONAS 側で行うこと。

import { getCharacter } from './data'
import { CHARACTER_PERSONAS, getCharacterPersona } from './personas'

export type CastTalkVoice = {
  /** 一人称（「私」「僕」など） */
  firstPerson: string
  /** 代表的な語尾・話し方の特徴 */
  speechStyle: string
  /** Cast Talk 内で使わない言葉 */
  prohibited: string[]
}

const CAST_TALK_COMMON_PROHIBITED = ['だよね', 'じゃん', 'AIとして', '生成します', '処理します']

export const CAST_TALK_VOICE: Record<string, CastTalkVoice> = Object.fromEntries(
  Object.values(CHARACTER_PERSONAS).map((persona) => [
    persona.id,
    {
      firstPerson: persona.voice.firstPerson,
      speechStyle: `${persona.voice.tone.replace(/で$/, '')}。${persona.voice.speechStyle}`,
      prohibited: CAST_TALK_COMMON_PROHIBITED,
    },
  ]),
)

/**
 * Cast Talk 生成プロンプト用に、登場キャスト分の口調定義を文字列化して返す。
 * 登場しないキャストの定義を混入させないために、castIds で絞る。
 */
export function buildCastTalkVoiceContext(castIds: string[]): string {
  const lines: string[] = []
  for (const id of castIds) {
    const voice = CAST_TALK_VOICE[id]
    const character = getCharacter(id)
    if (!voice || !character) continue
    lines.push(
      `【${character.name}（${character.species}）】`,
      `- 一人称: ${voice.firstPerson}`,
      `- 話し方: ${voice.speechStyle}`,
      `- 使わない言葉: ${voice.prohibited.join('・')}`,
    )
  }
  return lines.join('\n')
}

/**
 * Cast Talk 生成プロンプト用に、登場キャストの反応フレーズ（3段階）を文字列化して返す。
 * 取材で導入した「相槌の温度3段階」を Cast Talk にも波及させるための関数。
 * cast_talk_reviews の指摘 A（相槌減少・楽しさ不足）への対応。
 */
export function buildCastTalkReactionsContext(castIds: string[]): string {
  const lines: string[] = []
  for (const id of castIds) {
    const persona = getCharacterPersona(id)
    const character = getCharacter(id)
    if (!persona || !character) continue
    lines.push(
      `【${character.name} の反応の温度】`,
      '会話中、相手のセリフを受けるときは以下の3段階を使い分ける（同じ温度を連続させない）:',
      `- さらっと受ける: ${persona.reactions.light.map((r) => `「${r}」`).join(' / ')}`,
      `- 深く受け止める（相手の言葉を引用しながら）: ${persona.reactions.deep.map((r) => `「${r}」`).join(' / ')}`,
      `- 沈黙や戸惑いを肯定する: ${persona.reactions.silenceAffirming.map((r) => `「${r}」`).join(' / ')}`,
      '',
    )
  }
  return lines.join('\n').trimEnd()
}

/**
 * Cast Talk 生成プロンプト用に、登場キャスト分の事実性ルール（捏造禁止）を文字列化して返す。
 * cast_talk_reviews の指摘 D（実績捏造）への対応。
 */
export function buildCastTalkFactIntegrityContext(castIds: string[]): string {
  const lines: string[] = ['【事実性のルール（全キャスト共通）】']
  lines.push(
    '- 自社（Insight Cast）の実績・数値として語る内容は、実際に起きたことのみを使う',
    '- 「訪問者が○倍になった」「問い合わせが○件増えた」などの具体的な数値は、実データに基づかない限り使わない',
    '- 一般的な傾向・業界知識として語る場合は「〜という傾向があるようです」「〜と言われています」のように根拠の所在を明示する',
    '- 読者が「事実として受け取る」書き方で架空の成果を出さない',
    '',
  )
  for (const id of castIds) {
    const persona = getCharacterPersona(id)
    const character = getCharacter(id)
    if (!persona || !character) continue
    lines.push(`【${character.name} の事実性】`, `- ${persona.factIntegrity.rule}`)
    if (persona.factIntegrity.examplesNG.length > 0) {
      lines.push(`- 避ける書き方の例: ${persona.factIntegrity.examplesNG.join(' / ')}`)
    }
  }
  return lines.join('\n')
}
