# セキュリティ・品質チェックリスト

**実行タイミング:**
- 初回リリース前
- 課金・認証・プラン判定に関わる機能変更時（CLAUDE.md ガードレール 12 条）
- 月次のセキュリティレビュー（任意）

---

## 1. セキュリティヘッダー

- [x] `X-Content-Type-Options: nosniff` — 設定済み
- [x] `X-Frame-Options: DENY` — 設定済み
- [x] `X-XSS-Protection: 1; mode=block` — 設定済み
- [x] `Referrer-Policy: strict-origin-when-cross-origin` — 設定済み
- [x] `Permissions-Policy` (camera, microphone, geolocation 無効化) — 設定済み
- [x] `Content-Security-Policy` — 設定済み（`unsafe-inline` 許容、将来 nonce ベースへ移行予定）
- [ ] CSP を nonce ベースに移行して `unsafe-inline` を除去（将来対応）
- [ ] `Strict-Transport-Security` (HSTS) — Vercel が自動付与するか、カスタムドメインで確認

---

## 2. 認証・セッション管理

- [x] 未認証ユーザーを `middleware.ts` でリダイレクト
- [x] `/admin` を `ADMIN_EMAILS` で制限
- [x] `auth/callback` のオープンリダイレクト対策（`//` バイパス防止済み）
- [x] セッションクッキーを `@supabase/ssr` で管理（HttpOnly / Secure）
- [ ] パスワードリセットトークンが一度使用後に無効になるか（Supabase Auth デフォルト動作を確認）
- [ ] Google OAuth の state パラメータ検証（Supabase Auth が自動処理しているか確認）
- [ ] ブルートフォース対策がSsupabase Auth 側で有効か（ダッシュボードで確認）
- [ ] ログアウト後にセッションクッキーが確実に削除されるか確認

---

## 3. API セキュリティ

- [x] 全 API ルートでサーバー側認証チェックを実施
- [x] `interview/chat` に `userMessage` 2000文字上限を設定済み
- [x] Firecrawl に渡す URL を `https://` のみに制限（SSRF対策）
- [x] `interview/chat` のプラン上限チェック（月次・生涯）
- [x] AI を使う全 API ルート（`analyze`、`article`、`interview/chat`）に対してレート制限を追加（`api_usage_logs` ベース、`lib/api-usage.ts` の `checkRateLimit`）
- [ ] Zod によるリクエストバリデーションの統一（現在は手動検証）
- [x] API レスポンスにスタックトレースが含まれていないことを確認（`error.message` 露出を 2ファイルで `'internal_error'` に修正済み）
- [ ] バックグラウンド分析中の重複リクエスト排他制御を確認

---

## 4. アクセス制御（IDOR・権限）

- [x] `subscriptions` テーブルの RLS が有効
- [x] プロジェクト操作で `user_id` チェックを実施
- [x] `projects`、`interviews`、`articles`、`interview_messages` の全テーブルで RLS が有効か（マイグレーションファイルで確認済み。全テーブル `ENABLE ROW LEVEL SECURITY` + ポリシー設定済み）
- [x] 全 `[id]` パラメータを含む API ルートで所有者チェックが実施されているか確認（全ルート: user_id 直接チェックまたは RLS でカバー済み）
- [x] `api/admin/*` エンドポイントが API ルート内でも管理者チェックをしているか確認（全ルート: ADMIN_EMAILS チェックまたは isAuthorized チェック済み）

---

## 5. 課金・Stripe セキュリティ

- [x] Stripe Webhook 署名検証（`webhooks.constructEvent`）
- [x] Webhook の `upsert` による冪等性確保
- [x] 同一・上位プランへの重複チェックアウトをサーバー側でブロック
- [x] `checkout.session.completed` で `session.mode === 'subscription'` チェック
- [x] `priceId` を `priceIdToPlan` マッピングで検証
- [ ] カード番号を自社 DB・ログに保存していないことを確認（PCI DSS）
- [ ] `invoice.payment_failed` / `customer.subscription.updated (past_due)` 時の処理を確認
- [ ] Stripe テストモードと本番モードの環境変数が正しく分離されているか
- [ ] 本番 Stripe アカウントで Webhook エンドポイントが正しい URL に設定されているか

---

## 6. 環境変数・シークレット管理

- [x] `.gitignore` で `.env*` を除外
- [x] `SUPABASE_SERVICE_ROLE_KEY` / `STRIPE_SECRET_KEY` が `NEXT_PUBLIC_` でない
- [x] `git log -p | grep -iE "secret|api.?key|password"` でシークレットの混入がないか確認（実施済み。全て `process.env.*` 経由で実値なし）
- [x] `.env.local.example` に全必須キーが記載されているか確認（`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`STRIPE_PRICE_ID_*`、`NEXT_PUBLIC_APP_URL`、`NEXT_PUBLIC_GA_ID`、`RESEND_API_KEY` を追記済み）
- [ ] Vercel の本番環境変数がすべて設定されているか確認
- [ ] Preview 環境と本番環境で別の Stripe / Supabase プロジェクトを使っているか

---

## 7. インフラ・Vercel 設定

- [ ] `vercel.json` の `maxDuration: 300` が Vercel の契約プランで許可された範囲内か確認
- [ ] カスタムドメインで HTTPS が有効か
- [ ] Vercel Preview Deploy を外部から保護しているか（パスワード保護等）
- [ ] Supabase の Database Backups が有効か
- [ ] Supabase Storage の `avatars` バケットのアクセス制御を確認（パブリックになっていないか）

---

## 8. SEO・クロール制御

- [x] `robots.ts` で `/admin`・`/dashboard`・`/settings` 等を `noindex` に設定済み
- [x] `sitemap.ts` でサイトマップを生成済み
- [x] LP・料金ページ・ブログ記事に OG タグ（`openGraph`・`twitter`）が設定されているか（LP・料金ページは前セッション済み、ブログ一覧・詳細を追加）
- [ ] `NEXT_PUBLIC_APP_URL` が本番 URL に設定されているか（sitemap の URL が正しいか）
- [ ] Google Search Console にサイトマップを送信済みか

---

## 9. エラーハンドリング

- [x] `app/global-error.tsx` でルートレイアウトのエラーを捕捉
- [x] `app/error.tsx` で各ルートセグメントのエラーを捕捉
- [x] `app/not-found.tsx` が存在する
- [x] `console.log` が本番ビルドに残っていないか確認（grep 実施、0件）

---

## 10. 依存パッケージ

- [x] `npm audit` でクリティカル・高重要度の脆弱性がないことを確認（実施済み、0件）
- [ ] `next`・`@supabase/ssr`・`stripe`・`@anthropic-ai/sdk` が最新安定版か確認

---

## 11. プライバシー・法的要件（日本）

- [x] プライバシーポリシー（`/privacy`）が存在する
- [x] 利用規約（`/terms`）が存在する
- [x] 特定商取引法に基づく表記（`/tokushoho`）が存在する
- [x] アカウント削除機能が実装済み（`/api/account/delete`）
- [x] お問い合わせフォームの IP アドレスをハッシュ化して保存
- [ ] 特定商取引法の必須記載項目（代表者名・住所・電話番号・キャンセルポリシー等）が揃っているか確認
- [ ] Stripe・Supabase・Anthropic への個人情報提供がプライバシーポリシーに記載されているか
- [ ] Cookie 同意バナーが必要かを確認（EU/UK ユーザーを対象にする場合は必須）
- [x] アカウント削除時に全関連データが連鎖削除されるか確認（マイグレーション確認済み。全テーブルで `ON DELETE CASCADE` 設定済み）

---

## 優先度の高い未対応項目（要対応）

| 優先度 | 項目 | 状態 |
|---|---|---|
| ~~高~~ | ~~AI API ルートへのレート制限（コスト爆発防止）~~ | ✅ 完了 |
| ~~高~~ | ~~全テーブルの RLS 有効化を Supabase ダッシュボードで確認~~ | ✅ 完了 |
| 中 | CSP を nonce ベースに移行（`unsafe-inline` 除去） | 未対応 |
| ~~中~~ | ~~Vercel `maxDuration` vs 契約プランの整合性確認~~ | ✅ Hobby (60s) に合わせて修正済み |
| ~~中~~ | ~~`npm audit` の実施~~ | ✅ 完了 |
| ~~中~~ | ~~`console.log` の本番ビルドへの混入確認~~ | ✅ 完了 |
