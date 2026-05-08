/**
 * lib/plans.ts の getPlanLimits ユニットテスト
 * 実行: npx tsx --test __tests__/plans.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getPlanLimits, PLANS, getJstMonthStartIso, getJstMonthKey } from '../lib/plans'

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

test('lightning プランの月次記事上限は 10（取材5回 × 2）', () => {
  const limits = getPlanLimits('lightning')
  assert.equal(limits.monthlyArticleLimit, 10)
})

test('personal プランの月次インタビュー上限は 15', () => {
  const limits = getPlanLimits('personal')
  assert.equal(limits.monthlyInterviewLimit, 15)
})

test('personal プランの月次記事上限は 30（取材15回 × 2）', () => {
  const limits = getPlanLimits('personal')
  assert.equal(limits.monthlyArticleLimit, 30)
})

test('business プランの月次インタビュー上限は 60', () => {
  const limits = getPlanLimits('business')
  assert.equal(limits.monthlyInterviewLimit, 60)
})

test('business プランの月次記事上限は 180（取材60回 × 3）', () => {
  const limits = getPlanLimits('business')
  assert.equal(limits.monthlyArticleLimit, 180)
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

test('getJstMonthStartIso は JST 月初を ISO（UTC 表記）で返す', () => {
  // JST 2026-05-15 03:00 (= UTC 2025-05-14 18:00) における月初は JST 2026-05-01 00:00 = UTC 2026-04-30T15:00:00.000Z
  const now = new Date('2026-05-14T18:00:00.000Z')
  assert.equal(getJstMonthStartIso(now), '2026-04-30T15:00:00.000Z')
})

test('getJstMonthStartIso は UTC 末日でも JST の月でグルーピングする', () => {
  // UTC 2026-04-30 23:30 → JST 2026-05-01 08:30 → 月初は JST 2026-05-01 00:00 = UTC 2026-04-30T15:00:00.000Z
  const now = new Date('2026-04-30T23:30:00.000Z')
  assert.equal(getJstMonthStartIso(now), '2026-04-30T15:00:00.000Z')
})

test('getJstMonthStartIso は JST 月初直後でも当月扱いする', () => {
  // UTC 2026-05-31 16:00 → JST 2026-06-01 01:00 → 月初は JST 2026-06-01 00:00 = UTC 2026-05-31T15:00:00.000Z
  const now = new Date('2026-05-31T16:00:00.000Z')
  assert.equal(getJstMonthStartIso(now), '2026-05-31T15:00:00.000Z')
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

test('getJstMonthKey は JST の YYYY-MM を返す', () => {
  // JST 2026-05-15 03:00 → '2026-05'
  const now = new Date('2026-05-14T18:00:00.000Z')
  assert.equal(getJstMonthKey(now), '2026-05')
})

test('getJstMonthKey は UTC 末日でも JST の月キーを返す', () => {
  // UTC 2026-04-30 23:30 → JST 2026-05-01 08:30 → '2026-05'
  const now = new Date('2026-04-30T23:30:00.000Z')
  assert.equal(getJstMonthKey(now), '2026-05')
})

test('getJstMonthKey は UTC 月初でも JST がまだ前月なら前月キーを返す', () => {
  // UTC 2026-05-01 00:30 → JST 2026-05-01 09:30 → '2026-05'
  // UTC 2026-05-01 14:30 → JST 2026-05-01 23:30 → '2026-05'
  // UTC 2026-04-30 14:30 → JST 2026-04-30 23:30 → '2026-04'
  const now = new Date('2026-04-30T14:30:00.000Z')
  assert.equal(getJstMonthKey(now), '2026-04')
})
