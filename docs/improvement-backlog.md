# 改善バックログ — Insight Cast 品質向上洗い出し

> 作成: 2026-04-28  
> 方針: ネット調査（WCAG 2.2 / Core Web Vitals / OWASP / Google SEO / PWA チェックリスト）とコードベース監査を照合して作成。  
> 凡例: 🔴 High / 🟡 Medium / 🟢 Low

---

## 現状スコアサマリー

| 領域 | 達成率 | 主な残課題 |
|---|---|---|
| アクセシビリティ (WCAG 2.2 AA) | 85% | skip link・色コントラスト確認 |
| パフォーマンス (Core Web Vitals) | 75% | コード分割・Suspense streaming |
| SEO | 85% | 記事別 OG 画像・FAQ スキーマ |
| セキュリティ | 75% | レート制限の網羅・CSRF 明示 |
| UX / ユーザビリティ | 80% | エラーロギング・undo 対応 |
| PWA / インストール対応 | 50% | Service Worker なし |
| コード品質 | 70% | テスト皆無・bundle 計測なし |

---

## 🔴 HIGH — 早急に対応すべき

### A-1. スキップナビゲーションリンクの追加
- **問題**: キーボードユーザーが毎ページのナビゲーションをスキップできない。WCAG 2.4.1 (A) 違反。
- **対象**: `app/layout.tsx` または `components/app-shell.tsx`
- **対応**: `<a href="#main-content" className="sr-only focus:not-sr-only ...">メインコンテンツへスキップ</a>` をページ先頭に追加。`<main id="main-content">` はすでに存在するので接続するだけ。
- **工数**: 小（1-2h）

### A-2. 色コントラスト比の体系的確認
- **問題**: CSS 変数経由の色は検証済みだが、inline style のハードコード色（例: `global-error.tsx:74` の `#c47b3a`、CastTalkGrid の `theme.color` など）の WCAG 4.5:1 達成が未確認。
- **対象**: `app/global-error.tsx`, `app/(site)/cast-talk/CastTalkGrid.tsx`, `app/(site)/page.tsx` のインラインカラー
- **対応**: axe DevTools または WebAIM Contrast Checker で全ページ手動確認 → 不足箇所を CSS 変数化
- **工数**: 中（4-8h）

### S-1. API レート制限の網羅
- **問題**: `/lib/api-usage.ts` でレート制限の仕組みはあるが、適用されていないエンドポイントが多数ある（`/api/stripe/checkout`、`/api/contact` 等）。OWASP API Security Top 10 の API4。
- **対象**: `app/api/` 配下の全ルート
- **対応**: middleware.ts でグローバルに IP ベースのレート制限を適用するか、未適用ルートに個別に `checkRateLimit()` を追加
- **工数**: 中（4-6h）

### C-1. 本番エラーロギングの導入
- **問題**: error.tsx / try-catch は揃っているが、本番エラーが誰にも通知されない。サイレント障害のリスク。
- **対応**: Sentry（無料枠あり）または Vercel Log Drains を導入し、`500` 系エラーを Slack 通知
- **工数**: 小-中（2-4h）

---

## 🟡 MEDIUM — 次のスプリントで対応

### SEO-1. 記事・Cast Talk の OG 画像個別化
- **問題**: ブログ記事・Cast Talk 記事の OG 画像が `/logo.jpg` の共通画像になっており、SNS シェア時に映えない。
- **対象**: `app/(site)/blog/[slug]/page.tsx:40`、`app/(site)/cast-talk/[slug]/page.tsx`
- **対応**: Next.js `opengraph-image.tsx` でサムネイル自動生成 or 記事ごとのアイキャッチ画像フィールドを追加
- **工数**: 中（4-8h）

### SEO-2. FAQ・サービスページの構造化データ
- **問題**: FAQ ページに `FAQPage` スキーマ、サービスページに `Service` スキーマがない。リッチリザルト機会の損失。
- **対象**: `app/(site)/faq/page.tsx`、`app/(site)/service/page.tsx`
- **対応**: 各ページに `<script type="application/ld+json">` で FAQ/Service スキーマを追加
- **工数**: 小（2-3h）

### P-1. Suspense / Streaming の活用
- **問題**: 重いサーバーコンポーネント（LP: `Promise.allSettled` 5本）がブロッキングレンダリングになっている。LCP 悪化の要因。
- **対象**: `app/(site)/page.tsx:179`、`app/(site)/blog/page.tsx`
- **対応**: データフェッチを分割し `<Suspense fallback={<Skeleton />}>` でラップ → ストリーミングレスポンス化
- **工数**: 中（4-6h）

### P-2. Next.js パッケージ最適化設定
- **問題**: `next.config.ts` に `experimental.optimizePackageImports` がない。ライブラリの tree-shaking が最適化されていない。
- **対象**: `next.config.ts`
- **対応**: `experimental: { optimizePackageImports: ['lucide-react', '@radix-ui/...'] }` を追加（使用ライブラリに合わせて）
- **工数**: 小（1h）

### Q-1. E2E テストの最低限整備
- **問題**: テストが完全にない。「登録 → インタビュー → 記事生成」の核心フローが無防備。
- **対応**: Playwright で happy path 3本（ログイン、インタビュー完了、記事エクスポート）を作成
- **工数**: 大（1-2日）

### Q-2. `console.log` の本番除去
- **問題**: 開発用 `console.log` が本番コードに混在している可能性。
- **対応**: ESLint に `no-console: warn` ルールを追加 → CI で検出
- **工数**: 小（1h）

### UX-1. 削除操作の Undo サポート
- **問題**: 記事削除・インタビュー削除など不可逆操作に confirm ダイアログはあるが、実行後の undo がない。
- **対応**: Toast に「元に戻す」ボタン（5秒以内）を追加し、soft delete + 5秒後に物理削除するパターンを実装
- **工数**: 大（1日）

---

## 🟢 LOW — 余裕ができたら対応

### PWA-1. Service Worker + オフライン対応
- **問題**: `manifest.ts` は存在するがサービスワーカーがなく、PWA としてインストール可能だがオフラインで何も表示されない。
- **対応**: `next-pwa` または手動で Service Worker を追加。最低限オフラインフォールバックページを用意。
- **工数**: 中（4-6h）

### PWA-2. マニフェストのアイコン・スクリーンショット充実
- **問題**: アイコンが `logo.jpg` 1枚 (`sizes: 'any'`) のみ。192x192・512x512 の PNG が未定義。インストールプロンプトのアイコン表示品質が低い。
- **対象**: `app/manifest.ts`、`public/` にアイコン追加
- **工数**: 小（2h）

### S-2. Subresource Integrity (SRI)
- **問題**: 外部スクリプト（Google Analytics 等）に SRI ハッシュが付いていない。CDN 汚染リスク。
- **対象**: `app/layout.tsx` の外部 script タグ
- **工数**: 小（1-2h）

### SEO-3. hreflang 設定
- **問題**: 日本語専用サービスだが `<link rel="alternate" hreflang="ja">` がなく、将来の多言語対応時に技術的負債になる。
- **対象**: `app/layout.tsx`
- **工数**: 極小（30min）

### P-3. バンドルサイズ計測の CI 組み込み
- **問題**: バンドルサイズの変化が可視化されていない。リグレッション検知不可。
- **対応**: `@next/bundle-analyzer` を追加し、週次で計測を記録
- **工数**: 小（2h）

### A-3. CSRF 明示的検証
- **問題**: Next.js の Same-Origin 設定で一定の保護はあるが、state-changing API routes で `Origin` / `Referer` ヘッダーの明示的チェックがない。
- **対象**: `app/api/` の POST/DELETE ルート
- **工数**: 小（2-3h）

---

## 対応不要（意図的に除外）

| 項目 | 除外理由 |
|---|---|
| Service Worker によるオフライン取材 | インタビューは AI API 必須のためオフライン動作は設計上不可能 |
| MFA (多要素認証) | Phase 3 以降。現フェーズではユーザー数が少なく過剰 |
| LocalBusiness スキーマ | 実店舗なし、地域ビジネスではないため不要 |
| 音声・映像のキャプション | 現状 audio/video コンテンツなし |

---

## 実施順の推奨

```
Week 1:  A-1 (skip link) → S-1 (レート制限) → C-1 (エラーロギング)
Week 2:  A-2 (色コントラスト) → SEO-1 (OG 画像) → SEO-2 (FAQ スキーマ)
Week 3:  P-1 (Suspense) → P-2 (最適化設定) → Q-2 (console.log)
Week 4+: Q-1 (E2E テスト) → UX-1 (Undo) → PWA 系
```

---

## 参照

- WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/
- Core Web Vitals 2025: https://web.dev/articles/vitals
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js SEO: https://nextjs.org/learn/seo
- PWA Checklist: https://web.dev/articles/pwa-checklist
