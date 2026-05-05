// Next.js が起動時に呼ぶ。runtime ごとに Sentry の初期化ファイルを読み込む。
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// App Router の Server Component / Route Handler で発生したエラーを Sentry に送る
export const onRequestError = Sentry.captureRequestError
