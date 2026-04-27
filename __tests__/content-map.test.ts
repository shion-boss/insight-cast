/**
 * lib/content-map.ts のユニットテスト
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getStoredClassifications,
  buildContentMatrix,
  buildClassificationSummary,
  GENRES,
  EFFECTS,
  type ClassifiedPost,
} from '../lib/content-map'

// ---- getStoredClassifications ----

test('getStoredClassifications: null は null を返す', () => {
  assert.equal(getStoredClassifications(null), null)
})

test('getStoredClassifications: blog_classifications がない場合は null', () => {
  assert.equal(getStoredClassifications({}), null)
})

test('getStoredClassifications: 空配列は null を返す（未分類扱い）', () => {
  assert.equal(getStoredClassifications({ blog_classifications: [] }), null)
})

test('getStoredClassifications: 有効な分類を返す', () => {
  const rawData = {
    blog_classifications: [
      { url: 'https://example.com', title: 'テスト', genre: 'howto', effect: 'discovery', source: 'existing' },
    ],
  }
  const result = getStoredClassifications(rawData)
  assert.ok(result !== null)
  assert.equal(result!.length, 1)
  assert.equal(result![0]!.genre, 'howto')
})

test('getStoredClassifications: 不正な genre はスキップ', () => {
  const rawData = {
    blog_classifications: [
      { url: 'https://example.com', title: '有効', genre: 'howto', effect: 'discovery', source: 'existing' },
      { url: 'https://example.com/2', title: '不正', genre: 'invalid_genre', effect: 'discovery', source: 'existing' },
    ],
  }
  const result = getStoredClassifications(rawData)
  assert.ok(result !== null)
  assert.equal(result!.length, 1)
})

test('getStoredClassifications: 不正な effect はスキップ', () => {
  const rawData = {
    blog_classifications: [
      { url: 'https://example.com', title: '有効', genre: 'howto', effect: 'discovery', source: 'existing' },
      { url: 'https://example.com/2', title: '不正', genre: 'howto', effect: 'invalid_effect', source: 'existing' },
    ],
  }
  const result = getStoredClassifications(rawData)
  assert.ok(result !== null)
  assert.equal(result!.length, 1)
})

test('getStoredClassifications: insight_cast source も有効', () => {
  const rawData = {
    blog_classifications: [
      { url: 'https://example.com', title: 'テスト', genre: 'case_study', effect: 'trust', source: 'insight_cast' },
    ],
  }
  const result = getStoredClassifications(rawData)
  assert.ok(result !== null)
  assert.equal(result![0]!.source, 'insight_cast')
})

// ---- buildContentMatrix ----

const SAMPLE_POSTS: ClassifiedPost[] = [
  { url: 'https://a.com', title: 'A', genre: 'howto', effect: 'discovery', source: 'existing' },
  { url: 'https://b.com', title: 'B', genre: 'howto', effect: 'trust', source: 'existing' },
  { url: 'https://c.com', title: 'C', genre: 'case_study', effect: 'trust', source: 'insight_cast' },
]

test('buildContentMatrix: 全 genre × effect の行列を構築する', () => {
  const matrix = buildContentMatrix(SAMPLE_POSTS)
  // 全 genre キーが存在する
  for (const genre of GENRES) {
    assert.ok(genre.key in matrix, `${genre.key} が matrix に存在しない`)
    for (const effect of EFFECTS) {
      assert.ok(effect.key in matrix[genre.key]!, `${genre.key}.${effect.key} が存在しない`)
    }
  }
})

test('buildContentMatrix: 正しいセルに投稿が入る', () => {
  const matrix = buildContentMatrix(SAMPLE_POSTS)
  assert.equal(matrix['howto']!['discovery']!.length, 1)
  assert.equal(matrix['howto']!['trust']!.length, 1)
  assert.equal(matrix['case_study']!['trust']!.length, 1)
  assert.equal(matrix['story']!['discovery']!.length, 0)
})

test('buildContentMatrix: 空配列でも全セルが空配列', () => {
  const matrix = buildContentMatrix([])
  for (const genre of GENRES) {
    for (const effect of EFFECTS) {
      assert.deepEqual(matrix[genre.key]![effect.key], [])
    }
  }
})

// ---- buildClassificationSummary ----

test('buildClassificationSummary: total は投稿数', () => {
  const summary = buildClassificationSummary(SAMPLE_POSTS)
  assert.equal(summary.total, 3)
})

test('buildClassificationSummary: byEffect はカウント降順でフィルタ済み', () => {
  const summary = buildClassificationSummary(SAMPLE_POSTS)
  // discovery: 1件, trust: 2件 → trust が先
  assert.equal(summary.byEffect[0]!.key, 'trust')
  assert.equal(summary.byEffect[0]!.count, 2)
  // count=0 の effect は含まれない
  for (const entry of summary.byEffect) {
    assert.ok(entry.count > 0)
  }
})

test('buildClassificationSummary: byGenre はカウント降順でフィルタ済み', () => {
  const summary = buildClassificationSummary(SAMPLE_POSTS)
  // howto: 2件, case_study: 1件 → howto が先
  assert.equal(summary.byGenre[0]!.key, 'howto')
  assert.equal(summary.byGenre[0]!.count, 2)
})

test('buildClassificationSummary: 空配列は total=0 かつ空の配列', () => {
  const summary = buildClassificationSummary([])
  assert.equal(summary.total, 0)
  assert.deepEqual(summary.byEffect, [])
  assert.deepEqual(summary.byGenre, [])
})
