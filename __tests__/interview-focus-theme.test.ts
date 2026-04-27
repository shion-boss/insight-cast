/**
 * lib/interview-focus-theme.ts のユニットテスト
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isInterviewFocusThemeMode,
  normalizeInterviewFocusTheme,
  normalizeCompetitorThemeSummary,
  getInterviewSuggestedThemes,
  getCompetitorInfluentialTopics,
  getInterviewFocusThemeLabel,
  buildInterviewFocusThemeContext,
  INTERVIEW_FOCUS_THEME_MAX_LENGTH,
  COMPETITOR_THEME_SUMMARY_MAX_LENGTH,
} from '../lib/interview-focus-theme'

// ---- isInterviewFocusThemeMode ----

test('isInterviewFocusThemeMode: "omakase" は true', () => {
  assert.equal(isInterviewFocusThemeMode('omakase'), true)
})

test('isInterviewFocusThemeMode: "custom" は true', () => {
  assert.equal(isInterviewFocusThemeMode('custom'), true)
})

test('isInterviewFocusThemeMode: "suggested" は true', () => {
  assert.equal(isInterviewFocusThemeMode('suggested'), true)
})

test('isInterviewFocusThemeMode: 不正な文字列は false', () => {
  assert.equal(isInterviewFocusThemeMode('unknown'), false)
})

test('isInterviewFocusThemeMode: null は false', () => {
  assert.equal(isInterviewFocusThemeMode(null), false)
})

// ---- normalizeInterviewFocusTheme ----

test('normalizeInterviewFocusTheme: 文字列をそのまま返す', () => {
  assert.equal(normalizeInterviewFocusTheme('テーマA'), 'テーマA')
})

test('normalizeInterviewFocusTheme: 連続スペース・改行を1スペースに正規化する', () => {
  assert.equal(normalizeInterviewFocusTheme('テーマ  A\n B'), 'テーマ A B')
})

test('normalizeInterviewFocusTheme: maxLength で切り詰める', () => {
  const longStr = 'あ'.repeat(INTERVIEW_FOCUS_THEME_MAX_LENGTH + 10)
  const result = normalizeInterviewFocusTheme(longStr)
  assert.equal(result.length, INTERVIEW_FOCUS_THEME_MAX_LENGTH)
})

test('normalizeInterviewFocusTheme: 非文字列は空文字を返す', () => {
  assert.equal(normalizeInterviewFocusTheme(null), '')
  assert.equal(normalizeInterviewFocusTheme(42), '')
})

// ---- normalizeCompetitorThemeSummary ----

test('normalizeCompetitorThemeSummary: maxLength で切り詰める', () => {
  const longStr = 'あ'.repeat(COMPETITOR_THEME_SUMMARY_MAX_LENGTH + 10)
  const result = normalizeCompetitorThemeSummary(longStr)
  assert.equal(result.length, COMPETITOR_THEME_SUMMARY_MAX_LENGTH)
})

test('normalizeCompetitorThemeSummary: 非文字列は空文字を返す', () => {
  assert.equal(normalizeCompetitorThemeSummary(undefined), '')
})

// ---- getInterviewSuggestedThemes ----

test('getInterviewSuggestedThemes: 有効なテーマを返す', () => {
  const result = getInterviewSuggestedThemes(['A', 'B', 'C'])
  assert.deepEqual(result, ['A', 'B', 'C'])
})

test('getInterviewSuggestedThemes: 重複を除去する', () => {
  const result = getInterviewSuggestedThemes(['A', 'A', 'B'])
  assert.deepEqual(result, ['A', 'B'])
})

test('getInterviewSuggestedThemes: limit を超えない', () => {
  const result = getInterviewSuggestedThemes(['A', 'B', 'C', 'D', 'E', 'F'], 3)
  assert.equal(result.length, 3)
})

test('getInterviewSuggestedThemes: null は空配列を返す', () => {
  assert.deepEqual(getInterviewSuggestedThemes(null), [])
})

// ---- getCompetitorInfluentialTopics ----

test('getCompetitorInfluentialTopics: null は空配列を返す', () => {
  assert.deepEqual(getCompetitorInfluentialTopics(null), [])
})

test('getCompetitorInfluentialTopics: influential_topics がない場合は空配列', () => {
  assert.deepEqual(getCompetitorInfluentialTopics({}), [])
})

test('getCompetitorInfluentialTopics: 有効なトピックを返す', () => {
  const rawData = {
    influential_topics: [
      { theme: 'SEO対策', summary: 'SEOの解説' },
      { theme: 'コンテンツ', summary: 'コンテンツマーケ' },
    ],
  }
  const result = getCompetitorInfluentialTopics(rawData)
  assert.equal(result.length, 2)
  assert.equal(result[0]?.theme, 'SEO対策')
})

test('getCompetitorInfluentialTopics: theme または summary が空の項目はスキップ', () => {
  const rawData = {
    influential_topics: [
      { theme: '', summary: '要約' },
      { theme: 'テーマ', summary: '' },
      { theme: '有効', summary: '有効な要約' },
    ],
  }
  const result = getCompetitorInfluentialTopics(rawData)
  assert.equal(result.length, 1)
  assert.equal(result[0]?.theme, '有効')
})

test('getCompetitorInfluentialTopics: 重複を除去する', () => {
  const rawData = {
    influential_topics: [
      { theme: 'SEO', summary: '同じ要約' },
      { theme: 'SEO', summary: '同じ要約' },
    ],
  }
  const result = getCompetitorInfluentialTopics(rawData)
  assert.equal(result.length, 1)
})

// ---- getInterviewFocusThemeLabel ----

test('getInterviewFocusThemeLabel: omakase は "テーマ: お任せ"', () => {
  assert.equal(getInterviewFocusThemeLabel('omakase', '何か'), 'テーマ: お任せ')
})

test('getInterviewFocusThemeLabel: custom はテーマ文字列を含む', () => {
  const label = getInterviewFocusThemeLabel('custom', 'SEO対策')
  assert.ok(label?.includes('SEO対策'))
})

test('getInterviewFocusThemeLabel: suggested は "おすすめテーマ:" を含む', () => {
  const label = getInterviewFocusThemeLabel('suggested', 'コンテンツ')
  assert.ok(label?.includes('おすすめテーマ:'))
})

test('getInterviewFocusThemeLabel: 不正なモードは omakase と同じ扱い', () => {
  assert.equal(getInterviewFocusThemeLabel('unknown', 'テーマ'), 'テーマ: お任せ')
})

test('getInterviewFocusThemeLabel: テーマ空文字は null を返す（custom/suggested）', () => {
  assert.equal(getInterviewFocusThemeLabel('custom', ''), null)
})

// ---- buildInterviewFocusThemeContext ----

test('buildInterviewFocusThemeContext: omakase はお任せコンテキストを返す', () => {
  const ctx = buildInterviewFocusThemeContext('omakase', '')
  assert.ok(ctx.includes('テーマはお任せ'))
})

test('buildInterviewFocusThemeContext: custom はテーマを含むコンテキストを返す', () => {
  const ctx = buildInterviewFocusThemeContext('custom', '採用戦略')
  assert.ok(ctx.includes('採用戦略'))
})

test('buildInterviewFocusThemeContext: suggested は "おすすめテーマの中から" を含む', () => {
  const ctx = buildInterviewFocusThemeContext('suggested', '採用戦略')
  assert.ok(ctx.includes('おすすめテーマの中から'))
})

test('buildInterviewFocusThemeContext: テーマ空文字は空文字列を返す（custom）', () => {
  assert.equal(buildInterviewFocusThemeContext('custom', ''), '')
})
