'use client'

import { useEffect, useState } from 'react'

// 「UI 表示用」のログイン状態判定 hook。
// document.cookie に Supabase auth cookie（`...-auth-token`）が存在するかを
// 単純チェックするだけで、Supabase JS の import は行わない。これにより
// marketing pages のクライアント JS バンドルから @supabase/ssr 約 50KiB
// (gzip) が外れる。
//
// 戻り値:
//  - null   : 解決前（最初のレンダー、サーバ側 / マウント前）
//  - true   : auth cookie あり（ログイン済みの可能性が高い）
//  - false  : auth cookie なし（未ログイン）
//
// 注意:
//  - これは UI 表示専用。security 判定には使わない。
//  - cookie が偽造・有効期限切れでも true を返す可能性がある（middleware /
//    server 側で実際の `getUser()` を必ず通すため UI 上の問題に留まる）
//  - ログアウトを別タブで行った場合などの cookie 削除は反映されないが、
//    next/link 遷移後にもう一度判定が走るため大きな実害はない
//
// 旧実装は `@supabase/ssr` の `createBrowserClient` を import して
// `auth.getSession()` を呼んでいたが、bundle に Supabase JS 全体が
// 取り込まれていたため軽量版に置き換えた。
function readAuthCookie(): boolean {
  if (typeof document === 'undefined') return false
  // Supabase の auth cookie 名は `sb-<project-ref>-auth-token`。
  // ただし @supabase/ssr は cookie が大きい場合 `sb-<ref>-auth-token.0`,
  // `.1`, `.2` ... のように分割保存するため、`.\d+` 付きも許容する。
  return /(?:^|;\s*)sb-[^=;]*-auth-token(?:\.\d+)?=/.test(document.cookie)
}

export function useIsLoggedIn(): boolean | null {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    setIsLoggedIn(readAuthCookie())
  }, [])

  return isLoggedIn
}
