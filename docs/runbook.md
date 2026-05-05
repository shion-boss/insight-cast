# ランブック

ops が運用しながら育てる対応手順集。

---

## 目次

- [記事生成が完了しない・固まる](#記事生成が完了しないfixingされる)
- [プロジェクトのステータスリセット](#プロジェクトのステータスリセット)

---

## 記事生成が完了しない・固まる

### 症状
- 記事生成ボタンを押しても「作成中」のまま画面が変わらない
- エラーも出ないが記事が生成されない
- プロジェクトが `article_ready` になっているが `articles` テーブルに記事がない

### 確認手順

1. `articles` テーブルに記事があるか確認する

```bash
curl -s "https://tiabkpztvcyjithofopw.supabase.co/rest/v1/articles?interview_id=eq.<INTERVIEW_ID>&select=*" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

2. 記事がない場合、プロジェクトのステータスを確認する

```bash
curl -s "https://tiabkpztvcyjithofopw.supabase.co/rest/v1/projects?id=eq.<PROJECT_ID>&select=id,status,updated_at" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

### リカバリ手順

プロジェクトのステータスを `interview_done` に戻す（記事生成ボタンが再度押せる状態になる）。

```bash
curl -s -X PATCH "https://tiabkpztvcyjithofopw.supabase.co/rest/v1/projects?id=eq.<PROJECT_ID>" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"status": "interview_done"}'
```

復旧後、ユーザーに「もう一度記事生成をお試しください」と案内する。

### 根本原因（既知）
- 参照: `/ops/incidents/2026-04-21-article-generation-timeout.md`
- バックグラウンド処理が `waitUntil` なしで走ると Vercel 環境でタイムアウト終了する
- 記事生成処理の完了前にプロジェクトステータスが更新されると、固着状態になる

---

## プロジェクトのステータスリセット

### 有効なステータス一覧（`projects_status_check` 制約）

| ステータス | 意味 |
|-----------|------|
| `analyzing` | 競合・HP調査中 |
| `report_ready` | 調査レポート完了 |
| `interview_ready` | インタビュー実施可能 |
| `interview_done` | インタビュー完了・記事生成可能 |
| `article_ready` | 記事生成完了 |

### 注意
- ステータスを戻す場合、そのステータスに対応する下位データ（記事など）が存在しないことを先に確認する
- データ削除を伴う操作は必ず人間に確認を取る

---

## Sentry エラーモニタリング

### セットアップ（初回のみ）

1. https://sentry.io でアカウント作成（無料枠は月 5,000 エラー）
2. 新規プロジェクト作成 → Platform: Next.js
3. DSN（`https://xxx@oXXX.ingest.sentry.io/XXX`）を取得
4. Vercel のプロジェクト設定 → Environment Variables に以下を登録:
   - `NEXT_PUBLIC_SENTRY_DSN` = DSN（Production / Preview）
   - `SENTRY_DSN` = 同じ DSN（Production / Preview）
   - `SENTRY_ORG` = Sentry の組織 slug（source map upload 用）
   - `SENTRY_PROJECT` = Sentry のプロジェクト slug
   - `SENTRY_AUTH_TOKEN` = Sentry → Settings → Auth Tokens で発行（Secret 扱い）
5. Sentry 側でアラートルール設定:
   - 「Issue is first seen」「Issue is unresolved for 1 hour」等を Slack 通知に
   - Slack Integration を有効化して通知先 channel を選ぶ

### 動作仕様

- **本番のみ送信**：`NODE_ENV === 'production'` のときだけ Sentry が初期化される。
- **未設定時は no-op**：DSN が空ならコード側で `Sentry.init` を呼ばない。ローカル開発では完全に無効。
- **トンネル経由**：`/monitoring` ルート経由で送信されるため ad blocker でブロックされない。
- **エラーキャプチャ**：
  - Server Component / Route Handler の例外は `instrumentation.ts` の `onRequestError` で自動捕捉
  - クライアントエラーは `app/error.tsx` `app/global-error.tsx` で `Sentry.captureException` 明示呼び出し
  - 任意の場所で `Sentry.captureException(error)` を呼ぶことも可能

### CSP

`next.config.ts` の `connect-src` に `https://*.ingest.sentry.io https://*.sentry.io` を許可済み。トンネルを使う場合は `/monitoring` 経由になるため CSP 違反は起きない設計。

### 確認手順（本番）

1. Vercel に env vars 登録 → 再デプロイ
2. 任意のページで意図的にエラーを発生させる（dev tools console: `throw new Error('test')`）
3. Sentry の Issues 一覧に新規 issue が現れることを確認
4. Slack 通知が来ることを確認

### コスト管理

- 無料枠：月 5,000 エラー / 10,000 transaction
- `tracesSampleRate` は本番 10%、edge は 5%、開発 0% に設定済み
- `replaysSessionSampleRate` は 0（個人情報含む可能性のため）
