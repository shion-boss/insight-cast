/**
 * lib/blog-posts.ts の normalizePostCategory ユニットテスト
 * 実行: npx tsx --test __tests__/blog-posts.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizePostCategory } from '../lib/blog-posts'

// 2026-05-07 カテゴリ再設計後の正規 5 系統
const VALID_CATEGORIES = ['ai-search', 'primary-info', 'casts', 'hp-update', 'meta'] as const

for (const cat of VALID_CATEGORIES) {
  test(`"${cat}" はそのまま返す`, () => {
    assert.equal(normalizePostCategory(cat), cat)
  })
}

// ---- レガシーカテゴリのマッピング（2026-05-07 以前のデータ向け安全弁）----
test('"insight-cast" → "casts" に変換する', () => {
  assert.equal(normalizePostCategory('insight-cast'), 'casts')
})

test('"service" → "casts" に変換する', () => {
  assert.equal(normalizePostCategory('service'), 'casts')
})

test('"howto" → "hp-update" に変換する', () => {
  assert.equal(normalizePostCategory('howto'), 'hp-update')
})

test('"interview" → "meta" に変換する', () => {
  assert.equal(normalizePostCategory('interview'), 'meta')
})

test('"case" → "hp-update" に変換する', () => {
  assert.equal(normalizePostCategory('case'), 'hp-update')
})

test('"philosophy" → "primary-info" に変換する', () => {
  assert.equal(normalizePostCategory('philosophy'), 'primary-info')
})

test('"news" → "meta" に変換する', () => {
  assert.equal(normalizePostCategory('news'), 'meta')
})

// ---- フォールバック: 不明値は "meta" を返す ----
test('未知の文字列は "meta" を返す', () => {
  assert.equal(normalizePostCategory('unknown-category'), 'meta')
})

test('null は "meta" を返す', () => {
  assert.equal(normalizePostCategory(null), 'meta')
})

test('undefined は "meta" を返す', () => {
  assert.equal(normalizePostCategory(undefined), 'meta')
})

test('数値は "meta" を返す', () => {
  assert.equal(normalizePostCategory(123), 'meta')
})

test('空文字は "meta" を返す', () => {
  assert.equal(normalizePostCategory(''), 'meta')
})
