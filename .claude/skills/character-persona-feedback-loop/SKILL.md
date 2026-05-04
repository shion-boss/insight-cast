---
name: character-persona-feedback-loop
description: Cast Talk と取材の両方のレビューから AIキャストの品質を改善するための合成・反映ワークフロー。本質 / 取材固有 / Cast Talk 固有 の3振り分けを軸に、本質ルールはキャラ正典に上げ、両用途に自動波及させる。ai-education-loop スキルに準拠する。
---

# キャラ人格・双方向フィードバックループ

## 目的

Insight Cast の AIキャストは、ユーザーへの取材と Cast Talk（公開記事用の対話）で**同一の人格**として振る舞う。
両方のレビューから得られる気づきを、

- **キャラ正典に上げるべき本質**
- **取材固有の運用ルール**
- **Cast Talk 固有の運用ルール**

の3つに振り分け、本質に上がったものは両用途に自動波及させる。

このスキルは、旧 `cast-talk-feedback-loop` を取材レビューも扱える形に汎用化したもの。

---

## 正典の構造

| 何 | どこ | 誰が管理 |
|---|---|---|
| キャラ正典（人格・観点・口調・反応・初手・倫理） | `lib/characters.ts` の `CHARACTER_PERSONAS` | AIデザイナー |
| 取材システムプロンプト（正典 + 取材ルール） | `lib/characters.ts` の `buildInterviewSystemPrompt(persona)` | AIデザイナー |
| Cast Talk 生成プロンプト（正典 + 編集ルール） | `lib/characters.ts` の Cast Talk 用ビルダー + `.claude/skills/cast-talk/conversation-prompt.md` | AIデザイナー |
| 共通インストラクション群 | `lib/characters.ts` の `IDENTITY` / `INSIGHT_CAST_KNOWLEDGE` / `RELATIONSHIP` / `PSYCHOLOGY` / `CONVERSATION_QUALITY` / `FACT_INTEGRITY` / `PRIVACY_SCOPE` / `INTERVIEW_SCOPE` / `SUFFICIENCY` | AIデザイナー |
| Insight Cast 共有知識（自社認識） | `lib/characters.ts` の `INSIGHT_CAST_KNOWLEDGE_INSTRUCTION`。CLAUDE.md のサービス記述と手動同期 | AIデザイナー |
| Cast Talk レビューの蓄積 | `cast_talk_reviews` テーブル | オペレーター（蓄積）、AIデザイナー（合成） |
| 取材レビューの蓄積 | `interview_reviews` テーブル（Phase B 以降） | オペレーター（蓄積）、AIデザイナー（合成） |
| 用途固有ルール（Cast Talk） | `.claude/skills/cast-talk/conversation-prompt.md` の `## 合成済み品質ルール` | AIデザイナー |
| 用途固有ルール（取材） | `lib/characters.ts` のビルダーまたは `lib/ai-quality.ts` の動的指示 | AIデザイナー |

**「キャラの言動・観点・倫理」は本質、「会話の構造・ターン設計・読み物としての構成」は用途固有。**

---

## トリガー条件

以下のいずれかを満たしたとき、AIデザイナーが合成を実行する。

- 未合成のレビュー（`cast_talk_reviews` または `interview_reviews`）が **合計5件以上**
- `overall_score` が3以下のレビューが **3件以上** 蓄積した
- オペレーターから「レビューが増えてきた」と報告があった
- ディレクターから月次の改善依頼があった
- 同じ系統の指摘が異なる用途（取材と Cast Talk）の両方から出た（**最優先**: 本質ルールに昇格できる強い兆候）

---

## 手順（ai-education-loop 準拠）

### Step 1. 症例収集

#### Cast Talk レビュー

`.env.local` の `NEXT_PUBLIC_SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を使って Supabase REST API を叩く:

```bash
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cast_talk_reviews?select=id,cast_talk_id,overall_score,naturalness_score,character_score,good_points,improve_points,created_at&order=created_at.desc&limit=30" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

#### 取材レビュー（Phase B 以降）

```bash
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/interview_reviews?select=id,interview_id,overall_score,character_score,question_quality_score,enjoyment_score,good_points,improve_points,reviewer_role,created_at&order=created_at.desc&limit=30" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

#### 共通の進め方

- 両方を取得し、improve_points が記入されているもの・低スコアのものを優先
- 該当 `cast_talk_id` / `interview_id` から実会話本文も参照する
- **実データが0件のときはフォーム構造から症例を「推定」しない。データがなければ合成を行わずに終了する**

---

### Step 2. 失敗の原因分類

ai-education-loop の分類軸に沿って分類する:

| 分類 | 具体例 |
|---|---|
| `prompt` | 禁止語が出た、口調が崩れた、結論を先に言いすぎた |
| `context` | 口調定義が届いていなかった、キャラ情報が不足していた |
| `rubric` | 「自然さ」の判断基準が評価者とシステムでずれている |
| `structure` | 会話のターン数・バランスが設計意図とずれた |
| `model` | 一貫性の崩れが generation の確率的ゆれに起因する |
| `ui` | 評価フォームの入力欄が曖昧で指摘内容がばらばら |

---

### Step 3. 合成（3振り分け）

#### 3-a. 本質 / 用途固有 の振り分け判断

各指摘について、次のチェック質問に答える:

- **Q1**: これは取材中にも Cast Talk 中にも起きうる問題か？
  - Yes → **本質候補**
- **Q2**: これは「キャラの言動・観点・倫理」の問題か？それとも「会話の構造・ターン設計・読み物形式」の問題か？
  - 言動・観点・倫理 → **本質**
  - 会話構造・ターン設計 → **用途固有**
- **Q3**: 同じ症例が他のキャラで出たら、同じ対応を取るか？
  - Yes（キャラ普遍）→ **共通インストラクション**へ
  - No（キャラ固有）→ **persona の該当キャラだけ**へ
- **Q4**: ユーザーが体験する価値の根幹に関わるか？
  - Yes → **本質**

#### 3-b. 反映先の決定

| 振り分け先 | 反映場所 |
|---|---|
| 本質・キャラ普遍 | `lib/characters.ts` の共通インストラクション（`PSYCHOLOGY_INSTRUCTION` / `FACT_INTEGRITY_INSTRUCTION` 等） |
| 本質・キャラ固有 | `lib/characters.ts` の `CHARACTER_PERSONAS[id]`（`reactions` / `voice.prohibitedPhrases` / `interviewOpeners` / `factIntegrity` 等） |
| 取材固有 | `lib/characters.ts` の `buildInterviewSystemPrompt` 内ビルダーまたは `lib/ai-quality.ts` の `buildInterviewQualityContext` の動的指示 |
| Cast Talk 固有 | `.claude/skills/cast-talk/conversation-prompt.md` の `## 合成済み品質ルール` セクション |

#### 3-c. 合成の原則

- 1回の合成で変えるルールは **最大3項目**まで
- 「もっと自然に」のような抽象語は使わない。具体例から書く
  - 悪い例: 「セリフをより自然にする」
  - 良い例: 「クラウスが『そういうことになりますね』と断定的に締めている症例が3件。`voice.speechStyle` を『〜かもしれないですね』寄りに調整」
- **本質に上げる場合は、両用途のシステムプロンプトに同じ趣旨が届くか必ず検証する**

#### 3-d. 合成結果の記述形式（ai-education-loop フォーマット）

```md
## AI教育ケース: 双方向合成 YYYY-MM-DD

### 症例
- cast_talk_reviews / interview_reviews から N件参照（overall_score 1〜3 が M件）
- 該当キャスト: ...
- 共通する症例: ...

### 何が弱かったか
- ...

### 原因分類
- prompt / context / rubric / structure / model / ui

### 振り分け判断（Q1〜Q4）
- 本質 / 取材固有 / Cast Talk 固有

### 改善仮説
- ...

### 変える場所
- 本質: lib/characters.ts の <該当インストラクション or persona フィールド>
- 取材固有: <該当ビルダー>
- Cast Talk 固有: .claude/skills/cast-talk/conversation-prompt.md の <該当セクション>

### レビュアー に見てほしいこと
- 既存ルールとの矛盾がないか
- 本質に上げた場合、両用途に意図せぬ副作用が出ないか
- 合成内容が特定のキャラに偏っていないか

### 次回の確認ポイント
- 合成後の生成3本（取材・Cast Talk 各）で改善されているか
```

---

### Step 4. レビュアーに渡す

- 上記フォーマットで `docs/review-log/` に起票する
- レビュアーが「既存ルールとの矛盾なし」「世界観チェックOK」「両用途への副作用なし」を確認したら承認
- AIデザイナーが独断で `CHARACTER_PERSONAS` や共通インストラクションを変更しない
- **本質ルール変更（PERSONA フィールド・共通インストラクション）は人間最終確認が必要**（CLAUDE.md 判断原則 7）

---

### Step 5. 承認後の反映

#### 本質変更の場合
1. `lib/characters.ts` を更新（`CHARACTER_PERSONAS` または共通インストラクション）
2. typecheck・lint を回す
3. 取材・Cast Talk の各 1本ずつ生成し、システムプロンプトと出力を確認
4. 旧 `.claude/skills/cast-talk/conversation-prompt.md` の合成済みルールに同等内容があれば、そちらを「→ 本質側に昇格済み」コメントで残し本文を縮小

#### 取材固有変更の場合
1. `lib/characters.ts` の `buildInterviewSystemPrompt` または `lib/ai-quality.ts` を更新
2. typecheck・lint
3. 取材 1本で確認

#### Cast Talk 固有変更の場合
1. `.claude/skills/cast-talk/conversation-prompt.md` の `## 合成済み品質ルール` に追記
2. ランタイム連結確認: `app/api/cast-talk/generate/route.ts` がこのセクションを読み込んでシステムプロンプトに連結しているか
3. Cast Talk 1本で確認

#### 全変更共通
- 生注入（`buildReviewContext` 等）の応急処置がある場合、合成済みルールと重複していれば削除する

---

## 既存13件レビューの再合成例（テンプレート）

2026-05-04 時点の `cast_talk_reviews` 13件を新ルールで再振り分けした参考事例。

| 指摘 | 件数 | 振り分け | 反映先 |
|---|---|---|---|
| A 相槌減少・楽しさ不足 | 2 | 本質（キャラ普遍）+ persona.reactions（キャラ固有） | `PSYCHOLOGY_INSTRUCTION` + `CHARACTER_PERSONAS[*].reactions` |
| B 質問の唐突さ・前置き不足 | 1 | 本質（キャラ普遍） | `CONVERSATION_QUALITY_INSTRUCTION` の「答えやすさ」セクション |
| C 締めの雑さ・読者ベネフィット欠如 | 1 | 本質（キャラ普遍） | `PSYCHOLOGY_INSTRUCTION`（終盤前向き）+ Cast Talk 品質ルール#3 |
| D 実績捏造・裏付けない数値 | 2 | 本質（キャラ普遍 + キャラ固有の例） | 新規 `FACT_INTEGRITY_INSTRUCTION` + `CHARACTER_PERSONAS[*].factIntegrity` |
| E 問いの質・専門知識の薄さ | 1 | 本質（キャラ固有） | `CHARACTER_PERSONAS[*].perspective.expertise`（活用は次フェーズ） |
| F 専門根拠の提示不足 | 1 | 本質（キャラ固有） | `CHARACTER_PERSONAS[*].perspective.expertise`（活用は次フェーズ） |
| G 守備範囲外への侵入 | 1 | 本質（キャラ固有） | `CHARACTER_PERSONAS[*].perspective.scope`（活用は次フェーズ） |

A・B・C・D は Phase A の正典化により両用途で即時改善。E・F・G は構造を持たせるだけで活用は次フェーズ。

---

## 担当と権限

| アクション | 担当 |
|---|---|
| 症例収集・合成・改善案作成 | AIデザイナー |
| 改善案のレビュー・承認 | レビュアー |
| 承認後のファイル反映 | AIデザイナー |
| **本質変更（CHARACTER_PERSONAS / 共通インストラクション）の最終確認** | **人間（CLAUDE.md 判断原則 7）** |
| 口調定義の大幅変更（キャラ設定の根幹に影響） | 人間に確認 |
| モデル変更・コスト影響の判断 | ファイナンスに確認 |

---

## 関連スキル

- `cast-talk-feedback-loop` — 旧スキル。本スキルに統合済。
- `ai-education-loop` — 上位プロセスフレーム
- `interviewer-attitude` — 取材姿勢の正典
- `interviewer-prompts` — 各キャラの旧プロンプト（Phase A 後は `CHARACTER_PERSONAS` を参照）
