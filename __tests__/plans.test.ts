/**
 * lib/plans.ts の getPlanLimits ユニットテスト
 * 実行: npx tsx --test __tests__/plans.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getPlanLimits, PLANS } from '../lib/plans'

test('free プランは生涯インタビュー上限 2 を持つ', () => {
  const limits = getPlanLimits('free')
  assert.equal(limits.lifetimeInterviewLimit, 2)
})

test('free プランは生涯記事上限 3 を持つ', () => {
  const limits = getPlanLimits('free')
  assert.equal(limits.lifetimeArticleLimit, 3)
})

test('free プランの最大取材先数は 1', () => {
  const limits = getPlanLimits('free')
  assert.equal(limits.maxProjects, 1)
})

test('free プランの競合調査数は 0', () => {
  const limits = getPlanLimits('free')
  assert.equal(limits.maxCompetitorsPerProject, 0)
})

test('lightning プランは生涯上限を持たない（null）', () => {
  const limits = getPlanLimits('lightning')
  assert.equal(limits.lifetimeInterviewLimit, null)
  assert.equal(limits.lifetimeArticleLimit, null)
})

test('lightning プランの月次インタビュー上限は 5', () => {
  const limits = getPlanLimits('lightning')
  assert.equal(limits.monthlyInterviewLimit, 5)
})

test('lightning プランの月次記事上限は 20', () => {
  const limits = getPlanLimits('lightning')
  assert.equal(limits.monthlyArticleLimit, 20)
})

test('personal プランの月次インタビュー上限は 15', () => {
  const limits = getPlanLimits('personal')
  assert.equal(limits.monthlyInterviewLimit, 15)
})

test('business プランの月次インタビュー上限は 60', () => {
  const limits = getPlanLimits('business')
  assert.equal(limits.monthlyInterviewLimit, 60)
})

test('business プランは最大 3 取材先', () => {
  const limits = getPlanLimits('business')
  assert.equal(limits.maxProjects, 3)
})

test('business プランは取材先ごとに競合 3 社', () => {
  const limits = getPlanLimits('business')
  assert.equal(limits.maxCompetitorsPerProject, 3)
})

test('null は free プランと同じ扱い', () => {
  const limitsNull = getPlanLimits(null)
  const limitsFree = getPlanLimits('free')
  assert.deepEqual(limitsNull, limitsFree)
})

test('undefined は free プランと同じ扱い', () => {
  const limitsUndefined = getPlanLimits(undefined)
  const limitsFree = getPlanLimits('free')
  assert.deepEqual(limitsUndefined, limitsFree)
})

test('PLANS の全プランに key フィールドが存在する', () => {
  for (const [key, plan] of Object.entries(PLANS)) {
    assert.equal(plan.key, key, `${key} の key フィールドが一致しない`)
  }
})

test('有料プランは全て lifetimeInterviewLimit === null', () => {
  for (const plan of ['lightning', 'personal', 'business'] as const) {
    const limits = getPlanLimits(plan)
    assert.equal(
      limits.lifetimeInterviewLimit,
      null,
      `${plan} の lifetimeInterviewLimit は null であるべき`,
    )
  }
})
