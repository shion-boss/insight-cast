// Next.js が起動時に毎ページで読む client-side instrumentation hook。
//
// Next.js 15 + @sentry/nextjs 10 では、Sentry SDK が
//   `instrumentation-client.ts` から
//   - `Sentry.init({...})` の呼び出し
//   - `export const onRouterTransitionStart = Sentry.captureRouterTransitionStart`
//   の 2 点を期待する契約になっている。
//
// 旧実装はパフォーマンス最適化のために `instrumentation-client.ts` を空 export
// にし、`components/sentry-loader.tsx` で `dynamic import('@sentry/nextjs')`
// を使って tool / admin layout でのみ Sentry を遅延 init していた。
//
// しかしこれだと Next.js Router の transition で
// `instrumentationClientModule.onRouterTransitionStart(...)` を呼ぼうとした際
// 実体が `undefined` のため
//   `TypeError: e[n] is not a function`
// が **unhandled Promise rejection** として発火し続けていた
// （2026-05-09 のモニター監査で /dashboard で集中観測。
//  詳細: ops/incidents/2026-05-09-typeerror-en-not-function.md）。
//
// 公式パターンに戻し、Sentry SDK は `instrumentation-client.ts` で同期 init
// する。Next.js / Sentry のビルド時統合が SDK chunk を適切に分離してくれる
// （marketing pages の First Load JS は若干戻るが、unhandled rejection を
// 止めることを優先する）。
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn && process.env.NODE_ENV === 'production') {
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
}

// Next.js Router の transition を Sentry の Performance Monitoring に流す。
// この export がないと Next.js が `e[n] is not a function` を投げる原因になる。
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
