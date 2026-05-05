'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// クライアント側で「ログイン済みかどうか」だけを判定する hook。
// `getSession()` は cookie / localStorage の値を読むだけで Supabase Auth API
// への往復が発生しないため、site (marketing) 系ページを静的生成のまま維持できる。
//
// 戻り値:
//  - null   : 解決前（マウント直後の最初のレンダー）
//  - true   : ログイン済み
//  - false  : 未ログイン
//
// UI 側は null の間、未ログイン側を楽観的に描画する or skeleton を出す。
// セキュリティ判定にはこの値を使わず、必ずサーバ側 / API 側で `getUser()` を行うこと。
export function useIsLoggedIn(): boolean | null {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setIsLoggedIn(Boolean(data.session))
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setIsLoggedIn(Boolean(session))
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return isLoggedIn
}
