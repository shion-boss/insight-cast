// Sentry initialization for the Edge runtime (middleware, edge route handlers).
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.05 : 0,
    enabled: process.env.NODE_ENV === 'production',
  })
}
