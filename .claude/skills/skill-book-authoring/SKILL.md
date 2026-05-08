---
name: skill-book-authoring
description: skill-book 1冊を高品質に作るための共通フロー。業界×目的の組み合わせを決め、業界調査・取材成果想定・キャラ別重み付け・質問テンプレ・JSON 化・品質ゲート・ドッグフーディングまでを同じ型で回す。Phase 4 着手後に AIデザイナー が使う。Phase 2/3 中はドラフトとして寝かせる。
---

# skill-book Authoring

## 使う場面

- skill-book を新規に1冊作る時
- 既存の skill-book を改訂する時
- AIデザイナー が業界 × 目的の組み合わせを企画する時

## 前提

- skill-book の機能仕様は [`docs/specs/skill-book.md`](../../../docs/specs/skill-book.md) を参照
- 着手判断は [`docs/decisions/2026-05-08-skill-book-direction.md`](../../../docs/decisions/2026-05-08-skill-book-direction.md) を参照
- Phase 4 で着手。Phase 2/3 中は試作を寝かせる用途で使ってもよい

## 1冊作る共通フロー

### Step 1. 業界 × 目的の組み合わせを決める

- 業界軸の例: 塗装、整体、飲食、美容、教室、製造、士業
- 目的軸の例: ローカル集客、リピート促進、新規業態の発信、採用、価格表明示
- 組み合わせ例: ローカル×塗装、ダイエット×食事、採用×製造、リピート×美容
- **5系統に偏らないこと**。最初の数冊は属する業界もバラけさせ、汎用が崩れない範囲で広げる

### Step 2. 業界調査

既存スキルを組み合わせて業界の地図を作る。

- [`hp-analysis`](../hp-analysis/SKILL.md): その業界の典型的な HP 構成・足りていない情報パターン
- [`competitor-analysis`](../competitor-analysis/SKILL.md): 競合の発信内容・差別化ポイント
- [`blog-theme-analysis`](../blog-theme-analysis/SKILL.md): その業界のブログでよく語られるテーマ・語られていないテーマ

調査の出力:

- 業界用語と平均的な顧客語彙
- 顧客が事業者を選ぶ時の判断基準
- 競合がよく書いていること
- 競合がほぼ書けていないこと（一次情報の余白）
- その業界の事業者が「当たり前すぎて語っていない」典型項目

### Step 3. 想定取材成果を言語化する

「この skill-book を使って取材したら、何が引き出せれば成功か」を最初に決める。

- 取材後に出てくるべきエピソードの例（数字・場面・人物・実際の発言を含むもの）
- HP に乗せた時、読者の何が変わるか（信頼が増す / 価格に納得する / 問い合わせの障壁が下がる など）
- 想定する記事タイトル例3〜5本

### Step 4. キャラ別の重み付けをドラフトする

skill-book は **キャラごとに違う効き方** で設計する（[`docs/decisions/2026-05-08-skill-book-direction.md`](../../../docs/decisions/2026-05-08-skill-book-direction.md) 決定 #3）。

各キャラの専門ラベルを思い出して、業界 × 目的との相性を決める:

| キャラ | 専門 | この業界 × 目的で何を強化するか |
|---|---|---|
| ミント | 親しみやすい観点・お客様目線 | お客様目線で、業界×目的の現場での気配りや安心感を引き出す観点 |
| クラウス | 業界知識・判断基準 | その業界の判断基準・技術差・他社との違いを言語化させる観点 |
| レイン | マーケティング・差別化 | 業界×目的での差別化の核と訴求の打ち出し方 |
| ハル | 人柄・写真起点 | 写真から業界×目的の人柄・雰囲気・現場感を引き出す観点 |
| モグロ | はい/いいえ深掘り | 業界×目的の輪郭を Yes/No で外堀から埋める観点 |
| コッコ | 宣伝・告知 | 業界×目的での新サービス告知・キャンペーン設計 |

**相性が悪いキャラはあえて effect を入れない**選択を残す。例:「ダイエット×食事」では、コッコ（宣伝・告知）の重み付けはあえて空欄にして素のままで取材させる、など。

### Step 5. JSON 化する

`skill_books.context_payload` と `skill_books.character_overrides` を JSON で書く。

`context_payload`:

```jsonc
{
  "industry_glossary": ["..."],
  "judgment_criteria": ["..."],
  "competitor_topics": ["..."],
  "competitor_blind_spots": ["..."],
  "expected_outcomes": ["..."]
}
```

`character_overrides`:

```jsonc
{
  "mint":   { "perspective_addon": "お客様目線で、業界の現場での気配りを引き出す...", "question_seeds": ["..."] },
  "claus":  { "perspective_addon": "業界の判断基準と技術差を言語化させる...", "question_seeds": ["..."] },
  "rain":   { "perspective_addon": "...", "question_seeds": ["..."] },
  "hal":    { "perspective_addon": "...", "image_prompts": ["..."] },
  "mogro":  { "perspective_addon": "...", "yes_no_seeds": ["..."] },
  "cocco":  { "perspective_addon": "...", "question_seeds": ["..."] }
}
```

### Step 6. 質問テンプレを既存型に揃える

質問の書き方は既存のキャラペルソナ・指示と整合させる。

- `lib/characters/instructions.ts` の `IDENTITY` `CONVERSATION_QUALITY` `SUFFICIENCY` を読む
- `.claude/skills/interviewer-prompts/` のキャラ別ファイルを読み、各キャラの口調・初手・深掘り観点を踏襲する
- 質問は1ターンに1つ、1ターン3文以内、エピソード起点（[`interviewer-prompts/README.md`](../interviewer-prompts/SKILL.md)）

### Step 7. AIデザイナー × ユーザーで推敲

- AIデザイナー が試作を作る
- ユーザー（運営）が「業界の常識」「事業者が語らない当たり前」「競合が書いていない余白」の観点で添削する
- 質問が抽象（「品質」「丁寧」など）に流れていないかチェック
- 引き出される情報が「具体（数字・時期・場面・人物・実際の発言）」になる質問になっているか確認

### Step 8. レビュアー で品質ゲート

- 世界観整合（キャラの口調・温度感が崩れていないか）
- 取材品質（[`interview-quality`](../interview-quality/SKILL.md) 基準を通過するか）
- 引用価値（[`content-authority`](../content-authority/SKILL.md) の E-E-A-T 基準）
- 課金・所有関係の悪用耐性（CLAUDE.md L267 ルール）

### Step 9. ドッグフーディングで動作確認

- 自社の `insight-cast` プロジェクトに装備して、シオン本人 or 関係者で実取材
- 取材ログを `docs/review-log/` に保存
- 想定取材成果（Step 3）と実際の出力を比較
- ズレがあれば Step 4-6 に戻して調整

### Step 10. published に切り替えて販売開始

- `skill_books.status` を `published` に変更
- `published_at` を記録
- ストア画面 `/skill-books` で表示開始
- ファイナンス と価格を最終確認（粗利率・想定販売数）
- マーケター に発信協力を依頼（紹介経路 + SNS でのお披露目）

---

## 1冊あたりの想定工数

Phase 4 着手時に実測しながら更新する。Phase 2/3 中の参考見積:

- Step 1-2（企画・調査）: 半日〜1日
- Step 3-5（成果想定・JSON 化）: 1日
- Step 6-7（質問推敲・添削）: 1〜2日
- Step 8-9（レビュー・ドッグフーディング）: 1〜2日

合計の参考: **1冊あたり3〜6営業日**。汎用磨き込みが進んでいる前提なので、Phase 2 の Gate B 達成度合いで上下する。

---

## 落とし穴

- 「業界知識を全部詰め込もう」とすると context_payload が肥大化してプロンプト長が破綻する。1冊あたり調査結果の2〜3割を厳選する
- キャラの個性を上書きしてしまう書き方を避ける（perspective_addon は「追加観点」、口調指示や人格指示は書かない）
- 「業種特化キャラのプロンプト」をそのまま skill-book にしない。skill-book はキャラに重ね掛けるレイヤーであり、キャラ本体ではない
- 一次情報を持たない机上の業界知識だけで作ると、引き出される情報の質が下がる。ユーザー（運営）の業界経験・現場知見を Step 7 で必ず通す
- 競合の skill-book と被らせない。後発で「業界×目的が完全に同じ」skill-book を作らない（業界軸 or 目的軸のいずれかをずらす）

---

## 関連ファイル

- 機能仕様: [`docs/specs/skill-book.md`](../../../docs/specs/skill-book.md)
- 着手判断: [`docs/decisions/2026-05-08-skill-book-direction.md`](../../../docs/decisions/2026-05-08-skill-book-direction.md)
- 既存スキル: `hp-analysis` / `competitor-analysis` / `blog-theme-analysis` / `interview-quality` / `content-authority` / `interviewer-prompts`
- 注入ハブ実装: `app/api/projects/[id]/interview/chat/route.ts` / `lib/characters/prompt-builder.ts`
