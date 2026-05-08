/**
 * lib/interview-markers.ts のユニットテスト
 *
 * AI 出力に含まれる制御マーカーは、半角・全角・区切り文字・空白の揺れを吸収する必要がある。
 * 厳密 regex で取りこぼした結果として bubble にマーカー文字列がそのまま出る事故が発生したので、
 * このテストで揺れパターンを固定する。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractDiscoveryReason,
  extractDraftProposalSnippet,
  extractHeadlineCandidatesSource,
  hasInterviewCompleteMarker,
  hasYesnoMarker,
  stripInterviewMarkers,
  stripPostCompletionSummary,
} from '../lib/interview-markers'

// ---- hasYesnoMarker ----

test('hasYesnoMarker: 標準形 [YESNO_QUESTION] を検出する', () => {
  assert.equal(hasYesnoMarker('質問本体？\n[YESNO_QUESTION]'), true)
})

test('hasYesnoMarker: 空白付き [ YESNO_QUESTION ] を検出する', () => {
  assert.equal(hasYesnoMarker('質問？ [ YESNO_QUESTION ]'), true)
})

test('hasYesnoMarker: 全角ブラケット ［YESNO_QUESTION］ を検出する', () => {
  assert.equal(hasYesnoMarker('質問？\n［YESNO_QUESTION］'), true)
})

test('hasYesnoMarker: 区切り文字違い [YES NO QUESTION] を検出する', () => {
  assert.equal(hasYesnoMarker('質問？ [YES NO QUESTION]'), true)
})

test('hasYesnoMarker: 区切り文字違い [YES-NO-QUESTION] を検出する', () => {
  assert.equal(hasYesnoMarker('質問？ [YES-NO-QUESTION]'), true)
})

test('hasYesnoMarker: 連結 [YESNOQUESTION] を検出する', () => {
  assert.equal(hasYesnoMarker('質問？ [YESNOQUESTION]'), true)
})

test('hasYesnoMarker: 大文字小文字混在 [yesno_question] を検出する', () => {
  assert.equal(hasYesnoMarker('質問？ [yesno_question]'), true)
})

test('hasYesnoMarker: マーカーが含まれないテキストは false', () => {
  assert.equal(hasYesnoMarker('普通の質問文です。'), false)
})

// ---- hasInterviewCompleteMarker ----

test('hasInterviewCompleteMarker: 標準形を検出する', () => {
  assert.equal(hasInterviewCompleteMarker('まとめます。[INTERVIEW_COMPLETE]'), true)
})

test('hasInterviewCompleteMarker: 全角ブラケットを検出する', () => {
  assert.equal(hasInterviewCompleteMarker('まとめます。［INTERVIEW_COMPLETE］'), true)
})

test('hasInterviewCompleteMarker: 区切り違い [INTERVIEW COMPLETE] を検出する', () => {
  assert.equal(hasInterviewCompleteMarker('まとめます。 [INTERVIEW COMPLETE]'), true)
})

test('hasInterviewCompleteMarker: マーカーがないテキストは false', () => {
  assert.equal(hasInterviewCompleteMarker('まだ続きます。'), false)
})

// ---- stripInterviewMarkers ----

test('stripInterviewMarkers: 全マーカーを除去する', () => {
  const input = '質問本体？\n[YESNO_QUESTION]\n[INTERVIEW_COMPLETE]\n[DISCOVERY: 理由]\n[DRAFT_PROPOSAL: 抜粋]\n[HEADLINE_CANDIDATES: 候補]'
  assert.equal(stripInterviewMarkers(input), '質問本体？')
})

test('stripInterviewMarkers: 全角ブラケット版でも除去する', () => {
  const input = '質問？\n［YESNO_QUESTION］'
  assert.equal(stripInterviewMarkers(input), '質問？')
})

test('stripInterviewMarkers: 区切り文字違いも除去する', () => {
  const input = '質問？ [YES NO QUESTION] [INTERVIEW COMPLETE]'
  assert.equal(stripInterviewMarkers(input), '質問？')
})

test('stripInterviewMarkers: マーカーがなければそのまま返す', () => {
  assert.equal(stripInterviewMarkers('  普通のテキストです。  '), '普通のテキストです。')
})

// ---- extractDiscoveryReason ----

test('extractDiscoveryReason: 標準形から抽出', () => {
  assert.equal(extractDiscoveryReason('応答 [DISCOVERY: 価値X が見えた]'), '価値X が見えた')
})

test('extractDiscoveryReason: 区切り文字違いでも抽出', () => {
  // DISCOVERY 自体に区切り文字はないが、ブラケットの揺れに対応できているか
  assert.equal(extractDiscoveryReason('応答 ［DISCOVERY: 価値Y］'), '価値Y')
})

test('extractDiscoveryReason: マーカーなしは null', () => {
  assert.equal(extractDiscoveryReason('普通のテキスト'), null)
})

test('extractDiscoveryReason: 80文字で切る', () => {
  const longReason = 'あ'.repeat(100)
  const result = extractDiscoveryReason(`[DISCOVERY: ${longReason}]`)
  assert.equal(result?.length, 80)
})

// ---- extractDraftProposalSnippet ----

test('extractDraftProposalSnippet: 標準形から抽出', () => {
  assert.equal(extractDraftProposalSnippet('応答 [DRAFT_PROPOSAL: 文案サンプル]'), '文案サンプル')
})

test('extractDraftProposalSnippet: 区切り違い [DRAFT PROPOSAL: ...] でも抽出', () => {
  assert.equal(extractDraftProposalSnippet('[DRAFT PROPOSAL: 文案]'), '文案')
})

// ---- extractHeadlineCandidatesSource ----

test('extractHeadlineCandidatesSource: 標準形から抽出', () => {
  assert.equal(extractHeadlineCandidatesSource('[HEADLINE_CANDIDATES: 候補A / 候補B]'), '候補A / 候補B')
})

// ---- stripPostCompletionSummary ----

test('stripPostCompletionSummary: --- 以降のまとめ本文を切り落とす', () => {
  const input = `ここで一度、お話をまとめてもよいでしょうか。続けたい場合はそのままお話しください。

---

今回聞かせていただいたのは、挨拶文を冒頭に加えるという工夫の話でした。`
  assert.equal(
    stripPostCompletionSummary(input),
    'ここで一度、お話をまとめてもよいでしょうか。続けたい場合はそのままお話しください。',
  )
})

test('stripPostCompletionSummary: --- が無ければそのまま返す', () => {
  const input = '通常の質問文ですね？'
  assert.equal(stripPostCompletionSummary(input), '通常の質問文ですね？')
})

test('stripPostCompletionSummary: ハイフン4本以上にも対応', () => {
  const input = '提案文。\n----\n総括テキスト'
  assert.equal(stripPostCompletionSummary(input), '提案文。')
})
