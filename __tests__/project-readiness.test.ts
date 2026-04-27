/**
 * lib/analysis/project-readiness.ts のユニットテスト
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveProjectAnalysisStatus } from '../lib/analysis/project-readiness'

// ---- resolveProjectAnalysisStatus ----

test('report_ready かつ isReady=true はそのまま report_ready', () => {
  assert.equal(resolveProjectAnalysisStatus('report_ready', true), 'report_ready')
})

test('report_ready かつ isReady=false は analysis_pending にダウングレード', () => {
  assert.equal(resolveProjectAnalysisStatus('report_ready', false), 'analysis_pending')
})

test('analysis_pending かつ isReady=true は report_ready にアップグレード', () => {
  assert.equal(resolveProjectAnalysisStatus('analysis_pending', true), 'report_ready')
})

test('analysis_pending かつ isReady=false はそのまま analysis_pending', () => {
  assert.equal(resolveProjectAnalysisStatus('analysis_pending', false), 'analysis_pending')
})

test('analyzing はロックされない（isReady=true でも analyzing のまま）', () => {
  assert.equal(resolveProjectAnalysisStatus('analyzing', true), 'analyzing')
})

// ロックされるステータス（isReady に関わらず変わらない）
const LOCKED = ['interview_ready', 'interview_done', 'article_generating', 'article_ready', 'fetch_failed'] as const

for (const status of LOCKED) {
  test(`${status} はロックされる（isReady=true でも変わらない）`, () => {
    assert.equal(resolveProjectAnalysisStatus(status, true), status)
  })

  test(`${status} はロックされる（isReady=false でも変わらない）`, () => {
    assert.equal(resolveProjectAnalysisStatus(status, false), status)
  })
}
