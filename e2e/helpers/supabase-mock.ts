import type { Page } from '@playwright/test'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://mock.supabase.co'

/**
 * Supabase REST / Auth エンドポイントをインターセプトしてモックレスポンスを返す。
 * 各テストの最初に呼ぶ。
 */
export async function mockSupabase(page: Page) {
  // Auth: セッション取得（localStorage に Supabase セッションが保存されているか確認するリクエスト）
  await page.route(`${SUPABASE_URL}/auth/v1/user`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'authenticated',
        app_metadata: { provider: 'email' },
        user_metadata: { name: 'テストユーザー' },
        aud: 'authenticated',
      }),
    })
  })

  // Auth: メール+パスワードログイン
  await page.route(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'authenticated',
        },
      }),
    })
  })

  // プロフィール取得
  await page.route(`${SUPABASE_URL}/rest/v1/profiles*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 'test-user-id',
        name: 'テストユーザー',
        plan: 'free',
        notification_preferences: {},
        avatar_url: null,
      }]),
    })
  })

  // プロジェクト一覧
  await page.route(`${SUPABASE_URL}/rest/v1/projects*`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'project-1',
          user_id: 'test-user-id',
          name: 'テスト株式会社',
          hp_url: 'https://example.com',
          created_at: '2026-01-01T00:00:00Z',
        }]),
      })
    } else {
      await route.continue()
    }
  })

  // インタビュー一覧
  await page.route(`${SUPABASE_URL}/rest/v1/interviews*`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'interview-1',
          project_id: 'project-1',
          user_id: 'test-user-id',
          interviewer_type: 'mint',
          status: 'done',
          created_at: '2026-01-01T00:00:00Z',
        }]),
      })
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'interview-new' }]),
      })
    }
  })

  // 記事一覧
  await page.route(`${SUPABASE_URL}/rest/v1/articles*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 'article-1',
        interview_id: 'interview-1',
        project_id: 'project-1',
        title: 'テスト記事タイトル',
        content: '# テスト記事\nこれはテスト記事の内容です。',
        article_type: 'blog',
        created_at: '2026-01-01T00:00:00Z',
      }]),
    })
  })

  // Next.js の内部 API（/api/）はすべて通す
  await page.route('/api/**', async (route) => {
    await route.continue()
  })
}
