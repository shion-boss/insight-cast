import { test, expect } from '@playwright/test'
import { mockSupabase } from './helpers/supabase-mock'

test.describe('ログインフロー', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
    await expect(page.getByLabel('メールアドレス')).toBeVisible()
    // パスワードフィールドは label 要素の for 属性で参照している
    await expect(page.locator('#login-password')).toBeVisible()
  })

  test('メールアドレス未入力でsubmitするとブラウザバリデーションが動く', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: 'ログインする' }).click()
    // HTML5 required validation — フォームは送信されない。メールフィールドにフォーカスが戻る
    const emailInput = page.getByLabel('メールアドレス')
    await expect(emailInput).toBeFocused()
  })

  test('スキップナビゲーションリンクが存在する', async ({ page }) => {
    await page.goto('/auth/login')
    // sr-only のため視覚上は非表示だが DOM には存在する
    const skipLink = page.getByText('メインコンテンツへスキップ')
    await expect(skipLink).toBeAttached()
  })

  test('新規登録リンクが存在する', async ({ page }) => {
    await page.goto('/auth/login')
    const signupLink = page.getByRole('link', { name: '新規登録' })
    await expect(signupLink).toBeVisible()
  })
})
