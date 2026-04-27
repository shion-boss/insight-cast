/**
 * lib/ai-quality.ts のユニットテスト
 * 実行: npx tsx --test __tests__/ai-quality.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizePromptText,
  normalizeUniqueStringList,
  formatConversationForPrompt,
  extractJsonBlock,
} from '../lib/ai-quality'

// ---- normalizePromptText ----
test('normalizePromptText: 文字列をそのまま返す', () => {
  assert.equal(normalizePromptText('hello'), 'hello')
})

test('normalizePromptText: 連続スペース・改行を1スペースに正規化する', () => {
  assert.equal(normalizePromptText('hello  \n  world'), 'hello world')
})

test('normalizePromptText: maxLength で切り詰める', () => {
  const result = normalizePromptText('あいうえおかきくけこ', 5)
  assert.equal(result, 'あいうえお')
})

test('normalizePromptText: 非文字列は空文字を返す', () => {
  assert.equal(normalizePromptText(null), '')
  assert.equal(normalizePromptText(undefined), '')
  assert.equal(normalizePromptText(42), '')
})

test('normalizePromptText: 絵文字（サロゲートペア）を1文字として扱う', () => {
  // 🎉 は Unicode U+1F389、サロゲートペアで2コードユニット
  const result = normalizePromptText('🎉hello', 2)
  assert.equal(result, '🎉h')
})

// ---- normalizeUniqueStringList ----
test('normalizeUniqueStringList: 配列の文字列を正規化する', () => {
  const result = normalizeUniqueStringList(['a', 'b', 'c'])
  assert.deepEqual(result, ['a', 'b', 'c'])
})

test('normalizeUniqueStringList: 重複を除去する', () => {
  const result = normalizeUniqueStringList(['apple', 'APPLE', 'apple'])
  assert.equal(result.length, 1)
  assert.equal(result[0], 'apple')
})

test('normalizeUniqueStringList: 先頭の記号（・-*）を削除する', () => {
  const result = normalizeUniqueStringList(['・リスト項目', '- another'])
  assert.equal(result[0], 'リスト項目')
  assert.equal(result[1], 'another')
})

test('normalizeUniqueStringList: maxItems を超えない', () => {
  const result = normalizeUniqueStringList(['a', 'b', 'c', 'd', 'e', 'f'], { maxItems: 3 })
  assert.equal(result.length, 3)
})

test('normalizeUniqueStringList: maxLength で切り詰める', () => {
  const longItem = 'あ'.repeat(200)
  const result = normalizeUniqueStringList([longItem], { maxLength: 10 })
  assert.equal(result[0]!.length, 10)
})

test('normalizeUniqueStringList: 空文字・空白のみの項目はスキップ', () => {
  const result = normalizeUniqueStringList(['', '   ', 'valid'])
  assert.deepEqual(result, ['valid'])
})

test('normalizeUniqueStringList: null はリストを返さない', () => {
  assert.deepEqual(normalizeUniqueStringList(null), [])
})

test('normalizeUniqueStringList: 文字列は改行で分割する', () => {
  const result = normalizeUniqueStringList('item1\nitem2\nitem3')
  assert.deepEqual(result, ['item1', 'item2', 'item3'])
})

// ---- formatConversationForPrompt ----
test('formatConversationForPrompt: user/interviewer メッセージを整形する', () => {
  const messages = [
    { role: 'interviewer' as const, content: '質問です' },
    { role: 'user' as const, content: '回答です' },
  ]
  const result = formatConversationForPrompt(messages)
  assert.ok(result.includes('インタビュアー: 質問です'))
  assert.ok(result.includes('事業者: 回答です'))
})

test('formatConversationForPrompt: カスタムラベルを使用する', () => {
  const messages = [{ role: 'user' as const, content: 'こんにちは' }]
  const result = formatConversationForPrompt(messages, { userLabel: '山田さん' })
  assert.ok(result.includes('山田さん: こんにちは'))
})

test('formatConversationForPrompt: 空のメッセージはスキップ', () => {
  const messages = [
    { role: 'user' as const, content: '' },
    { role: 'user' as const, content: 'valid' },
  ]
  const result = formatConversationForPrompt(messages)
  const lines = result.split('\n\n')
  assert.equal(lines.length, 1)
})

// ---- extractJsonBlock ----
test('extractJsonBlock: JSON オブジェクトを抽出する', () => {
  const result = extractJsonBlock('prefix {"key":"value"} suffix')
  assert.equal(result, '{"key":"value"}')
})

test('extractJsonBlock: JSON がない場合は null を返す', () => {
  assert.equal(extractJsonBlock('no json here'), null)
})

test('extractJsonBlock: ネストした JSON も正しく抽出する', () => {
  const result = extractJsonBlock('text {"outer":{"inner":1}} end')
  assert.equal(result, '{"outer":{"inner":1}}')
})
