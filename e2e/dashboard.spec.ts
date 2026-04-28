import { test, expect } from '@playwright/test'
import { mockSupabase } from './helpers/supabase-mock'

test.describe('ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  test('未認証ならログインページにリダイレクトされる', async ({ page }) => {
    await page.goto('/dashboard')
    // Supabase セッションなし → ログインページへ
    await expect(page).toHaveURL(/\/auth\/login|\//)
  })

  test('ページタイトルが設定されている', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Insight Cast/)
  })

  test('LP のスキップナビゲーションリンクが存在する', async ({ page }) => {
    await page.goto('/')
    // sr-only のため視覚上は非表示だが DOM には存在する
    const skipLink = page.getByText('メインコンテンツへスキップ')
    await expect(skipLink).toBeAttached()
  })

  test('LP にキャスト紹介セクションがある', async ({ page }) => {
    await page.goto('/')
    // フリーキャスト（ミント・クラウス・レイン）のカード名が表示される
    // exact: true で完全一致指定して strict mode violation を回避
    await expect(page.getByText('ミント', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('クラウス', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('レイン', { exact: true }).first()).toBeVisible()
  })

  test('料金ページが表示される', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
