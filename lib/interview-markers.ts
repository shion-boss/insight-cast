// インタビュー応答に含まれる制御マーカーの判定・除去ヘルパー。
//
// 背景:
//   AI 出力にマーカー（[YESNO_QUESTION] / [INTERVIEW_COMPLETE] / [DISCOVERY: ...] 等）を
//   付けさせて、UI 側で条件分岐や DB 保存に使う。
//
//   ただし AI は完全にフォーマットを守るとは限らず、以下のような揺れが観測される:
//     - 全角ブラケット      : ［YESNO_QUESTION］
//     - 区切り文字の違い    : [YES NO QUESTION] / [YES-NO-QUESTION] / [YES_NO_QUESTION]
//     - 連結               : [YESNOQUESTION]
//     - 前後の空白         : [ YESNO_QUESTION ]
//
//   厳密 regex (`\[YESNO_QUESTION\]`) だと取りこぼして bubble にマーカー文字列がそのまま
//   見えてしまう。ここでは現実的な揺れを吸収する緩めの regex を共通化して、ext / 通常側で
//   同じ挙動になるようにする。
//
//   これは「AI に正しく出させる」ことの代わりではなく、AI が外したときに UX が壊れない
//   ためのフォールバック。system prompt 側でも厳密に指示し続けること。

const OPEN = '[\\[\\uff3b]'  // 半角 [ + 全角 ［
const CLOSE = '[\\]\\uff3d]' // 半角 ] + 全角 ］
const SEP = '[_\\s\\-\\u30fc]?' // アンダースコア / 半角スペース / ハイフン / 長音記号、いずれも省略可

const YESNO_RE = new RegExp(`${OPEN}\\s*YES${SEP}NO${SEP}QUESTION\\s*${CLOSE}`, 'gi')
const COMPLETE_RE = new RegExp(`${OPEN}\\s*INTERVIEW${SEP}COMPLETE\\s*${CLOSE}`, 'gi')
const DISCOVERY_RE = new RegExp(`${OPEN}\\s*DISCOVERY\\s*:\\s*([^\\]\\uff3d]+)${CLOSE}`, 'i')
const DRAFT_RE = new RegExp(`${OPEN}\\s*DRAFT${SEP}PROPOSAL\\s*:\\s*([^\\]\\uff3d]+)${CLOSE}`, 'i')
const HEADLINE_RE = new RegExp(`${OPEN}\\s*HEADLINE${SEP}CANDIDATES\\s*:\\s*([^\\]\\uff3d]+)${CLOSE}`, 'i')

const DISCOVERY_RE_GLOBAL = new RegExp(`${OPEN}\\s*DISCOVERY\\s*:[^\\]\\uff3d]+${CLOSE}`, 'gi')
const DRAFT_RE_GLOBAL = new RegExp(`${OPEN}\\s*DRAFT${SEP}PROPOSAL\\s*:[^\\]\\uff3d]+${CLOSE}`, 'gi')
const HEADLINE_RE_GLOBAL = new RegExp(`${OPEN}\\s*HEADLINE${SEP}CANDIDATES\\s*:[^\\]\\uff3d]+${CLOSE}`, 'gi')

export function hasYesnoMarker(text: string): boolean {
  // RegExp に g フラグ付きの場合は test の lastIndex を毎回リセットしたいので新規生成して使う。
  return new RegExp(YESNO_RE.source, 'i').test(text)
}

export function hasInterviewCompleteMarker(text: string): boolean {
  return new RegExp(COMPLETE_RE.source, 'i').test(text)
}

export function extractDiscoveryReason(text: string): string | null {
  const m = text.match(DISCOVERY_RE)
  return m ? m[1].trim().slice(0, 80) : null
}

export function extractDraftProposalSnippet(text: string): string | null {
  const m = text.match(DRAFT_RE)
  return m ? m[1].trim().slice(0, 200) : null
}

export function extractHeadlineCandidatesSource(text: string): string | null {
  const m = text.match(HEADLINE_RE)
  return m ? m[1].trim().slice(0, 200) : null
}

/**
 * インタビュー応答からすべての制御マーカーを除去する。
 * UI 表示用テキストや DB 保存用 cleanText を作るときに使う。
 */
export function stripInterviewMarkers(text: string): string {
  return text
    .replace(COMPLETE_RE, '')
    .replace(DISCOVERY_RE_GLOBAL, '')
    .replace(DRAFT_RE_GLOBAL, '')
    .replace(HEADLINE_RE_GLOBAL, '')
    .replace(YESNO_RE, '')
    .trim()
}

/**
 * AI が [INTERVIEW_COMPLETE] と一緒に「---」区切りでまとめ本文まで書いてしまった場合の防御。
 * `\n---\n` 以降のテキストを切り落として、終了提案文だけ残す。
 *
 * 実例（モグロが12回目で出力した例）:
 *   ここで一度、お話をまとめてもよいでしょうか。十分な内容が集まりました。続けたい場合はそのままお話しください。
 *   ---
 *   今回聞かせていただいたのは、〜（数百文字のまとめ本文）
 *
 *   → 「---」以降の総括ブロックは別の社内AIが後工程で書く設計なので、bubble には不要。
 *
 * interviewComplete 検出時にだけ呼ぶこと（通常会話のリテラルな「---」を誤爆しないため）。
 */
export function stripPostCompletionSummary(text: string): string {
  return text.replace(/\n\s*-{3,}[\s\S]*$/, '').trim()
}
