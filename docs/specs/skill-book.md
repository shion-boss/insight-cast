# skill-book

## 概要

業界 × 目的の組み合わせ（例: ローカル×塗装、ダイエット×食事）で AIキャストの質問観点を特化させる、買い切り型のアドオン機能。プロジェクトに1冊セットでき、入替可能、消耗しない。

## 目的

- 業種ごとにAIキャストを増やさずに、業界特化のインタビュー品質を提供する
- キャラの個性は維持しながら、業界 × 目的という2軸で取材深度を上げる
- 買い切りアドオンとしてサブスクとは別の収益軸を持つ

## 対象ユーザー

- 顧客（ライト・個人・法人プラン契約者）
- 無料プランでは購入できない設計とするか、購入はできるが装備時は有料プランへの誘導とするかは Phase 4 着手時に決める

## 責務

- 業界 × 目的の専門コンテキストを AIキャストの質問プロンプトに重ね掛けする
- 装備中の skill-book を1プロジェクト1冊に保つ
- 同じ skill-book を同一アカウント内で複数プロジェクトに同時装備させない
- 購入履歴とアカウント永続所有を保証する

## 今回（Phase 4）やらないこと

- skill-book 単独でのレンタル・サブスク化
- skill-book 同士の組み合わせ（複数装備）
- ユーザーが skill-book を自作・編集する機能
- 業種特化キャラの追加

## ステータス

**Phase 4 で実装着手予定**。本仕様書は Phase 4 開始時に再起動できるよう Phase 2 中に整備する。

着手凍結の根拠は [`docs/decisions/2026-05-08-skill-book-direction.md`](../decisions/2026-05-08-skill-book-direction.md)。

---

## A. データモデル

### 新規テーブル `skill_books`（マスター）

| カラム | 型 | 説明 |
|---|---|---|
| `id` | uuid | PK |
| `slug` | text UNIQUE | URL用識別子。例 `local-painting` `diet-meals` |
| `title` | text | 表示名「ローカル×塗装」 |
| `industry` | text | 業界軸（例: 塗装、食事、整体） |
| `objective` | text | 目的軸（例: ローカル集客、ダイエット支援） |
| `summary` | text | ストアでの紹介文 |
| `sample_questions` | jsonb | ストア詳細でサンプル表示する質問例（配列） |
| `stripe_price_id` | text | 買い切り Stripe Price ID |
| `price_jpy` | int | 表示価格（税込） |
| `character_overrides` | jsonb | キャラごとの追加プロンプト断片（後述 E） |
| `context_payload` | jsonb | プロジェクト共通の追加コンテキスト（業界用語、確認観点、競合論点、想定取材成果） |
| `status` | text | `draft` / `published` |
| `published_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

### 新規テーブル `user_skill_books`（ユーザーの所有状態）

| カラム | 型 | 説明 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `skill_book_id` | uuid | FK → skill_books |
| `stripe_payment_intent_id` | text UNIQUE | 重複処理防止 |
| `purchased_at` | timestamptz | |
| `revoked_at` | timestamptz NULL | 返金時に soft-delete |

`(user_id, skill_book_id)` に UNIQUE 制約（`revoked_at IS NULL` 条件付き部分インデックス）。再購入を防ぐ。

### `projects` への追加カラム

- `equipped_skill_book_id uuid NULL` （FK → skill_books.id）

部分 UNIQUE インデックスで「同一 user_id 内で同じ skill_book_id を複数プロジェクトに装備不可」を担保:

```sql
CREATE UNIQUE INDEX uniq_user_equipped_skill_book
  ON projects (user_id, equipped_skill_book_id)
  WHERE equipped_skill_book_id IS NOT NULL
    AND deleted_at IS NULL;
```

---

## B. AIプロンプト注入

注入ハブは既存実装を再利用する。

- 質問生成の起点: `app/api/projects/[id]/interview/chat/route.ts`
  - 並列取得（L141-L199）に skill_book を1本追加
  - `contextParts` 配列（L342-L479）に新セクション「装備中スキルブック: <title>」を挿入
  - `buildCharacterSpecificContext()` (L451-L454) を拡張し、`character_overrides[character_id]` を上書き／追記
- キャラ共通プロンプト: `lib/characters/instructions.ts`、`lib/characters/prompt-builder.ts`（変更しない）
- 既存業種ヒント: `lib/industry-hints.ts`（skill-book 装備時はこちらの注入をスキップして文字数膨張を避ける）

skill-book は **既存のキャラペルソナを書き換えない**。あくまで重ね掛けレイヤー。

---

## C. UI要素

### 装備フロー（`/projects/[id]` 設定タブに追加）

- 「スキルブックをセットする」カード
- 所有済み skill-book 一覧（`user_skill_books` から取得、画像 + タイトル + 業界×目的タグ）
- 未所有の skill-book は「購入する」ボタン → Stripe Checkout（payment mode）
- 装備中があれば「外す」 / 「別の skill-book に入替」ボタン
- 法人プランで他プロジェクトに同じ skill-book がセット済みの場合、「○○プロジェクトから外して付け替える」確認モーダル（CLAUDE.md L327「ブラウザネイティブダイアログ禁止」遵守、キャラアイコン付きインアプリモーダル）

### ストア画面 `/skill-books`

- カード一覧（業界×目的、価格、引き出せるもののサンプル、表紙イメージ）
- 詳細画面でサンプル質問・想定する取材成果・対応キャラを表示
- 「購入する」ボタン → Stripe Checkout
- 所有済みは「所有中」バッジ表示

### 共通

- すべての画面でキャラアイコンを添える（CLAUDE.md L160 世界観原則）
- コピーは「お願い」温度。「装備」「アドオン」のような硬い言葉を避け「セットする」「入れ替える」を基本とする。ただし意味が曖昧になる言い換えはしない（CLAUDE.md L221）

---

## D. 状態

| 状態 | UI挙動 |
|---|---|
| 未所有 | 「購入する」ボタン |
| 所有・未装備 | 「セットする」ボタン |
| 所有・このプロジェクトに装備中 | 「セット中」表示 + 「外す」「入替」 |
| 所有・他プロジェクトに装備中（法人プラン） | 「他のプロジェクトで使用中」表示 + 「付け替える」確認モーダル |
| 購入処理中 | Stripe Checkout 画面へリダイレクト中表示 |
| 購入完了直後 | 「セットしますか？」誘導モーダル |
| 購入失敗 | 「購入できませんでした。もう一度お試しください」（CLAUDE.md L162 失敗時は次の行動を書く） |

---

## E. キャラ × skill-book の効き方

`skill_books.character_overrides` の構造:

```jsonc
{
  "mint":   { "perspective_addon": "...", "question_seeds": ["..."] },
  "claus":  { "perspective_addon": "...", "question_seeds": ["..."] },
  "rain":   { "perspective_addon": "...", "question_seeds": ["..."] },
  "hal":    { "perspective_addon": "...", "image_prompts": ["..."] },
  "mogro":  { "perspective_addon": "...", "yes_no_seeds": ["..."] },
  "cocco":  { "perspective_addon": "...", "question_seeds": ["..."] }
}
```

`buildCharacterSpecificContext()` で character_id をキーに引き、該当エントリだけ注入。エントリ未定義のキャラは素のまま（skill-book と相性が悪いキャラはあえて effect を入れない選択を残す）。

---

## F. 課金

### 既存実装の現状

- `app/api/stripe/checkout/route.ts` L70: `mode: 'subscription'` ハードコード
- `app/api/stripe/webhook/route.ts` L31, L102-L108: `session.mode !== 'subscription'` でフィルタしている

### Phase 4 での対応

1. `checkout/route.ts` を `mode` 引数対応に拡張。skill-book 購入時は `mode: 'payment'`、`metadata.skill_book_id` を含めて Checkout Session を作成
2. webhook に `checkout.session.completed` の `mode === 'payment'` 分岐を追加し、`user_skill_books` に行を作る（`stripe_payment_intent_id` UNIQUE で冪等性確保）
3. フロント側で所有済み判定して購入ボタンを隠す（誤クリックでの二重購入防止）
4. `charge.refunded` で `user_skill_books.revoked_at` を更新し、装備中なら `projects.equipped_skill_book_id` を NULL に戻す

CLAUDE.md L267「課金・認証・プラン判定変更は必ずレビュアーを通す」を遵守。実装後にレビュアーで以下を点検:

- 重複購入のレース条件
- 装備状態の差し替え悪用（同時装備の抜け道）
- 返金時の装備強制解除の整合性
- 法人プランで複数プロジェクトに同時装備しようとする攻撃ベクトル

---

## G. バリデーション / 制約

- 1プロジェクトにつき装備できる skill-book は最大1冊
- 同一ユーザー内で同じ skill_book_id を持つ projects は最大1件（部分 UNIQUE インデックス）
- 削除済み（`projects.deleted_at IS NOT NULL`）プロジェクトは制約から除外
- 返金された skill-book（`revoked_at IS NOT NULL`）は装備不可
- `status = 'draft'` の skill-book は購入不可（admin プレビューのみ）
- 無料プランでの購入可否は Phase 4 着手時にファイナンス と協議して決める

---

## H. エラー時の挙動

- 購入失敗: ストア詳細ページに留まり、キャラアイコン付きトーストで「購入できませんでした。もう一度お試しください」+ 再試行ボタン
- 装備失敗（同時装備制限抵触）: 「○○プロジェクトでセット中です。付け替えますか？」モーダル → 確認で元プロジェクトから外して当プロジェクトに装備
- 取材中に skill-book が返金等で revoke された場合: 装備を自動解除し、進行中の取材は素の状態で続行（取材を中断させない）

---

## I. 受け入れ条件

Phase 4 着手後の実装完了条件:

- [ ] `skill_books` `user_skill_books` テーブル作成と RLS 設定
- [ ] `projects.equipped_skill_book_id` カラム追加と部分 UNIQUE インデックス
- [ ] Stripe payment mode の Checkout / webhook 実装
- [ ] `/skill-books` ストア画面（一覧・詳細）
- [ ] `/projects/[id]` 設定タブの装備フロー
- [ ] AIキャスト の質問生成プロンプトへの注入（`contextParts` + `buildCharacterSpecificContext`）
- [ ] テスト skill-book を1冊 publish して、自社プロジェクトでドッグフーディング完走
- [ ] レビュアー による悪用耐性チェック合格
- [ ] ファイナンス による粗利試算と価格確定

---

## J. 注意点

- 装備中 skill-book の中身（character_overrides の量）が多すぎるとプロンプト長が膨れる。`lib/industry-hints.ts` の前例ヒントは skill-book 装備時にスキップして長さを抑える
- skill-book の差し替え後は、過去の取材ログとの相性が変わる可能性がある。次の取材から効くという前提で設計する（過去取材を遡って再評価しない）
- 業種特化を「商品」として売る以上、skill-book ごとの取材成果サンプルを公開できる状態まで磨いてから publish する
- skill-book は世界観の中で「キャストが学んできた専門書」として表現する（道具感のある UI / 表紙イラスト）

---

## 関連ファイル（参照のみ、Phase 4 着手時に変更する）

- `app/api/projects/[id]/interview/chat/route.ts` L141-L479
- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `lib/characters/prompt-builder.ts`
- `lib/characters/instructions.ts`
- `lib/industry-hints.ts`
- `lib/plans.ts`
- `supabase/migrations/20260417000004_projects.sql`
- `.claude/skills/skill-book-authoring/SKILL.md`（コンテンツ作成プロセス）
