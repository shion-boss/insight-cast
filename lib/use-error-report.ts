'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * `app/**\/error.tsx` の `error` を Sentry に送る共通フック。
 *
 * Next.js のエラーバウンダリは「最も近い error.tsx」が捕まえるため、
 * サブツリーの error.tsx で Sentry に送らないと詳細が届かない（global の
 * `app/error.tsx` まで伝播しない）。
 *
 * ブランチ詳細: 2026-05-09 のモニター監査で `TypeError: e[n] is not a function`
 * が複数ページで観測されたが、サブツリー側 error.tsx に Sentry.captureException が
 * 入っておらず Sentry の breadcrumb・スタックが取れていなかった。本フックで統一する。
 */
export function useErrorReport(error: Error & { digest?: string }) {
  useEffect(() => {
    Sentry.captureException(error)
    if (process.env.NODE_ENV === 'development') {
      console.error('Client boundary error:', error)
    }
  }, [error])
}
