/**
 * lib/project-badges.ts のユニットテスト
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getProjectAnalysisBadge, getProjectContentBadge } from '../lib/project-badges'

// ---- getProjectAnalysisBadge ----

test('getProjectAnalysisBadge: analyzing → 調査中 (warning)', () => {
  const badge = getProjectAnalysisBadge('analyzing', false)
  assert.equal(badge.label, '調査中')
  assert.equal(badge.tone, 'warning')
})

test('getProjectAnalysisBadge: report_ready + isReady=true → 調査済み (info)', () => {
  const badge = getProjectAnalysisBadge('report_ready', true)
  assert.equal(badge.label, '調査済み')
  assert.equal(badge.tone, 'info')
})

test('getProjectAnalysisBadge: report_ready + isReady=false → 未調査 (neutral)（ダウングレード）', () => {
  const badge = getProjectAnalysisBadge('report_ready', false)
  assert.equal(badge.label, '未調査')
  assert.equal(badge.tone, 'neutral')
})

test('getProjectAnalysisBadge: analysis_pending → 未調査 (neutral)', () => {
  const badge = getProjectAnalysisBadge('analysis_pending', false)
  assert.equal(badge.label, '未調査')
  assert.equal(badge.tone, 'neutral')
})

test('getProjectAnalysisBadge: interview_ready はロックされる → 未調査扱いでなくなる', () => {
  // interview_ready は LOCKED_STATUSES なので resolveProjectAnalysisStatus はそのまま返す
  // report_ready でなく analyzing でもないので label='未調査' になる
  const badge = getProjectAnalysisBadge('interview_ready', false)
  assert.equal(badge.label, '未調査')
})

// ---- getProjectContentBadge ----

test('getProjectContentBadge: articleCount > 0 → 記事 N本 (success)', () => {
  const badge = getProjectContentBadge({ status: 'interview_done', interviewCount: 1, articleCount: 3 })
  assert.ok(badge !== null)
  assert.ok(badge!.label.includes('3'))
  assert.equal(badge!.tone, 'success')
})

test('getProjectContentBadge: status=article_ready + articleCount=0 → 記事あり (success)', () => {
  const badge = getProjectContentBadge({ status: 'article_ready', interviewCount: 0, articleCount: 0 })
  assert.ok(badge !== null)
  assert.equal(badge!.tone, 'success')
})

test('getProjectContentBadge: interviewCount > 0 → 取材メモあり (neutral)', () => {
  const badge = getProjectContentBadge({ status: 'interview_done', interviewCount: 1, articleCount: 0 })
  assert.ok(badge !== null)
  assert.equal(badge!.label, '取材メモあり')
  assert.equal(badge!.tone, 'neutral')
})

test('getProjectContentBadge: status=interview_done → 取材メモあり (neutral)', () => {
  const badge = getProjectContentBadge({ status: 'interview_done', interviewCount: 0, articleCount: 0 })
  assert.ok(badge !== null)
  assert.equal(badge!.label, '取材メモあり')
})

test('getProjectContentBadge: 何もなし → null', () => {
  const badge = getProjectContentBadge({ status: 'analysis_pending', interviewCount: 0, articleCount: 0 })
  assert.equal(badge, null)
})
