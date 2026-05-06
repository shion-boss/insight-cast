import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

  // robots.txt の disallow と <meta name="robots" content="noindex"> の使い分け:
  //
  // - **disallow**（robots.txt）: Google が crawl 自体しない。HTML すら取得しない。
  // - **noindex meta**: Google が crawl して HTML を読み、meta 指示で index から外す。
  //
  // 両方付けると逆効果: Google は crawl できないので noindex meta を読めず、内部リンク
  // から URL を発見した場合に "URL だけ index に残る" 状態になる（GSC 警告:
  // 「robots.txt によりブロックされましたが、インデックスに登録しました」）。
  //
  // → 認証必須ページや /auth/* は **disallow せず**、各ページの metadata で
  //    `robots: { index: false, follow: false }` を指定して noindex に倒す。
  // → /admin/* は HTTP Basic Auth で 401 を返すため crawl 不可（Google が HTML を
  //    一切受け取れない）→ disallow を残しても警告は出ない。
  // → /api/* は JSON / 非HTML 応答で indexable なコンテンツが無いため disallow OK。
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
