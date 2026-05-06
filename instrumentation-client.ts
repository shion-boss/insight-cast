// Next.js が起動時に毎ページで読む client-side instrumentation hook。
//
// Sentry SDK はここで静的 import すると `@sentry/nextjs`（408 KB raw /
// 125 KiB gzip）が全ページの初期 JS バンドルに混ざり、Lighthouse の
// Script Evaluation が 300-500ms 余計に伸びる。Insight Cast では
// marketing pages（LP・blog・cast 等）でクライアント側エラーが起きる
// パスがほぼ無いため、Sentry の取り込みは tool / admin layout 限定にする。
//
// 認証済みエリアでの Sentry 初期化は `components/sentry-loader.tsx` の
// Client Component が `dynamic import('@sentry/nextjs')` 経由で行うため、
// SDK は別 chunk に分離され marketing 配下の bundle には含まれなくなる。
//
// onRouterTransitionStart は Next.js 側でオプショナル契約。export しなく
// ても問題ない（自動 trace の細粒度を失うだけ。Performance Monitoring の
// 主用途は tool 側のためトレードオフは許容）。
export {}
