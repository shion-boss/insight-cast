/**
 * lib/notification-preferences.ts の normalizeNotificationPreferences ユニットテスト
 * 実行: npx tsx --test __tests__/notification-preferences.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../lib/notification-preferences'

test('null はデフォルト値を返す', () => {
  assert.deepEqual(normalizeNotificationPreferences(null), DEFAULT_NOTIFICATION_PREFERENCES)
})

test('undefined はデフォルト値を返す', () => {
  assert.deepEqual(normalizeNotificationPreferences(undefined), DEFAULT_NOTIFICATION_PREFERENCES)
})

test('文字列はデフォルト値を返す', () => {
  assert.deepEqual(normalizeNotificationPreferences('invalid'), DEFAULT_NOTIFICATION_PREFERENCES)
})

test('配列はデフォルト値を返す', () => {
  assert.deepEqual(normalizeNotificationPreferences([]), DEFAULT_NOTIFICATION_PREFERENCES)
})

test('完全な有効オブジェクトは元の値を返す', () => {
  const prefs = {
    interviewComplete: false,
    articleReady: false,
    monthlyReport: true,
    productUpdates: false,
  }
  assert.deepEqual(normalizeNotificationPreferences(prefs), prefs)
})

test('一部のフィールドが欠けている場合はデフォルトで補完する', () => {
  const result = normalizeNotificationPreferences({ interviewComplete: false })
  assert.equal(result.interviewComplete, false)
  assert.equal(result.articleReady, DEFAULT_NOTIFICATION_PREFERENCES.articleReady)
  assert.equal(result.monthlyReport, DEFAULT_NOTIFICATION_PREFERENCES.monthlyReport)
  assert.equal(result.productUpdates, DEFAULT_NOTIFICATION_PREFERENCES.productUpdates)
})

test('フィールドが boolean 以外の場合はデフォルトを使う', () => {
  const result = normalizeNotificationPreferences({
    interviewComplete: 'yes',    // 文字列
    articleReady: 1,             // 数値
    monthlyReport: null,         // null
    productUpdates: undefined,   // undefined
  })
  assert.deepEqual(result, DEFAULT_NOTIFICATION_PREFERENCES)
})
