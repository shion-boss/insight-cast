/**
 * lib/firecrawl.ts の isSafeUrl ユニットテスト
 * 実行: npx tsx --test __tests__/firecrawl.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSafeUrl } from '../lib/firecrawl'

// ---- 有効URL（true を期待）----
test('https の公開ドメインは許可する', () => {
  assert.equal(isSafeUrl('https://example.com'), true)
})

test('サブドメイン付き https は許可する', () => {
  assert.equal(isSafeUrl('https://www.example.co.jp'), true)
})

test('パス付き https は許可する', () => {
  assert.equal(isSafeUrl('https://example.com/page?foo=bar'), true)
})

// ---- プロトコル違反（false を期待）----
test('http は拒否する', () => {
  assert.equal(isSafeUrl('http://example.com'), false)
})

test('ftp は拒否する', () => {
  assert.equal(isSafeUrl('ftp://example.com'), false)
})

test('プロトコルなしは拒否する', () => {
  assert.equal(isSafeUrl('example.com'), false)
})

test('空文字は拒否する', () => {
  assert.equal(isSafeUrl(''), false)
})

// ---- SSRF 対策：プライベートIP（false を期待）----
test('localhost は拒否する', () => {
  assert.equal(isSafeUrl('https://localhost'), false)
})

test('127.0.0.1 は拒否する', () => {
  assert.equal(isSafeUrl('https://127.0.0.1'), false)
})

test('127.x.x.x 系は拒否する', () => {
  assert.equal(isSafeUrl('https://127.0.0.100'), false)
})

test('10.x.x.x は拒否する', () => {
  assert.equal(isSafeUrl('https://10.0.0.1'), false)
})

test('192.168.x.x は拒否する', () => {
  assert.equal(isSafeUrl('https://192.168.1.1'), false)
})

test('172.16.x.x〜172.31.x.x は拒否する', () => {
  assert.equal(isSafeUrl('https://172.16.0.1'), false)
  assert.equal(isSafeUrl('https://172.31.255.255'), false)
})

test('172.15.x.x（プライベート範囲外）は許可する', () => {
  assert.equal(isSafeUrl('https://172.15.0.1'), true)
})

test('172.32.x.x（プライベート範囲外）は許可する', () => {
  assert.equal(isSafeUrl('https://172.32.0.1'), true)
})

test('::1（IPv6 loopback）は拒否する', () => {
  assert.equal(isSafeUrl('https://[::1]'), false)
})

test('0.0.0.0 は拒否する', () => {
  assert.equal(isSafeUrl('https://0.0.0.0'), false)
})
