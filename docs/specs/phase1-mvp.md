# Phase 1 MVP 仕様骨子

> ステータス: ドラフト（2026-04-17）
> 担当: builder / ai-architect（実装）/ pm（仕様承認）
> 関連: CLAUDE.md「Phase 1: MVP 構築」

---

## 1. Phase 1 の目的

Phase 1 は **「自分（代表者）のHPを1つ仮に用意し、Insight Cast の一連のフローを通して動かせる状態にする」** ことが目標。

- 本番リリースでも顧客提供でもない。**社内で通しで動くことの実証。**
- ここで動いた実績と学びを元に、Phase 2（ドッグフーディング）の自社HP運用に繋げる。
- 完成度より「一通り動く」ことを優先する。凝ったUIは Phase 3 以降で作る。

---

## 2. 対象ユーザー

**社内（代表者のみ）**。外部公開なし。

- 認証は Email/Password で十分
- UIは機能重視（世界観の作り込みは Phase 2 以降）
- エラー時に詳細なスタックトレースが出ても許容する（内部ツールのため）

---

## 3. フローの全体像

```
[1. HP URL 入力]
      ↓
[2. HP 現状分析]（AIが対象HPをクロール・分析）
      ↓
[3. 競合調査]（AIが競合サイトを調査・比較）
      ↓
[4. インタビュー実施]（キャラAIが代表者にインタビュー）
      ↓
[5. インタビュー整理]（AIが発言を整理・一次情報を構造化）
      ↓
[6. 発信テーマ提案]（AIが記事・LP候補を提案）
      ↓
[7. 素材出力]（記事・LP制作に使えるテキスト一式を出力）
```

Phase 1 では **全フローが1度通しで動けばOK**。各ステップの精度向上は Phase 2 で行う。

---

## 4. 最小機能セット（Phase 1 MVP）

### 4.1 認証

| 機能 | 詳細 |
|---|---|
| ログイン | Email/Password（Supabase Auth） |
| セッション維持 | Middleware でルートガード |
| ログアウト | セッション破棄 |

### 4.2 クライアント（HP）管理

| 機能 | 詳細 |
|---|---|
| HP 登録 | URL・企業名・業種メモを入力して保存 |
| 登録一覧 | 登録済みHPの一覧表示（Phase 1 は1件でOK） |

### 4.3 HP 現状分析

| 機能 | 詳細 |
|---|---|
| HP クロール | URL を渡して基本情報（タイトル・説明・主要テキスト）を取得 |
| 分析実行 | 取得した情報を AI（Claude）が分析し、課題・強みを構造化して返す |
| 結果保存 | 分析結果を DB（`site_analyses`）に保存 |
| 結果表示 | 保存した分析結果を画面に表示 |

**Phase 1 の精度目標**: "それっぽい分析が出る"で十分。評価ルーブリックは Phase 2 で整備。

### 4.4 競合調査

| 機能 | 詳細 |
|---|---|
| 競合 URL 入力 | 1〜3社の競合 URL を手動で入力 |
| 比較分析実行 | 対象HP と競合を AI が比較し、差異・機会を出力 |
| 結果保存 | `competitor_analyses` に保存 |
| 結果表示 | 比較結果を画面に表示 |

### 4.5 AIインタビュー

| 機能 | 詳細 |
|---|---|
| キャラ選択 | Phase 1 はミント（猫）のみ実装。追加キャラは Phase 2 以降 |
| インタビュー開始 | セッション作成（`interview_sessions`）して会話を開始 |
| 会話 UI | テキストチャット形式。ユーザーが入力 → AI が返答 |
| 発言保存 | 1メッセージ1行で `interview_messages` に随時保存 |
| インタビュー終了 | 明示的な「終了」操作でセッションを完了状態にする |

**キャラ実装の注意**: Phase 1 はキャラアイコン（画像）の用意が間に合わない場合、代わりにキャラ名テキスト + プレースホルダーアイコンで進める。ただし将来アイコン差し替えを前提とした実装にする。

### 4.6 インタビュー整理・発信テーマ提案

| 機能 | 詳細 |
|---|---|
| 整理実行 | 完了したインタビューセッションの発言を AI が整理し、一次情報を構造化 |
| 発信テーマ提案 | 整理結果をもとに記事・LP の候補テーマを AI が提案 |
| 結果保存 | `articles` テーブルに保存（ステータス: `draft`） |
| 結果表示 | 整理結果とテーマ一覧を画面に表示 |

### 4.7 素材出力

| 機能 | 詳細 |
|---|---|
| テキスト出力 | 発信テーマに紐づく素材テキストを画面に表示 |
| コピー機能 | クリップボードにコピーできる |

Phase 1 では PDF / Word 出力は不要。テキストのコピーで十分。

---

## 5. データモデル（最小）

```sql
-- 顧客HP
clients (
  id uuid PK,
  name text,                  -- 企業・店舗名
  url text,                   -- 対象HP の URL
  industry_memo text,         -- 業種メモ（自由記述）
  created_at timestamptz,
  updated_at timestamptz
)

-- HP 分析結果
site_analyses (
  id uuid PK,
  client_id uuid FK -> clients,
  raw_content text,           -- クロールで取得したテキスト
  analysis_result jsonb,      -- AI の分析結果（構造化）
  created_at timestamptz
)

-- 競合分析結果
competitor_analyses (
  id uuid PK,
  client_id uuid FK -> clients,
  competitor_urls text[],     -- 競合URL一覧
  analysis_result jsonb,      -- AI の比較結果（構造化）
  created_at timestamptz
)

-- インタビューセッション
interview_sessions (
  id uuid PK,
  client_id uuid FK -> clients,
  character_id text,          -- "mint" / "claus" etc.
  status text,                -- "active" / "completed"
  created_at timestamptz,
  completed_at timestamptz
)

-- インタビュー発言
interview_messages (
  id uuid PK,
  session_id uuid FK -> interview_sessions,
  role text,                  -- "user" / "assistant"
  content text,
  created_at timestamptz
)

-- 記事・素材
articles (
  id uuid PK,
  client_id uuid FK -> clients,
  session_id uuid FK -> interview_sessions,
  status text,                -- "draft" / "published"
  themes jsonb,               -- 発信テーマ候補
  materials jsonb,            -- 素材テキスト一式
  created_at timestamptz,
  updated_at timestamptz
)
```

---

## 6. 画面構成（ルート設計）

```
/login                          # ログイン画面
/dashboard                      # TOP: 登録HP一覧
/dashboard/clients/new          # HP 新規登録
/dashboard/clients/[id]         # HP 詳細（分析結果・インタビュー一覧）
/dashboard/clients/[id]/analyze # HP 分析・競合調査 実行
/dashboard/interview/[sessionId]# インタビュー実施（チャット UI）
/dashboard/clients/[id]/output  # 整理結果・素材出力
```

---

## 7. Phase 1 完了条件（具体化）

以下を **1回通しで動かせた状態** を Phase 1 完了とする。

| ステップ | 合格基準 |
|---|---|
| 1. ログイン | Email/Password でダッシュボードに入れる |
| 2. HP 登録 | 代表者自身のHP（テスト用）を URL 入力して保存できる |
| 3. HP 分析 | 登録した URL を渡してAIが分析結果を返し、画面に表示される |
| 4. 競合調査 | 競合URL（1〜3社）を入力して比較結果が表示される |
| 5. インタビュー | ミントキャラとテキストで5往復以上の会話ができ、DB に保存される |
| 6. 整理・提案 | 完了したインタビューから発信テーマが3つ以上提案される |
| 7. 素材出力 | テーマに紐づく素材テキストが画面に表示され、コピーできる |

「自分のHPを1つ仮に用意し通しで動かせる状態」= **上記7ステップが全て1回通ること**。

---

## 8. Phase 1 でやらないこと（スコープ外）

- 顧客向けUI・世界観の作り込み（Phase 3）
- 複数ユーザー / チーム機能（Phase 3）
- 決済・サブスク（Phase 3）
- キャラクター追加（ミント以外は Phase 2〜）
- 音声入力（Phase 4 以降）
- PDF / Word 出力
- メール通知
- 記事本文の自動生成（素材出力まで。本文生成はオプション扱い）
- HP 自動更新・CMS 連携
- 業種特化ロジック（汎用で戦う方針 / Phase 4 以降）
- E2E テスト・負荷テスト

---

## 9. 技術的注意事項

- HP クロールは Vercel の Edge Function / Serverless Function で実装する（ブラウザからは直接クロールしない）
- 外部サイトのクロールには robots.txt を尊重し、過度なリクエストを避ける
- AI API の呼び出しは全てサーバーサイド（Route Handler / Server Actions）で行う
- Supabase の RLS を全テーブルで有効にする（Phase 1 内部ツールでも習慣として守る）
- 社内AIとプロダクトAIの分離は Phase 1 から守る（詳細は `docs/tech-stack.md` Section 6）

---

## 10. Phase 2 への引き継ぎ事項

Phase 1 完了時に以下をまとめて pm に報告する。

- インタビューの質: どんな質問が一次情報を引き出せたか（ai-architect へフィードバック）
- UI の使いやすさ: 通しで動かして引っかかった箇所（reviewer・builder で改善）
- HP 分析・競合調査の精度: "それっぽいか"の主観評価（ai-architect へフィードバック）
- DB 設計の変更点: Phase 2 以降に見直すべきテーブル設計
- コスト: Phase 1 で実際に使った AI API の概算コスト（cost-ops への引き渡し）
