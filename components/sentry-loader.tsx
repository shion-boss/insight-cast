'use client'

import { useEffect } from 'react'

// Sentry SDK を `@sentry/nextjs` から **dynamic import** で読み込む Client
// Component。tool / admin layout でのみ mount することで、marketing pages
// の初期 JS バンドルに 408 KB raw / 125 KiB gzip の Sentry chunk が
// 含まれないようにする（Lighthouse の Script Evaluation 削減に直結）。
//
// 動作:
//  1. 認証済みエリアの layout でこの Component が mount される
//  2. useEffect 内で `requestIdleCallback`（fallback `setTimeout`）後に
//     dynamic import 開始
//  3. webpack が `@sentry/nextjs` を別 chunk に分離 → 必要な時だけ取得
//  4. SDK 取得後に `Sentry.init()` を呼んで error/breadcrumb/tracing を
//     立ち上げる
//
// Trade-off:
//  - 初回 paint〜idle 後 init までのごく短時間に発生したエラーは取りこぼす
//  - 自動ルート遷移 trace（onRouterTransitionStart 経由）を失う
//  - tool 側はユーザーが操作を始める前に init される想定（timeout 4 秒）
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

export default function SentryLoader() {
  useEffect(() => {
    if (!dsn) return
    if (process.env.NODE_ENV !== 'production') return

    let cancelled = false

    const loadAndInit = () => {
      if (cancelled) return
      void import('@sentry/nextjs').then((Sentry) => {
        if (cancelled) return
        Sentry.init({
          dsn,
          environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
          // Performance 計測は本番のみ 10%
          tracesSampleRate: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 0.1 : 0,
          // Replay 系は使わない（個人情報を含むため）
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0,
          // ブレッドクラムの URL クエリパラメータをマスクして PII 漏洩を防ぐ
          beforeBreadcrumb(breadcrumb) {
            if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
              const to = String(breadcrumb.data.to)
              try {
                const url = new URL(to, 'https://insight-cast.jp')
                for (const k of Array.from(url.searchParams.keys())) {
                  url.searchParams.set(k, '[redacted]')
                }
                breadcrumb.data = { ...breadcrumb.data, to: url.pathname + url.search }
              } catch {
                // ignore
              }
            }
            return breadcrumb
          },
        })
      }).catch(() => {
        // 取得失敗時はサイレントに諦める（marketing 動線を阻害しない）
      })
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadAndInit, { timeout: 4000 })
    } else {
      setTimeout(loadAndInit, 2000)
    }

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
