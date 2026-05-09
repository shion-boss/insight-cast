// ツール側ナビ（PC サイドバー / モバイルドロワー）でどの項目を
// アクティブとして見せるかの共通判定。
//
// `/projects/[id]/...` のサブルートは URL 構造上は projects 配下だが、
// ユーザーは「取材メモを探す」「記事を探す」から飛んでくることが多く、
// URL 前方一致だけで判定するとサイドバーが「プロジェクト一覧」を
// ハイライトしてしまい違和感が出る。ここで「サブルートのうちどれが他ナビ
// 項目の文脈に属するか」を明示する。

const SUMMARY_SUBROUTE = /^\/projects\/[^/]+\/(summary|interview|interviewer)(\/|$|\?)/
const ARTICLE_SUBROUTE = /^\/projects\/[^/]+\/(articles|article)(\/|$|\?)/

export function isToolNavActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'

  if (href === '/interviews') {
    return pathname === '/interviews'
      || pathname.startsWith('/interviews/')
      || SUMMARY_SUBROUTE.test(pathname)
  }

  if (href === '/articles') {
    return pathname === '/articles'
      || pathname.startsWith('/articles/')
      || ARTICLE_SUBROUTE.test(pathname)
  }

  if (href === '/projects') {
    if (pathname === '/projects') return true
    if (SUMMARY_SUBROUTE.test(pathname) || ARTICLE_SUBROUTE.test(pathname)) return false
    return pathname.startsWith('/projects/')
  }

  return pathname === href || pathname.startsWith(href + '/')
}
