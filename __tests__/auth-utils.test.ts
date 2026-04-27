/**
 * lib/auth-utils.server.ts のユニットテスト
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { checkIsAdmin } from '../lib/auth-utils.server'

const ORIGINAL_ADMIN_EMAILS = process.env.ADMIN_EMAILS

before(() => {
  process.env.ADMIN_EMAILS = 'admin@example.com, super@example.com'
})

after(() => {
  if (ORIGINAL_ADMIN_EMAILS === undefined) {
    delete process.env.ADMIN_EMAILS
  } else {
    process.env.ADMIN_EMAILS = ORIGINAL_ADMIN_EMAILS
  }
})

test('checkIsAdmin: 登録済みメールアドレスは true', () => {
  assert.equal(checkIsAdmin('admin@example.com'), true)
})

test('checkIsAdmin: スペースのある登録済みメールアドレスも true', () => {
  assert.equal(checkIsAdmin('super@example.com'), true)
})

test('checkIsAdmin: 未登録メールアドレスは false', () => {
  assert.equal(checkIsAdmin('user@example.com'), false)
})

test('checkIsAdmin: null は false', () => {
  assert.equal(checkIsAdmin(null), false)
})

test('checkIsAdmin: undefined は false', () => {
  assert.equal(checkIsAdmin(undefined), false)
})

test('checkIsAdmin: 空文字は false', () => {
  assert.equal(checkIsAdmin(''), false)
})

test('checkIsAdmin: 大文字小文字は区別する（完全一致）', () => {
  assert.equal(checkIsAdmin('Admin@example.com'), false)
})
