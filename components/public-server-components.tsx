import { SiteHeaderClient } from '@/components/site-header-client'
import { PublicFooterClient } from '@/components/public-footer-client'

// 旧実装は毎リクエスト `auth.getUser()` を呼んでいたため、site (marketing) 配下
// の全ページが dynamic 化していた。auth-aware UI はクライアント側で判定する
// ことで、layout 経由での Supabase Auth API 往復を排除しページを静的生成可能にする。
export function PublicHeader() {
  return <SiteHeaderClient />
}

export function PublicFooter({ showPromo = true }: { showPromo?: boolean }) {
  return <PublicFooterClient showPromo={showPromo} />
}
