// Sentry initialization for the browser.
// Next.js 15.3+ の規約に従い instrumentation-client.ts で命名。
// 旧 sentry.client.config.ts は v15.3+ で auto-loaded されない。
//
// 環境変数 NEXT_PUBLIC_SENTRY_DSN が未設定の場合は Sentry を初期化しない
// （ローカル開発・PR プレビュー等のノイズ送信を防ぐ）。
//
// init() の呼び出しは `requestIdleCallback`（fallback `setTimeout`）で
// 遅延させる。Sentry SDK は import 時点でモジュール本体の評価コストを
// 払うが、init() で global error handler / breadcrumb integration /
// tracing transport を立ち上げる重い処理が走る。これを LCP より後ろに
// 倒すことで、メインスレッドの Script Evaluation 時間を 300〜500ms 削る。
//
// timeout を 4 秒に設定しているので、idle が来なくても 4 秒以内に init
// される（ユーザーが操作を始める前にエラー補足が立ち上がる想定）。
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
if (dsn && typeof window !== 'undefined') {
  const startSentry = () => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
      // パフォーマンス計測は本番のみ 10%（コスト管理）
      tracesSampleRate: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 0.1 : 0,
      // Session Replay は無効（個人情報を含むため、必要になったら別途決定）
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      // エラー時のブレッドクラム濾過：URL に user_id 等の機微情報が混ざることがあるので
      // クエリパラメータの値を伏せる
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
      // dev では本番ノイズを避けるため発火しない
      enabled: process.env.NODE_ENV === 'production',
    })
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startSentry, { timeout: 4000 })
  } else {
    setTimeout(startSentry, 2000)
  }
}

// Next.js 15 App Router: ルート遷移を Sentry の Performance Monitoring に渡す。
// init 前に呼ばれた場合は SDK 側で no-op になる（最初の遷移 1〜2 件分の trace を取りこぼす可能性はあるが許容）。
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
