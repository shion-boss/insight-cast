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
