/**
 * 全ページスクリーンショットスクリプト
 * 実行: npm run screenshot
 * 前提: ローカルで `npm run dev` が起動済み（BASE_URL=http://localhost:3000）
 *
 * ツール側ページの撮影には以下の環境変数が必要:
 *   SCREENSHOT_EMAIL=<メールアドレス>
 *   SCREENSHOT_PASSWORD=<パスワード>
 */

import { config } from 'dotenv'
import { chromium, type BrowserContext } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

// 公開ページ（認証不要）
const PUBLIC_PAGES = [
  '/',
  '/service',
  '/cast',
  '/pricing',
  '/about',
  '/philosophy',
  '/faq',
  '/contact',
  '/blog',
  '/cast-talk',
  '/privacy',
  '/terms',
  '/tokushoho',
]

// 認証ページ（認証不要）
const AUTH_PAGES = [
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
]

// ツール側（ログイン必須）
const TOOL_PAGES = [
  '/dashboard',
  '/projects',
  '/projects/new',
  '/interviews',
  '/articles',
  '/settings',
  '/settings/billing',
]

// 管理画面（admin権限必須）
const ADMIN_PAGES = [
  '/admin',
  '/admin/cast-talk',
  '/admin/posts',
  '/admin/users',
]

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1280, height: 900 },
} as const

type ViewportKey = keyof typeof VIEWPORTS

// URL → slug 変換
function toSlug(url: string): string {
  if (url === '/') return 'home'
  return url.replace(/^\//, '').replace(/\//g, '_')
}

// 日付フォルダ
function dateDir(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

async function screenshotPage(
  context: BrowserContext,
  pagePath: string,
  outputDir: string,
  viewport: ViewportKey,
): Promise<{ success: boolean; error?: string }> {
  const page = await context.newPage()
  const slug = toSlug(pagePath)
  const filePath = path.join(outputDir, viewport, `${slug}.png`)

  try {
    const response = await page.goto(`${BASE_URL}${pagePath}`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    })

    // 4xx / 5xx はエラー扱い（リダイレクト後の結果で判定）
    const status = response?.status() ?? 0
    if (status >= 400) {
      return { success: false, error: `HTTP ${status}` }
    }

    // レイアウトシフト落ち着き待ち
    await page.waitForTimeout(500)

    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    await page.screenshot({ path: filePath, fullPage: true })

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  } finally {
    await page.close()
  }
}

async function capturePages(
  context: BrowserContext,
  pages: string[],
  outputDir: string,
  viewport: ViewportKey,
): Promise<{ success: number; failure: number }> {
  let success = 0
  let failure = 0

  for (const pagePath of pages) {
    const result = await screenshotPage(context, pagePath, outputDir, viewport)
    if (result.success) {
      success++
      console.log(`  [OK] ${viewport.padEnd(7)} ${pagePath}`)
    } else {
      failure++
      console.warn(`  [NG] ${viewport.padEnd(7)} ${pagePath} — ${result.error}`)
    }
  }

  return { success, failure }
}

async function login(
  context: BrowserContext,
  email: string,
  password: string,
): Promise<boolean> {
  const page = await context.newPage()
  try {
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 30_000 })
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    // ダッシュボードへのリダイレクト待ち（最大 15 秒）
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15_000 })
    return true
  } catch (err) {
    console.error(`  ログイン失敗: ${err}`)
    return false
  } finally {
    await page.close()
  }
}

async function main() {
  const browser = await chromium.launch()
  const outputDir = path.join('screenshots', dateDir())

  let totalSuccess = 0
  let totalFailure = 0

  // --- 公開・認証ページ ---
  console.log('\n公開ページ / 認証ページを撮影します...')

  const allPublic = [...PUBLIC_PAGES, ...AUTH_PAGES]
  for (const viewport of Object.keys(VIEWPORTS) as ViewportKey[]) {
    const context = await browser.newContext({ viewport: VIEWPORTS[viewport] })
    const result = await capturePages(context, allPublic, outputDir, viewport)
    totalSuccess += result.success
    totalFailure += result.failure
    await context.close()
  }

  // --- ツール側ページ（要ログイン）---
  const email = process.env.SCREENSHOT_EMAIL
  const password = process.env.SCREENSHOT_PASSWORD

  if (!email || !password) {
    console.log('\nログイン情報未設定のためツール側ページをスキップします。')
    console.log('  撮影するには SCREENSHOT_EMAIL と SCREENSHOT_PASSWORD を設定してください。')
  } else {
    console.log('\nツール側ページを撮影します...')

    for (const viewport of Object.keys(VIEWPORTS) as ViewportKey[]) {
      const context = await browser.newContext({ viewport: VIEWPORTS[viewport] })

      const loggedIn = await login(context, email, password)
      if (!loggedIn) {
        console.warn(`  [${viewport}] ログインに失敗したためツール側ページをスキップします。`)
        totalFailure += TOOL_PAGES.length + ADMIN_PAGES.length
        await context.close()
        continue
      }

      const toolResult = await capturePages(context, TOOL_PAGES, outputDir, viewport)
      totalSuccess += toolResult.success
      totalFailure += toolResult.failure

      console.log(`\n管理画面を撮影します... [${viewport}]`)
      const adminResult = await capturePages(context, ADMIN_PAGES, outputDir, viewport)
      totalSuccess += adminResult.success
      totalFailure += adminResult.failure

      await context.close()
    }
  }

  await browser.close()

  console.log(`\n撮影完了: ${totalSuccess}件成功、${totalFailure}件失敗`)
  console.log(`保存先: ${path.resolve(outputDir)}`)
}

main().catch((err) => {
  console.error('スクリーンショットスクリプトが異常終了しました:', err)
  process.exit(1)
})
