---
name: cast-talk-feedback-loop
description: cast_talk_reviews に蓄積されたレビューを AIデザイナーが定期合成し、Cast Talk 生成プロンプトを改善するワークフロー。ai-education-loop スキルに準拠する。
---

# Cast Talk フィードバック合成ループ

## 目的

`cast_talk_reviews` テーブルに蓄積されたレビュー（overall_score / naturalness_score / character_score / good_points / improve_points）を、生のままプロンプトに注入する応急処置から脱却し、AIデザイナーが合成した改善ルールとして `conversation-prompt.md` に反映する。

---

## 正典の構造

| 何 | どこ | 誰が管理 |
|---|---|---|
| インタビュー人格プロンプト（ミント/クラウス/レイン） | `lib/characters.ts` の `SYSTEM_PROMPTS` | AIデザイナー |
| Cast Talk 口調定義（一人称・語尾・禁止語） | `lib/characters.ts` の `CAST_TALK_VOICE` | AIデザイナー |
| Cast Talk 生成プロンプト（編集担当・会話ルール） | `.claude/skills/cast-talk/conversation-prompt.md` | AIデザイナー |
| 品質評価・改善指摘の蓄積 | `cast_talk_reviews` テーブル | オペレーター（蓄積）、AIデザイナー（合成） |
| 合成後の品質ルール追記先 | `.claude/skills/cast-talk/conversation-prompt.md` の `## 合成済み品質ルール` セクション | AIデザイナー（提案）+ 人間（承認） |

**インタビュー人格プロンプトとCast Talk 生成プロンプトは目的が異なるため、完全に同一にはしない。**  
ただし口調の一貫性（`CAST_TALK_VOICE`）は共通の単一ソースとして維持する。

---

## トリガー条件

以下のいずれかを満たしたとき、AIデザイナーが合成を実行する。

- `cast_talk_reviews` の未合成件数が **5件以上** になった
- `overall_score` が 3以下のレビューが **3件以上** 蓄積した
- オペレーターから「レビューが増えてきた」と報告があった
- ディレクターから月次の改善依頼があった

---

## 手順（ai-education-loop 準拠）

### Step 1. 症例収集

```sql
SELECT cast_talk_id, overall_score, naturalness_score, character_score,
       good_points, improve_points, updated_at
FROM cast_talk_reviews
ORDER BY updated_at DESC
LIMIT 30;
```

- `cast_talk_id` から実際の会話本文も参照する（`cast_talks.messages`）
- スコアが低い（1〜2）もの、improve_points が記入されているものを優先

### Step 2. 失敗の原因分類

ai-education-loop の分類軸に沿って各指摘を分類する:

| 分類 | 具体例 |
|---|---|
| `prompt` | 禁止語が出た、口調が崩れた、結論を先に言いすぎた |
| `context` | 口調定義が届いていなかった、キャラ情報が不足していた |
| `rubric` | 「自然さ」の判断基準が評価者とシステムでずれている |
| `structure` | 会話のターン数・バランスが設計意図とずれた |
| `model` | 一貫性の崩れが generation の確率的ゆれに起因する |
| `ui` | 評価フォームの入力欄が曖昧で指摘内容がばらばら |

### Step 3. 合成

同じ分類の指摘を束ねて「最小のルール変更」に落とし込む。

**合成の原則:**
- 1回の合成で変えるルールは最大3項目まで
- 「もっと自然に」ではなく具体的な症例から書く
  - 悪い例: 「セリフをより自然にする」
  - 良い例: 「クラウスが『そういうことになりますね』と断定的に締めている症例が3件。『〜かもしれないですね』に変える」
- 口調の変更は `lib/characters.ts` の `CAST_TALK_VOICE` と同期すること
- プロンプト文字列の変更は `conversation-prompt.md` の `## 合成済み品質ルール` セクションに追記する

**合成結果の記述形式（ai-education-loop フォーマット）:**

```md
## AI教育ケース: Cast Talk 口調合成 YYYY-MM-DD

### 症例
- cast_talk_reviews から N件のレビューを参照（overall_score 1〜3 が M件）

### 何が弱かったか
- ...

### 原因分類
- prompt / context / rubric / structure / model / ui

### 改善仮説
- ...

### 変える場所
- `.claude/skills/cast-talk/conversation-prompt.md` の `## 合成済み品質ルール` セクション
- （口調変更の場合）`lib/characters.ts` の `CAST_TALK_VOICE`

### レビュアー に見てほしいこと
- 既存ルールとの矛盾がないか
- 合成内容が特定のキャラに偏っていないか

### 次回の確認ポイント
- 合成後の生成3本で改善されているか
```

### Step 4. レビュアーに渡す

- 上記フォーマットで `docs/review-log/` に起票する
- レビュアーが「既存ルールとの矛盾なし」「世界観チェックOK」を確認したら承認
- AIデザイナーが独断で `conversation-prompt.md` や `CAST_TALK_VOICE` を変更しない

### Step 5. 承認後の反映

1. `conversation-prompt.md` の `## 合成済み品質ルール` セクションに追記する
2. 口調変更がある場合は `lib/characters.ts` の `CAST_TALK_VOICE` も同時に更新する
3. `generate/route.ts` の `DEFAULT_CONVERSATION_SYSTEM` の口調ルール記述も同期する
4. 生注入（`buildReviewContext`）の出力が合成済みルールと重複・矛盾していれば削除または縮小する

---

## 生注入との関係

`app/api/cast-talk/generate/route.ts` の `fetchRecentReviews` / `buildReviewContext` は応急処置。

**削除の判断基準:**
- `conversation-prompt.md` の `## 合成済み品質ルール` セクションに、生注入で伝えているのと同等の内容が書かれたら、対応する生注入を削除する
- 全レビューの合成が完了して生注入の必要がなくなれば、`fetchRecentReviews` と `buildReviewContext` ごと削除してよい（ファイナンスと相談してAPIコスト削減効果も確認する）

---

## 担当と権限

| アクション | 担当 |
|---|---|
| 症例収集・合成・改善案作成 | AIデザイナー |
| 改善案のレビュー・承認 | レビュアー |
| 承認後のファイル反映 | AIデザイナー |
| 口調定義の大幅変更（キャラ設定に影響する変更） | 人間に確認 |
| モデル変更・コスト影響の判断 | ファイナンスに確認 |
