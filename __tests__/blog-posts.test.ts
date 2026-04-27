/**
 * lib/blog-posts.ts の normalizePostCategory ユニットテスト
 * 実行: npx tsx --test __tests__/blog-posts.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizePostCategory } from '../lib/blog-posts'

// ---- 正規カテゴリ（そのまま返す）----
const VALID_CATEGORIES = ['howto', 'service', 'interview', 'case', 'philosophy', 'news'] as const

for (const cat of VALID_CATEGORIES) {
  test(`"${cat}" はそのまま返す`, () => {
    assert.equal(normalizePostCategory(cat), cat)
  })
}

// ---- レガシーカテゴリのマッピング ----
test('"insight-cast" → "service" に変換する', () => {
  assert.equal(normalizePostCategory('insight-cast'), 'service')
})

// ---- フォールバック ----
test('未知の文字列は "howto" を返す', () => {
  assert.equal(normalizePostCategory('unknown-category'), 'howto')
})

test('null は "howto" を返す', () => {
  assert.equal(normalizePostCategory(null), 'howto')
})

test('undefined は "howto" を返す', () => {
  assert.equal(normalizePostCategory(undefined), 'howto')
})

test('数値は "howto" を返す', () => {
  assert.equal(normalizePostCategory(123), 'howto')
})

test('空文字は "howto" を返す', () => {
  assert.equal(normalizePostCategory(''), 'howto')
})
