/**
 * lib/interview-state.ts のユニットテスト
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getInterviewThemeCount,
  buildArticleCountByInterview,
  getInterviewFlags,
  getInterviewManagementHref,
  type InterviewStateSource,
} from '../lib/interview-state'

// ---- getInterviewThemeCount ----

test('getInterviewThemeCount: 有効なテーマ数を返す', () => {
  assert.equal(getInterviewThemeCount(['テーマA', 'テーマB', 'テーマC']), 3)
})

test('getInterviewThemeCount: null は 0 を返す', () => {
  assert.equal(getInterviewThemeCount(null), 0)
})

test('getInterviewThemeCount: 空配列は 0 を返す', () => {
  assert.equal(getInterviewThemeCount([]), 0)
})

test('getInterviewThemeCount: 空白のみの項目はカウントしない', () => {
  assert.equal(getInterviewThemeCount(['テーマA', '   ', '']), 1)
})

// ---- buildArticleCountByInterview ----

test('buildArticleCountByInterview: interview_id ごとの記事数を集計する', () => {
  const articles = [
    { interview_id: 'i1' },
    { interview_id: 'i1' },
    { interview_id: 'i2' },
  ]
  const { articleCountByInterview } = buildArticleCountByInterview(articles)
  assert.equal(articleCountByInterview.get('i1'), 2)
  assert.equal(articleCountByInterview.get('i2'), 1)
})

test('buildArticleCountByInterview: interview_id が null の記事はスキップ', () => {
  const articles = [{ interview_id: null }, { interview_id: 'i1' }]
  const { articleCountByInterview, articleInterviewIds } = buildArticleCountByInterview(articles)
  assert.equal(articleCountByInterview.get('i1'), 1)
  assert.ok(!articleInterviewIds.has(''))
})

test('buildArticleCountByInterview: 空配列はそれぞれ空を返す', () => {
  const { articleInterviewIds, articleCountByInterview } = buildArticleCountByInterview([])
  assert.equal(articleInterviewIds.size, 0)
  assert.equal(articleCountByInterview.size, 0)
})

// ---- getInterviewFlags ----

function makeInterview(overrides: Partial<InterviewStateSource> = {}): InterviewStateSource {
  return {
    id: 'iv1',
    project_id: 'p1',
    status: null,
    summary: null,
    themes: null,
    ...overrides,
  }
}

test('getInterviewFlags: summary があれば hasSummary=true', () => {
  const interview = makeInterview({ summary: '要約テキスト' })
  const { hasSummary } = getInterviewFlags(interview, new Map())
  assert.equal(hasSummary, true)
})

test('getInterviewFlags: status=completed でも hasSummary=true', () => {
  const interview = makeInterview({ status: 'completed' })
  const { hasSummary } = getInterviewFlags(interview, new Map())
  assert.equal(hasSummary, true)
})

test('getInterviewFlags: summary/status なしは hasSummary=false', () => {
  const interview = makeInterview()
  const { hasSummary } = getInterviewFlags(interview, new Map())
  assert.equal(hasSummary, false)
})

test('getInterviewFlags: 記事あり → hasArticle=true', () => {
  const interview = makeInterview({ id: 'iv1' })
  const countMap = new Map([['iv1', 2]])
  const { hasArticle, articleCount } = getInterviewFlags(interview, countMap)
  assert.equal(hasArticle, true)
  assert.equal(articleCount, 2)
})

test('getInterviewFlags: テーマ数 > 記事数 → hasUncreatedThemes=true', () => {
  const interview = makeInterview({ id: 'iv1', themes: ['テーマA', 'テーマB', 'テーマC'] })
  const countMap = new Map([['iv1', 1]])
  const { hasUncreatedThemes } = getInterviewFlags(interview, countMap)
  assert.equal(hasUncreatedThemes, true)
})

test('getInterviewFlags: テーマ数 ≤ 記事数 → hasUncreatedThemes=false', () => {
  const interview = makeInterview({ id: 'iv1', themes: ['テーマA'] })
  const countMap = new Map([['iv1', 1]])
  const { hasUncreatedThemes } = getInterviewFlags(interview, countMap)
  assert.equal(hasUncreatedThemes, false)
})

// ---- getInterviewManagementHref ----

test('getInterviewManagementHref: hasSummary なら summary ページ', () => {
  const interview = makeInterview({ id: 'iv1', project_id: 'p1', summary: 'ある' })
  const href = getInterviewManagementHref(interview, new Map())
  assert.ok(href.includes('/projects/p1/summary'))
})

test('getInterviewManagementHref: summary/article なしはインタビューページ', () => {
  const interview = makeInterview({ id: 'iv1', project_id: 'p1' })
  const href = getInterviewManagementHref(interview, new Map())
  assert.ok(href.includes('/projects/p1/interview'))
})

test('getInterviewManagementHref: from=dashboard なら &from=dashboard が付く', () => {
  const interview = makeInterview({ id: 'iv1', project_id: 'p1', summary: 'ある' })
  const href = getInterviewManagementHref(interview, new Map(), 'dashboard')
  assert.ok(href.includes('from=dashboard'))
})

test('getInterviewManagementHref: from=project なら from=dashboard は付かない', () => {
  const interview = makeInterview({ id: 'iv1', project_id: 'p1', summary: 'ある' })
  const href = getInterviewManagementHref(interview, new Map(), 'project')
  assert.ok(!href.includes('from=dashboard'))
})
