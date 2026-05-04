// 後方互換用の re-export レイヤ。
// 実体は @/lib/site-blog/ 配下に分割済み。
// 既存の `from '@/lib/site-blog-support'` はそのまま動く。
//
// 新規コードは `from '@/lib/site-blog'` を使うのが推奨。

export * from './site-blog'
