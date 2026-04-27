/**
 * lib/analysis/cache.ts のユニットテスト
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAnalysisUrl, buildProjectAnalysisSignature } from '../lib/analysis/cache'

// ---- normalizeAnalysisUrl ----

test('normalizeAnalysisUrl: https URL はそのまま正規化する', () => {
  const result = normalizeAnalysisUrl('https://example.com/')
  assert.equal(result, 'https://example.com/')
})

test('normalizeAnalysisUrl: http:// なし URL には https:// を付ける', () => {
  const result = normalizeAnalysisUrl('example.com')
  assert.ok(result.startsWith('https://'))
})

test('normalizeAnalysisUrl: ホスト名を小文字にする', () => {
  const result = normalizeAnalysisUrl('https://EXAMPLE.COM/')
  assert.ok(result.includes('example.com'))
})

test('normalizeAnalysisUrl: 末尾スラッシュを除去する（パスがある場合）', () => {
  const result = normalizeAnalysisUrl('https://example.com/path/')
  assert.ok(!result.endsWith('/') || result === 'https://example.com/')
})

test('normalizeAnalysisUrl: フラグメント (#) を除去する', () => {
  const result = normalizeAnalysisUrl('https://example.com/page#section')
  assert.ok(!result.includes('#'))
})

test('normalizeAnalysisUrl: 空文字は空文字を返す', () => {
  assert.equal(normalizeAnalysisUrl(''), '')
})

test('normalizeAnalysisUrl: スペースのみは空文字を返す', () => {
  assert.equal(normalizeAnalysisUrl('   '), '')
})

// ---- buildProjectAnalysisSignature ----

test('buildProjectAnalysisSignature: 同じ入力で同じハッシュを返す', () => {
  const sig1 = buildProjectAnalysisSignature({
    hpUrl: 'https://example.com',
    competitorUrls: ['https://comp1.com', 'https://comp2.com'],
  })
  const sig2 = buildProjectAnalysisSignature({
    hpUrl: 'https://example.com',
    competitorUrls: ['https://comp1.com', 'https://comp2.com'],
  })
  assert.equal(sig1, sig2)
})

test('buildProjectAnalysisSignature: 競合URLの順序が違っても同じハッシュ（ソートされる）', () => {
  const sig1 = buildProjectAnalysisSignature({
    hpUrl: 'https://example.com',
    competitorUrls: ['https://comp1.com', 'https://comp2.com'],
  })
  const sig2 = buildProjectAnalysisSignature({
    hpUrl: 'https://example.com',
    competitorUrls: ['https://comp2.com', 'https://comp1.com'],
  })
  assert.equal(sig1, sig2)
})

test('buildProjectAnalysisSignature: 異なる hpUrl は異なるハッシュを返す', () => {
  const sig1 = buildProjectAnalysisSignature({ hpUrl: 'https://a.com', competitorUrls: [] })
  const sig2 = buildProjectAnalysisSignature({ hpUrl: 'https://b.com', competitorUrls: [] })
  assert.notEqual(sig1, sig2)
})

test('buildProjectAnalysisSignature: 競合URLが増えると異なるハッシュ', () => {
  const sig1 = buildProjectAnalysisSignature({
    hpUrl: 'https://example.com',
    competitorUrls: ['https://comp1.com'],
  })
  const sig2 = buildProjectAnalysisSignature({
    hpUrl: 'https://example.com',
    competitorUrls: ['https://comp1.com', 'https://comp2.com'],
  })
  assert.notEqual(sig1, sig2)
})

test('buildProjectAnalysisSignature: 返り値は hex 文字列（64文字のSHA256）', () => {
  const sig = buildProjectAnalysisSignature({ hpUrl: 'https://example.com', competitorUrls: [] })
  assert.match(sig, /^[0-9a-f]{64}$/)
})
