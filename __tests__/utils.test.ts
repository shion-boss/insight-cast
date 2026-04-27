/**
 * lib/utils.ts のユニットテスト
 * 実行: npx tsx --test __tests__/utils.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isRecord, parseJsonObject } from '../lib/utils'

// ---- isRecord ----
test('isRecord: 空のオブジェクト {} は true', () => {
  assert.equal(isRecord({}), true)
})

test('isRecord: キーを持つオブジェクトは true', () => {
  assert.equal(isRecord({ a: 1, b: 'two' }), true)
})

test('isRecord: null は false', () => {
  assert.equal(isRecord(null), false)
})

test('isRecord: 配列は false', () => {
  assert.equal(isRecord([1, 2, 3]), false)
})

test('isRecord: 文字列は false', () => {
  assert.equal(isRecord('string'), false)
})

test('isRecord: 数値は false', () => {
  assert.equal(isRecord(42), false)
})

test('isRecord: undefined は false', () => {
  assert.equal(isRecord(undefined), false)
})

// ---- parseJsonObject ----
test('parseJsonObject: 有効な JSON オブジェクト文字列をパースする', () => {
  const result = parseJsonObject('{"key":"value","num":42}')
  assert.deepEqual(result, { key: 'value', num: 42 })
})

test('parseJsonObject: テキストに埋め込まれた JSON を抽出する', () => {
  const result = parseJsonObject('some text {"extracted":true} more text')
  assert.deepEqual(result, { extracted: true })
})

test('parseJsonObject: ネストした JSON をパースする', () => {
  const result = parseJsonObject('{"outer":{"inner":"value"}}')
  assert.deepEqual(result, { outer: { inner: 'value' } })
})

test('parseJsonObject: 無効な JSON は null を返す', () => {
  assert.equal(parseJsonObject('{invalid json}'), null)
})

test('parseJsonObject: JSON オブジェクトがない文字列は null を返す', () => {
  assert.equal(parseJsonObject('no json here'), null)
})

test('parseJsonObject: 空文字は null を返す', () => {
  assert.equal(parseJsonObject(''), null)
})

test('parseJsonObject: JSON 配列はオブジェクトでないため null を返す', () => {
  // [1,2,3] は {} にマッチしない
  assert.equal(parseJsonObject('[1,2,3]'), null)
})
