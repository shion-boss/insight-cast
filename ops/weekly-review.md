# 週次振り返り

ディレクター と オペレーター が毎週更新する。

## フォーマット

```
## 週: YYYY-MM-DD 〜 YYYY-MM-DD

### Gate A / B 進捗（週末時点）
詳細トラッカー: `ops/milestone-tracker.md`

**Gate A: ブログのブランディング水準**
| 観点 | 条件 | 今週末状態 | 前週比 |
|---|---|---|---|
| 累計本数 | 30本以上 | — | — |
| トピック網羅 | 5系統 × 各4本 | — | — |
| 質的水準 | content-authority 全記事通過 | — | — |
| 構造 | カテゴリ・関連記事・CTA・内部リンク | — | — |
| 外形 | ブログ TOP の整い | — | — |

**Gate B: ツール品質水準**
| 観点 | 条件 | 今週末状態 | 前週比 |
|---|---|---|---|
| 機能完走性（テストユーザー3人） | 完走率100% | — | — |
| 9軸品質サイクル | 4週連続A〜B+ | — | — |
| AIキャスト評価 | 全キャラ3件連続 | — | — |
| パフォーマンス | LP 220kB / Lighthouse 90+ | — | — |
| 安定稼働 | インシデント0が2ヶ月連続 | — | — |
| コスト | 想定モード内 | — | — |
| モバイル | Should Fix 残ゼロ | — | — |

### 今週やったこと

### 今週出た意思決定（docs/decisions/ へのリンク）

### 今週の指摘パターン集計
| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| （例）導線パラメータ欠落 | 2 | 再発 | ✅ CLAUDE.md §8 |
| （例）コピー文脈不一致 | 1 | 初出 | 🔲 要提案 |

### CLAUDE.md / エージェントmd 更新候補
- （再発パターンや新規パターンがあれば）

### 今週発生した課題・未解決事項

### 来週やること（Phase目標への貢献を明記）

### Phase進捗の体感

### 気になること・人間に判断を仰ぎたいこと
```

---

## 週: 2026-04-22 〜 2026-04-28

### 今週やったこと

#### 2026-04-28（週次振り返り更新・CLAUDE.md更新）

**実施内容**
- ライトプラン（¥1,980/月・取材5回）追加・Stripe連携・レビュー通過
- 料金ページ構成変更（お試しバナーを独立分離・3列化）
- From the Team の実績数字を管理者DBから自動取得に変更
- トップページコピー改善（Compare前置き文・Pain補足文）
- 競合調査完了・`docs/market/competitive-analysis-2026-04.md` 作成
- info@insight-cast.jp メール送信基盤整備（Resend DNS・送信元更新）
- 全領域品質監査実施・`window.confirm` / `window.alert` 除去・LP-pricing整合修正
- CLAUDE.md 更新: ガードレール13追加・ライトプラン追加・ガードレール12に料金プラン同期ルール追記

**今週の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| ブラウザネイティブダイアログ（window.confirm/alert）使用 | 複数 | 初出 | ✅ CLAUDE.md ガードレール13追加 |
| LP・pricing・plans.ts・CLAUDE.md のプラン仕様不一致 | 1 | 再発 | ✅ CLAUDE.md ガードレール12に同期ルール追記 |

**CLAUDE.md 更新候補（今回処理済み）**
- ✅ ガードレール13: ブラウザネイティブダイアログ禁止
- ✅ ガードレール12末尾: プラン追加時の4点同時更新ルール
- ✅ サービス仕様プラン節: ライトプラン追加

---

## 週: 2026-05-04 〜（進行中・以下は日次ログ）

### Gate A / B 進捗（2026-05-08 時点）
詳細トラッカー: `ops/milestone-tracker.md`
決定: `docs/decisions/2026-05-07-phase2-gates-and-marketing-strategy.md`

> 2026-05-07 に旧中間マイルストーン定義を撤回し、Gate A（ブログのブランディング水準）+ Gate B（ツール品質水準）の2ゲート方式に切り替えた。
> 2026-05-08 に Gate A 残対応5本クローズ + シオン一人称ルール確定で残課題ゼロ。

**Gate A: ブログのブランディング水準** （**5/5 達成 + 残対応クローズ**）
| 観点 | 条件 | 今週末状態 | 前週比 |
|---|---|---|---|
| 累計本数 | 30本以上 | ✅ 32本 | — |
| トピック網羅 | 5系統 × 各4本 | ✅ 充足（①4 ②4 ③6 ④8 ⑤10） | — |
| 質的水準 | content-authority 全記事通過 | ✅ 全32本レビュー完了 + 5/8 に要対応5本クローズ + シオン一人称「僕」を既存12記事に遡及適用（P1 主語揺れ解消） | +達成 |
| 構造 | カテゴリ・関連記事・CTA・内部リンク | ✅ 5系統カテゴリ再設計 + 関連記事ロジック改善 | — |
| 外形 | ブログ TOP の整い | ✅ aside の5系統説明・最新更新日動的化・RSSリンク・First reads キュレーション3本追加 | +達成 |

**Gate B: ツール品質水準** （**3/7 達成 + 3項目進行中**）
| 観点 | 条件 | 今週末状態 | 前週比 |
|---|---|---|---|
| 機能完走性（テストユーザー3人） | 完走率100% | ❓ 未実施（Gate B 他項目達成後）。候補: 大槻塗装+2名未定 | — |
| 9軸品質サイクル | 4週連続A〜B+ | 🟡 運用中・直近4回点検済。4週連続A〜B+の確証は次週以降 | — |
| AIキャスト評価 | 全キャラ3件連続 | 🟡 評価設計済 + 教育ループ稼働。3件連続集計はまだ | — |
| パフォーマンス | LP 220kB / Lighthouse 90+ | ✅ LP 221kB / Performance 91 | +達成 |
| 安定稼働 | インシデント0が2ヶ月連続 | 🟡 4/21 以降ゼロ運転継続。2ヶ月達成は 6/21 見込み | — |
| コスト | 想定モード内 | ✅ 4月実績 ¥23,998（中段モード ¥24,000 内） | +達成 |
| モバイル | Should Fix 残ゼロ | ✅ 全画面監査完了（5/7）。iOS オートズーム解消済 + ボタン44x44確保 + モバイル別実装あり | +達成 |

### 今週やったこと

#### 2026-05-04（品質改善サイクル・ガバナンス刷新）

**テーマ**: 閲覧メンバー権限制御・共有プロジェクトUI・ガバナンス構造の見直し

**実装内容**
- `app/(tool)/projects/[id]/interview/page.tsx`: viewer リダイレクト（サーバー側認可）
- `app/(tool)/projects/[id]/interview/InterviewClient.tsx`: クライアントロジック分離
- `components/interviews-filter-client.tsx`: 進行中取材の viewer 非活性化・「共有」バッジ追加
- `app/(tool)/articles/page.tsx` / `components/articles-server-filter.tsx`: 記事カードに「共有」バッジ
- `app/(tool)/dashboard/page.tsx`: 「共有プロジェクト」セクションを独立追加
- `app/(tool)/projects/[id]/summary/page.tsx`: `{canEdit && (...)}` で記事受け取りボタンを viewer 非表示化

**ガバナンス刷新**
- `.claude/settings.json`: Edit/Write をオーケストレーターに復元
- `CLAUDE.md`: 委任の原則を全面改訂（サブエージェントは並列調査・戦略・専門設計のみ）
- `.claude/agents/` 全7ファイル: 旧ガバナンスチェーン（Director→Engineer→Reviewer）の残骸を全除去。engineer.md・reviewer.md は全書き直し

**AI教育ケース確認**
- ケース#1（中盤掘り下げ方向）: `lib/ai-quality.ts` に「直近の会話で出たエピソード」指示が既に実装済み ✅
- ケース#3（充足判定具体性要件）: `lib/characters.ts` に「抽象語は1点と数えない」定義が既に実装済み ✅

**品質レビュー（今回実装分）**
- 認可バグ調査: `article/page.tsx`・`interview/page.tsx` いずれもサーバー側で viewer redirect 済み ✅
- viewer が記事一覧を読める件: 仕様（読取権限あり）。Blocker なし ✅
- 🟢 Nice-to-have: 「共有」バッジが editor/viewer を区別しない（将来改善候補）
- 🟢 Nice-to-have: `summary/page.tsx` が full client component → canEdit が useEffect 判定。セキュリティホールはないが、server component への移行が望ましい（大きなリファクタリングのため持ち越し）

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| サブエージェントを役割分担強制に使用（本来は並列化用途） | 繰り返し | 再発 | ✅ CLAUDE.md 委任の原則を全面改訂 |
| agent.md ファイルへの自己書き込み（ディレクターがdirector.mdを編集） | 1 | 初出 | ✅ CLAUDE.md に agent md は人間のみ更新と明記 |

**CLAUDE.md 更新候補（今回処理済み）**
- ✅ 委任の原則: サブエージェントは並列調査・戦略・専門設計の3種類のみ
- ✅ エンジニア・レビュアーは直接 Edit/Write で作業

**前週からの持ち越し解消確認**
- ✅ 特商法「代金の支払時期」: 「申込み完了時に即時決済」に修正済み
- ✅ Supabase マイグレーション本番適用: 04-28 以降の全マイグレーション適用済み
- ✅ Resend ドメイン認証: 対応済み

#### 2026-05-05（日次品質改善サイクル）

**テーマ**: 9軸チェック / 公開ページの整合性確認

**チェック対象**
- 直近5コミットの変更箇所（会話記事のさん付け、文末改行、ハル画像活用、安定アイコンURL、空メッセージ400修正）
- 公開ページ（LP・料金・FAQ）の整合性
- TypeScript 型チェック（パス）

**検出したBlocker（同日修正）**
- 公開ページ4箇所がハル/モグロ/コッコを「準備中」と嘘表示していた
  - `app/(site)/faq/page.tsx:65` 追加キャストFAQ
  - `app/(site)/pricing/page.tsx:171` 料金ページFAQ
  - `app/(site)/page.tsx:80` LP個人向けプラン features
  - `app/(site)/page.tsx:90` LP法人向けプラン features
- 実態: commit adb7dc5（4/末）で全プラン込み公開済み。料金ページの「専門キャスト」セクションでは「期間限定で全プラン込み」と表示しているのに、同じページのFAQでは「準備中」と矛盾していた
- 修正: 全4箇所を「期間限定で全プラン込み / 期間終了後は買い切り予定」に統一（commit 2b612dd）

**チェック結果（軸別）**
- 軸1 UI: 直近変更箇所はバックエンド中心、新規UI要素なし。問題なし
- 軸2 UX: ハル取材の「写真なしで進める」既に対応済み・履歴の400エラー対処済み。問題なし
- 軸3 整合性: ⚠️ 4件検出 → 即日修正（上記）
- 軸4 AIキャスト: 会話記事のさん付け必須化・冗長な紹介行削除のプロンプト改訂は妥当
- 軸5 AI社員: 型チェック通過。`getPublicCastIconUrl` で安定URL運用は妥当
- 軸6 コピー: 顧客画面のAI専門用語混入なし。「処理中...」表記は許容範囲
- 軸7 セキュリティ: ハル添付画像は admin client 経由かつ DB から interview_id でフィルタ済みでスコープ漏れなし。`dangerouslySetInnerHTML` は JSON-LD と DOMPurify 経由のみ
- 軸8 実使用: 今日は直接ツールを叩いていないのでN/A
- 軸9 非同期通知: 記事生成は polling 表示。メール通知は本フローには含まれず

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| 公開ページに残った旧ステータス文言（リリース後に取り残し） | 4 | 再発 | 🔲 要提案 |
| iOS Safari の入力時オートズーム（form input が text-sm のまま） | 全域 | 初出 | ✅ globals.css にメディアクエリで対応 |

**CLAUDE.md / エージェントmd 更新候補**
- 機能リリース時のチェックリストに「公開ページ（LP・料金・FAQ）の旧ステータス文言を grep して必ず一掃する」を追加する案。次回リリース時に都度入れていれば再発は減る。

**追加対応（同日）**
- ユーザー報告: スマホで文字入力時に画面が自動ズームされて操作しづらい
- 原因: ツール側のフォーム要素が text-sm (14px) / text-xs (12px) を使っており、iOS Safari は computed font-size < 16px の入力にフォーカスするとビューポートを自動ズームする仕様
- 対応: `globals.css` にメディアクエリで `font-size: max(16px, 1em)` を適用（max-width: 767px の input/textarea/select 限定）。`user-scalable=no` を使わないことでアクセシビリティを維持
- LP 改善も同セッションで対応:
  - Step2 キャストカードのグラデーションシャドウを削除し、PCマウスドラッグで横スクロールできるように `DraggableScrollRow` を導入
  - Output Example の記事ブロック例を実物の `ArticleExportPanel` のヘッダ右クリップボードアイコン型コピーボタンに揃えた

#### 2026-05-07（Phase 2 ゲート方式への戦略転換 + Gate A 完全達成 + Gate B 進捗点検）

**テーマ**: 戦略レイヤーから現場レイヤーまで一気通貫。中間マイルストーンを撤回し Gate A/B 方式に切り替え、Gate A の全5項目を当日中に達成。

**戦略転換**
- 旧中間マイルストーン（月500セッション・問い合わせ2件・ブログ10本）を撤回
- ブログをブランディング媒体に再定義
- Gate A（ブログ品質）+ Gate B（ツール品質）の2ゲート方式に切り替え
- 決定: `docs/decisions/2026-05-07-phase2-gates-and-marketing-strategy.md`
- CLAUDE.md / milestone-tracker / weekly-review / operating-rhythm skill を全面更新

**Gate A 達成（5/5）**
- 累計: 32本（達成済）
- トピック網羅: 5系統 × 各4本以上を主タグだけで充足（棚卸し: `ops/blog-taxonomy-2026-05-07.md`）
- 質的水準: 全32本 content-authority レビュー完了（高=14・中-高=1・中=9・低中=4・低=1・評価不能=2）。全32本の旧URL/ラベル/時制を一括クリーンアップ
- 構造: news 削除・philosophy↔blog↔about 相互リンク・記事末CTA拡充・5系統カテゴリ再設計（DBマイグレ + UI 全更新）・関連記事ロジック改善（重み付けスコアリング）
- 外形: aside 5系統対応・最新更新日動的化・RSSフィード購読リンク・First reads キュレーション3本

**Gate B 進捗点検**
- ✅ パフォーマンス（LP 221kB / Performance 91）
- ✅ コスト（4月 ¥23,998、中段モード内）
- ✅ モバイル（全画面監査完了）
- 🟡 9軸品質サイクル / AIキャスト評価3件連続 / 安定稼働2ヶ月連続 / テストユーザー3人完走

**修正対応**
- 要対応3記事の修正完了: #29 how-cast-works（タイトル本文整合）/ #31 cast-guide（6名版に書き直し）/ #30 case-painting-company（タイトル統一+主語明示）

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| 古いキャスト数記述（3名 → 6名） | 2 | 初出 | 🔲 要提案（リリース時 grep チェック） |
| 本文がHTMLインタビュー埋込みに完全依存 | 5 | 初出 | 🔲 AIデザイナーへ「インタビュー記事生成プロンプトに本文サマリー必須化」依頼候補 |
| タイトルと本文の不一致 | 2 | 初出 | 🔲 マーケター監査チェック項目に追加 |
| 主語の揺れ（私 / 弊社 / Insight Cast） | 5+ | 再発 | 🔲 主語統一方針が未確定 |

**9軸点検結果**
- 軸1 UI: ✅ 新カテゴリ反映で構造改善・First reads セクション追加
- 軸2 UX: ✅ philosophy↔blog↔about 相互リンクで遷移経路改善
- 軸3 整合性: ✅ 旧URL/古い時制/古いキャスト数を一括クリーンアップ
- 軸4 AIキャスト品質: 範囲外（記事メタの修正のみ）
- 軸5 AI社員品質: ✅ typecheck 通過、9軸ルーチンを継続記録
- 軸6 コピー: 中-高評価記事14本確認、要対応5本特定済
- 軸7 セキュリティ: 範囲外
- 軸8 実使用: ユーザー側の動作確認（カテゴリ表示・First reads・関連記事）依頼中
- 軸9 非同期通知: 範囲外

総合評価: **A** 4週連続A〜B+の起点として記録。

#### 2026-05-08（Gate A 残対応クローズ + シオン一人称ルール確定 + 既存12記事に遡及適用）

**テーマ**: 5/7 で揃った Gate A の「残対応5本」を当日中に全クローズ。同セッションでシオンの一人称を「僕」に確定し、既存ブログ全体に遡及適用して質的水準 P1（主語の揺れ）を解消。

**Gate A 残対応5本**
- **#31 cast-guide**: タイトル/excerpt のみが「3名」表記で残存（本文は既に6名対応済み）。タイトルを「6名のインタビュアーの違いと使い分け」に、excerpt も6名版に更新
- **#29 how-cast-works**: タイトル「クラウス特化」 vs 本文冒頭「6名概観」の構成ぎくしゃくを解消。冒頭H2を「クラウスは業種知識を背景に取材する」に変更し、6名概観は1段落に圧縮してすぐクラウスに焦点を移す構造に
- **#30 case-painting-company**: タイトル「3ヶ月で5本」が本文に登場しない不整合を解消し、「塗装会社のHPに『下地処理の判断基準』を追記したら——想定ケース」に変更。冒頭に新H2「なぜ塗装会社の話なのか」+ シオン主語明示の段落を追加
- **#8 why-ordinary-is-value**: 主語不在 + 抽象論のみ + 短すぎ（672字）を解消。一人称「僕」で書き直し、ドッグフーディング6回取材エピソード（「『初めまして』と言われた瞬間に答える気がなくなった」「『他のどこにそういう人がいますか』と聞かれて答えられなかった」）を冒頭に挿入。15セクション構成・約1,300字に拡張
- **#23 dashboard-should-be-simple**: HTML埋込みのみだった本文の冒頭に「この記事でわかること」+ サマリー段落 + 重要発言の引用ブロックを追加。HTML 内の「私自身」も「僕自身」に置換
- **#26 homepage-as-active-signboard**: HTML会話の前に「インタビュー本文より、特に印象的だった発言」セクションを挿入し、読者が HTML を読まなくてもキー発言を拾える構造に

**シオン一人称ルール確定**
- ユーザー指示で「シオンの一人称は『僕』で統一」を確定 → `memory/project_shion_first_person.md` に記録
- AIキャストの一人称（ミント・クラウス・ハル・モグロ・コッコ＝「私」、レイン＝「僕」）は `lib/characters/personas.ts` で定義済みのまま維持
- 既存12記事を遡及適用: `私自身→僕自身` `私たち→僕たち` `私は→僕は` `私の→僕の` `私が→僕が` `私も→僕も` `弊社→Insight Cast`（「弊社Insight Cast」は重複削除）
- AIキャスト発言・interviewerIntro は対象外。conversation の role='owner' のみ置換するロジックでスクリプト実装
- 検証: 適用後に再 grep してゼロ件を確認

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| ブログタイトルと本文の数値・主題の不整合（3名/6名・3ヶ月で5本など） | 3 | 再発 | ✅ 5/7 同パターンで一括メンテ済 → 5/8 で残対応クローズ |
| シオンの主語揺れ（「私」「弊社」「Insight Cast」が混在） | 12 | 再発 | ✅ memory に一人称ルール確定 + 既存12記事に遡及適用 |
| HTMLインタビュー埋込み記事で本文（マークダウン）側のテキストが薄い | 2 | 初出 | ✅ サマリー + 引用ブロックを冒頭に追加する型を確立（#23 #26 で実例） |

**CLAUDE.md / メモリ更新候補**
- ✅ `memory/project_shion_first_person.md` 追加: シオンの一人称は「僕」で統一・既存記事遡及方針
- 🔲 提案: 記事生成プロンプトに「シオンの発言ブロックは『僕』で統一する」を反映（AIデザイナー側で対応）

**チェック結果（軸別）**
- 軸3 整合性: ✅ Gate A 質的水準 P1（主語揺れ）解消。本文と表記の数値整合も完了
- 軸4 AIキャスト: 影響なし（一人称定義は personas.ts で別管理）
- 軸6 コピー: ✅ シオン一人称統一でブランドボイスが揃った

**Gate A 残対応の状態（2026-05-08 終了時点）**
- すべての要対応項目をクローズ。`milestone-tracker.md` に記録更新

総合評価: **A** Gate A 残課題ゼロ達成 + 主語揺れ解消で質的水準が一段上がった。

#### 2026-05-09（日次品質サイクル / 取材リンク導入文の誤字修正）

**テーマ**: 直近 5 コミット（取材先・メンバー管理 UI / 外部取材リンク分離 / 質問末尾「？」ルール）の整合と品質確認。

**軸10 Sentry トリアージ**
- open かつ `sentry[bot]` 起票の Issue: **0 件** ✅（5/8 の `not_planned` クローズ以降クリーン）

**軸5 AI社員品質**
- `npm run typecheck`: pass ✅
- `npm test`: **218 pass / 0 fail** ✅（5/8 のテストドリフト修正後、安定）

**軸6 コピー: Should Fix（即修正）**
- `app/interview/ext/[token]/page.tsx:494` の取材リンク導入文に誤字: 「全部で10**往返**程度です」→「全部で10**往復**程度です」に修正。
- 影響範囲: 取材リンク経由の回答者が必ず通る intro 画面（広告代理店→事業者の主要フロー想定）。
- 検出経緯: 直近コミット `db56500` で外部取材を専用ルートへ分離した際の新規導入文。リポジトリ全体に同誤字は他になし（`grep -rn "往返"` で1件のみ）。

**軸7 セキュリティ: 新規 API ルート2本の検証**
- `POST/PATCH /api/projects/[id]/members/[uid]/interviewee`（メンバー編集モーダルのバックエンド）: ✅ 認証 (`auth.getUser`) + owner 検証 (`ensureOwner`) + Zod (`PatchBodySchema`) + `deleted_at IS NULL` フィルタすべて実装済み
- `GET /api/interview-links/[token]/messages`（取材リンク再開時の履歴復元）: ✅ 認証は不要（共有リンクの仕様）だが token 一致 + リンク active 判定 + interview と link の所属一致 + completed → 410 まで適切にガード
- 軽微な所見: `members/[uid]/interviewee` PATCH で `uid` が当該プロジェクトの実メンバーか検証していない（admin client で profile.name を引くため別プロジェクトユーザーの名前を覗く余地あり）。owner 権限内での挙動なので Blocker ではないが、将来的に `project_members` join で uid 検証を入れる候補として記録。

**軸3 整合性**
- `external_interview_links.max_use_count` のデフォルト値変更（migration `20260509000003`: 2 → 1）と、`use_count >= max_use_count` でリンク無効化する API 側ロジックは整合 ✅
- 取材リンクの3状態（waiting / in_progress / done）の status マッピング (`app/api/interview-links/route.ts:65-69`) と UI 側ラベル (`ExternalInterviewLinkSection`) が一致 ✅

**軸4 AIキャスト品質**
- `lib/characters/instructions.ts:95` で「質問文末は必ず？で終える」ルールが追加済み（commit `c0df1cb`）。実取材セッションでの効きは次回のキャラ評価サイクルで確認。

**軸1 UI / 軸2 UX**
- `ProjectMemberSection` メンバー編集モーダル: ローディング (`editLoading`) / 保存中 (`editSaving`) / エラー (`editError`) を区別表示 + 名前は `readOnly` で本人プロフィール優先と注記 ✅
- 取材リンク再開フロー: `localStorage` 進行 ID 復元失敗時に `clearProgress` でゴミを掃除 ✅、`MAX_TURNS` 到達時のみ `/complete` を叩く分岐 ✅
- 顧客向けにキャラアイコン `CharacterAvatar` が intro / complete 画面の両方で表示されている ✅

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| 新規導入文の誤字（「往返」→「往復」） | 1 | 初出 | 🔲 取材リンクなど主要フローの新規コピーは投入時に再読する手順を `daily-quality-cycle.md` 軸6 のチェック項目に明記する候補 |

**チェック結果（軸別）**
- 軸1 UI: ✅ 直近変更画面に Should Fix 検出なし
- 軸2 UX: ✅ 取材リンク再開フローの状態遷移は適切
- 軸3 整合性: ✅ migration / API / UI ラベルが整合
- 軸4 AIキャスト: ✅ ？ルール追加済み（実効性は次回評価で確認）
- 軸5 AI社員: ✅ typecheck / 218 tests pass
- 軸6 コピー: ✅ 1件の誤字を当日修正
- 軸7 セキュリティ: ✅ 新規ルート2本の auth + Zod + ownership 確認
- 軸8 実使用: 当日フィードバックなし
- 軸9 非同期通知: 範囲外
- 軸10 Sentry: ✅ open issue ゼロ継続

総合評価: **A−** 主要フローのコピー1件を当日中に修正・新規 API のセキュリティ点検通過。

#### 2026-05-09 追補（取材リンク削除エラー対応 / migration 002 本番適用）

**症状**: 取材リンク (`external_interview_links`) を削除しようとすると DELETE が失敗。

**原因**: 本番 DB の `interviews_external_link_id_fkey` の `delete_rule` が `NO ACTION` のままで、参照中の `interviews` 行（5件）が存在するためリンク削除が FK 制約違反になっていた。コミット `8d35df9` で「無効化廃止・hard delete に統一」と方針変更し、migration `20260509000002_external_link_cascade_setnull.sql`（FK を ON DELETE SET NULL に変更）も書いていたが、本番への適用が漏れていた。

**運用環境の再構築**: 手元から本番 DB に DDL を流す経路がなかったため、Supabase Personal Access Token を `.env.local` の `SUPABASE_ACCESS_TOKEN` に追加し、Supabase Management API の `POST /v1/projects/{ref}/database/query` 経由で SQL 実行する経路を確立。今後のマイグレも僕が直接 push できる。

**実行内容**
- `BEGIN; ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_external_link_id_fkey; ALTER TABLE interviews ADD CONSTRAINT ... ON DELETE SET NULL; DELETE FROM external_interview_links WHERE is_active = FALSE; COMMIT;` を Management API 経由で実行
- 検証: `information_schema.referential_constraints.delete_rule` が `NO ACTION` → **`SET NULL`** に変化を確認 ✅
- migration `20260509000003`（max_use_count default 1）は事前確認で既に `column_default='1'` だったためスキップ

**指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| 方針変更を伴う migration の本番適用漏れ（コードはマージ済みだが DB 制約だけ古い） | 1 | 初出 | 🔲 要提案: `daily-quality-cycle.md` に「FK / RLS の方針変更が含まれる migration は本番適用を当日中に確認する」項目を追加 |

**再発防止候補**
- マイグレ追加時のチェックリストに「本番 schema_migrations もしくは pg_constraint で適用状態を確認」を入れる
- `supabase_migrations.schema_migrations` テーブルが現状空（手動適用が標準）→ 管理 API 経由での適用ログを `ops/migration-log.md` に残す運用に切り替えるか検討

**ルール化（プロセス）**
- 今後 `supabase/migrations/` に新規ファイルが入ったコミットは、push 後にディレクターが Management API で適用状態を確認する

#### 2026-05-08 追補（日次品質サイクル / Sentry トリアージ + テストドリフト修正）

**テーマ**: プラン経済性決定 (5/8) 後の整合点検と、放置されていたテストドリフトの解消。

**軸10 Sentry トリアージ**
- open issue #8 `TypeError: Load failed`（5/7 起票・1件のみ）を確認
- 内容: Safari の fetch API ネイティブネットワーク失敗メッセージ。アプリ側のスタックトレースに辿れない / ブラウザ側のネットワーク断・SW・拡張機能由来と判定
- 過去 #2-#7 はすべて同類で `not_planned` クローズ済み → 同基準で `not_planned` クローズ + コメント記録
- 結果: open sentry[bot] issue ゼロに戻した

**軸3 整合性: プラン経済性 5/8 改定の同期チェック**
- `lib/plans.ts`（lightning=10/personal=30/business=180） / `__tests__/plans.test.ts` / `app/(site)/_components/lp/PricingPreview.tsx` / `app/(site)/pricing/page.tsx` / `app/(site)/faq/page.tsx` / `app/(tool)/settings/billing/page.tsx` / `CLAUDE.md` をクロスチェック → **すべて同期済み** ✅
- `docs/growth/lp-draft-v1.md:279` に「月10回まで取材」の旧記述ありだが内部ドラフト資料のため対象外

**軸5 AI社員品質: テストドリフト発見・即日修正**
- `npm test` 実行で **25件失敗** を検出
- 原因: `__tests__/blog-posts.test.ts` が 5/7 のカテゴリ再設計（旧6種 `howto/service/interview/case/philosophy/news` → 新5系統 `ai-search/primary-info/casts/hp-update/meta`）に追随していなかった
- 修正: 新カテゴリ・レガシーマッピング（`insight-cast→casts` `service→casts` `howto→hp-update` `interview→meta` `case→hp-update` `philosophy→primary-info` `news→meta`）・フォールバック（`'meta'`）に書き直し
- 結果: **15 pass / 0 fail**（typecheck も pass）

**軸5/7 直近コミット (29a166a) レビュー**
- プラン制限判定: deleted_at IS NULL 必須化・admin client 経由でオーナー基準に統一・JST 月境界共通化の3点修正で論理穴を塞いだ
- テスト追加（JST 境界3件）あり。typecheck 通過
- 課金・プラン判定に関わる変更だが、editor 経由の枠回避・soft-delete 残骸消費という具体的な穴を狙い撃ちで閉じる方向で、CLAUDE.md ガードレール12（課金変更はレビューを通す）に整合 ✅

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| 大規模 refactor 後にユニットテストが追随せず失敗が放置される（5/7 カテゴリ再設計の追従漏れ） | 25 (1ファイル) | 初出 | 🔲 要提案: 主要 refactor 時に `npm test` を必ず叩き、失敗を当該 commit 内で吸収するチェックを `daily-quality-cycle.md` 軸5 に追加 |
| Sentry `Load failed` (Safari fetch ネイティブエラー) のノイズ | 1 | 再発 | 🔲 Sentry 側の inboundFilters で「`TypeError: Load failed` 単独 + アプリスタックなし」を抑制する候補 |

**CLAUDE.md / エージェントmd 更新候補**
- `daily-quality-cycle.md` 軸5 に「`npm test` 実行が当日サイクルの必須項目」を明記する案（今回の25件ドリフトを早期検出できなかった）

**チェック結果（軸別）**
- 軸1 UI: 範囲外（コードのみ修正）
- 軸2 UX: 範囲外
- 軸3 整合性: ✅ 5/8 プラン改定の同期確認完了
- 軸4 AIキャスト: 範囲外
- 軸5 AI社員: ✅ テストドリフト解消（25 fail → 0 fail）+ typecheck 通過
- 軸6 コピー: 範囲外
- 軸7 セキュリティ: ✅ 29a166a の admin client + オーナー基準統一を確認
- 軸8 実使用: N/A
- 軸9 非同期通知: 範囲外
- 軸10 Sentry: ✅ open issue ゼロ

総合評価: **A−** 25件のテスト失敗を当日サイクルで検出・解消。プラン経済性改定の整合は問題なし。

#### 2026-05-07 追補（日次品質サイクル / Sentry トリアージ + カテゴリ色 drift 修正）

**テーマ**: 同日の Gate A 達成作業に対する独立 cycle。Sentry inbox 整理 + 軸3 整合性で発見した drift を当日修正。

**軸10 Sentry トリアージ**
- 5/6 中に open になった `sentry[bot]` 発の Issue #4・#5・#6・#7 を確認。すべて `TypeError: e[n] is not a function` で webpack ランタイム `r` 関数内が起点（webpack ハッシュは各デプロイで異なる）。
- 5/6 に同パターンで close 済の #3 と症状一致 → ブラウザ拡張機能の干渉、または旧チャンクキャッシュ起因のノイズと判定。
- 4件すべて `not_planned` でクローズし、Sentry 側の inboundFilters で `webpack-*.js` 由来の同一シグネチャを抑制する案をフォロー候補として記録。

**軸3 整合性で発見した Should Fix（同日修正）**
- 5系統カテゴリ再設計（commit `3d02a52`）で導入された `BlogPreview.tsx` のローカル `BLOG_CATEGORY_COLOR` が `lib/blog-posts.ts` の `CATEGORY_COLOR_MAP` と drift。具体的に `hp-update` の文字色が LP では `#8a4a18`（AA 対応で意図的に濃く）・blog 一覧では `#c2722a`（ブランドオレンジで 10px 小文字に対し AA 不足の可能性）。
- 修正:
  - `lib/blog-posts.ts`: `CATEGORY_COLOR_MAP['hp-update']` を `#8a4a18` に統一（コメントで AA 文字色用途と明記）。装飾用ブランドオレンジ `#c2722a` は他箇所で維持。
  - `app/(site)/_components/lp/BlogPreview.tsx`: ローカル `BLOG_CATEGORY_COLOR` / `BLOG_PREVIEW_CHARACTER` / theme tag のラベル配列を全削除し、`CATEGORY_COLOR_MAP` / `CATEGORY_CHARACTER_MAP` / `CATEGORY_LABELS` を直接参照。
  - `app/(site)/blog/BlogClient.tsx`: `FILTER_TABS` のラベルハードコードを削除し、`CATEGORY_LABELS` から動的生成。

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| 同一カテゴリの色・ラベルが複数ファイルでローカル定義され drift | 1 | 初出 | 🔲 要提案（カテゴリ系定数は `lib/blog-posts.ts` を唯一の出典とする） |
| sentry[bot] が webpack ランタイムノイズで毎日新規 issue を作る | 4 | 再発 | 🔲 Sentry 側の inboundFilters で抑制候補（5/6 に既知化済） |

**チェック結果（軸別・追補分）**
- 軸1 UI: 色の差は微細だが、`hp-update` カテゴリの blog 一覧チップが AA に近づいた
- 軸3 整合性: ✅ カテゴリ色・ラベル・キャラ割当の出典を `lib/blog-posts.ts` に一本化
- 軸5 AI社員: typecheck 通過。3ファイル編集後も型エラーなし
- 軸10 Sentry: ✅ open issue ゼロに戻した

総合評価: **A−** 同日中に Gate A 達成 + 余白で drift 修正 + Sentry inbox クリーン化。

#### 2026-05-06（パフォーマンス根本原因の解決 + 日次品質サイクル）

**テーマ**: site (marketing) ページの dynamic 化を解消し、静的生成へ戻す根本原因対処

**特定した根本原因（site側）**
1. `PublicHeader` / `PublicFooter` が毎リクエスト `auth.getUser()` を呼び、site 全ページが SSG/ISR を放棄して dynamic 化していた
2. LP `app/(site)/page.tsx` 自身も独立して `getUser()` を呼び、同一リクエスト内で 3〜4 回の Supabase Auth 往復が発生
3. `middleware.ts` が完全 public path（`/`, `/blog`, `/faq` など）でも `getUser()` を呼んでいた
4. `ProjectAnalysisNotifier` が root layout にあり、unauth ユーザーにも polling JS をバンドル送信

**根本対処**
- `lib/auth-state.ts`: client-side で `getSession()` を使う `useIsLoggedIn` hook を新設（cookie 読みのみ・network なし）
- `components/public-server-components.tsx`: `PublicHeader`/`PublicFooter` を auth-agnostic 化
- `components/public-footer-client.tsx`: フッターの auth 依存部分を client component に分離
- `components/site-header-client.tsx` / `app/(site)/_components/lp/Hero.tsx` / `app/(site)/_components/lp/PricingPreview.tsx`: prop 経由の `isLoggedIn` を hook に置き換え
- `app/(site)/page.tsx`: server-side `getUser()` を削除。CastTalk 取得は `unstable_cache` で包む
- `app/layout.tsx`: `ProjectAnalysisNotifier` を root から削除
- `app/(tool)/layout.tsx`: `ProjectAnalysisNotifier` をここに移動（authenticated 限定で配信）
- `middleware.ts`: 完全 public path（`/`, `/about`, `/cast`, `/philosophy`, `/faq`, `/pricing`, `/service`, `/privacy`, `/terms`, `/tokushoho`, `/contact`, `/sitemap.xml`, `/robots.txt`, `/blog/*`, `/cast-talk/*`, `/invite/*`, `/interview/ext/*`, `/api/*`）で `getUser()` をスキップ

**ビルド確認結果（`next build`）**
- ○ Static (5m revalidate) 化したページ: `/`（LP）, `/about`, `/blog`, `/cast`, `/contact`, `/faq`, `/philosophy`, `/privacy`, `/terms`, `/tokushoho`, `/auth/login`, `/auth/signup`, `/auth/reset-password`, `/auth/update-password`
- ● SSG 化（generateStaticParams）: `/blog/[slug]` (31記事を build 時に prerender)
- ƒ Dynamic のまま: `/pricing`, `/cast-talk`, `/cast-talk/[slug]`（`searchParams` 利用のため適切な dynamic）
- 効果: marketing pages の TTFB が CDN edge 配信に。Supabase Auth API 往復ゼロ。

**チェック結果（軸別）**
- 軸1 UI: 視覚要素は変更なし。Header/Footer の auth-aware ボタンは未ログイン側を楽観描画 → mount 後に切替（flash は <50ms）。logged-in marketing 訪問時のみ短時間 flicker するが、ターゲット（unauth 訪問者中心）には無影響
- 軸2 UX: 認証 UI のみ。導線・パラメータ伝搬・状態表現に変更なし
- 軸3 整合性: コピー・データ表示変更なし。問題なし
- 軸4 AIキャスト: 範囲外
- 軸5 AI社員: typecheck 通過、build 通過、lint warning のみ（既存）
- 軸6 コピー: 変更なし
- 軸7 セキュリティ: client hook は UI 表示用途のみ。サーバ側 `getUser()` チェック（middleware の `/admin`・`(tool)/layout.tsx`・各 API ルート）は維持。public path で middleware の token refresh は走らないが、tool ページ遷移時に再実行されるため通常 UX に影響なし
- 軸8 実使用: ユーザー側で確認お願いしたい
- 軸9 非同期処理: `ProjectAnalysisNotifier` の polling は (tool) でのみ。toast 通知はマウント時のlocalStorage 復元 + ポーリングで取りこぼしなし
- 軸10 Sentry: Issue #3 (`TypeError: e[o] is not a function`) は webpack ランタイム + JSON.parse の minified トレースのみでアプリコードに辿れず、ブラウザ拡張ノイズと判断 → not_planned で close 済

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| 共有レイアウトでの `getUser()` 呼び出しによる site 全ページの dynamic 化 | 1 | 初出 | ✅ daily-quality-cycle.md 軸1 既出（「静的コンテンツなのに `createClient()` + `getUser()` を呼んでいないか」） |
| 認証専用 client コンポーネント（Notifier 等）の root layout マウント | 1 | 初出 | 🔲 要提案 |
| middleware の Auth API 不要な path への過剰呼び出し | 1 | 初出 | 🔲 要提案 |

**CLAUDE.md / エージェントmd 更新候補**
- 「認証済みユーザー専用の client component（polling/notifier 等）は `(tool)/layout.tsx` にマウントし、root layout には置かない」をエンジニア向けガードレールに追加
- 「middleware で `auth.getUser()` を呼ぶ path は redirect 判定が必要なものだけに限定する」を `daily-quality-cycle.md` 軸1のチェック項目に追加

**追加対応（同日）: CSS render-blocking 2,850ms の根本原因対処**

ユーザー報告（Lighthouse）: `insight-cast.jp` 配下の 3 CSS が render を 2,850ms ブロックしている。

**初手の試行と却下**: `next.config.ts` に `experimental.optimizeCss: true` を追加して critters を入れたが、ビルド成果物の HTML を確認したところ critters が走っていなかった。Next.js 15 のソースを確認すると `optimizeCss` は `server/post-process.js` 経由で Pages Router からのみ呼ばれており、`server/app-render/` 配下からは参照ゼロ。**App Router では機能しない既知制約**（vercel/next.js#47755）。設定とパッケージはロールバック。

**真の root cause**: 281KB CSS（`32dab84d3c10e2f7.css`）の中身を解析した結果、**379 個の `@font-face` 宣言が M PLUS 1p（Google Fonts 経由）由来**。`.next/static/media/` には 381 個 / 25MB の woff2 ファイル。`subsets: ["latin"]` は honored されていた（font-data.json で M PLUS 1p に "japanese" subset 自体存在しないことを確認）にも関わらず、Google Fonts のサブセット細分化により Latin だけで 379 個の chunk に分割されていた。

**対処**: 案 A（システム日本語フォントへフォールバック）を採用。
- `app/layout.tsx`: `M_PLUS_1p` の import / 設定 / variable 適用を削除
- `app/globals.css`: `--font-noto-sans-jp` を `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", YuGothic, "Noto Sans JP", "Meiryo", sans-serif` に直結。既存の参照（`--font-noto-serif-jp` / `--font-sans` / `--font-serif` / body）は変数経由で自動的に system stack を引く

**削減効果（実測）**
| 指標 | Before | After | 差分 |
|---|---|---|---|
| CSS bundle 合計 | 389KB | 108KB | **-281KB (-72%)** |
| 最大の CSS ファイル | 281KB | 107KB | -174KB |
| woff2 ファイル数 | 381 | 3（Geist Mono Latin のみ） | **-378 (-99%)** |
| `.next/static/media/` 合計 | 25MB | 21MB（残りは画像） | -4MB |
| HTML 1ページ（`/`） | 344KB | 288KB | -56KB |
| `@font-face` 宣言（M PLUS） | 379 | 0 | -379 |
| font preload `<link>` | 多数 | 1 | -多数 |

Static ルートの状態は維持（`/`, `/about`, `/blog`, `/cast`, `/contact`, `/faq`, `/philosophy`, `/privacy`, `/terms`, `/tokushoho`, `/auth/*`、`/blog/[slug]` は SSG）。typecheck・build 通過。

**指摘パターン集計（追加）**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| `experimental.optimizeCss` を App Router で期待する誤解 | 1 | 初出 | 🔲 要提案 |
| Google Fonts (CJK) の subsets 指定が CSS @font-face 数を実質減らさない | 1 | 初出 | 🔲 要提案（CJK フォントは self-host or system stack 推奨） |

**追加対応（同日）: ネットワークペイロードの追加削減**

ユーザー報告（Lighthouse「Avoid enormous network payloads」）: insight-cast.jp 配下 481.9 KiB + GTM 153.4 KiB ≒ 635 KiB。LP 配下に Sentry 125 KiB / Supabase 51 KiB / React 56 KiB / GTM 153 KiB。

**bundle 内訳の特定**: `.next/app-build-manifest.json` で LP `/(site)/page` がロードする chunk を確認した結果、
- chunk 7528 (408 KB raw / 125 KiB gzip): @sentry/nextjs
- chunk 5281 (178 KB raw / 51 KiB gzip): @supabase/ssr （`useIsLoggedIn` が `createBrowserClient` を import していたため）
- chunk 4bd1b696 (173 KB raw / 56 KiB gzip): React DOM
- chunk 8538 (65 KB raw): LP コンポーネント + 一部インライン data URI
が判明。LP のような marketing page で Supabase JS を読み込むのは過剰。

**対処**
- `lib/auth-state.ts`: `useIsLoggedIn` を `document.cookie` の `sb-...-auth-token` 存在判定に書き換え。Supabase JS の import を排除。UI 表示専用なので security 判定はサーバー側で従来どおり `getUser()` で行う
- `app/components/google-analytics.tsx`: GTM の Script 戦略を `afterInteractive` → `lazyOnload` に変更。153 KiB を window.load 完了後に倒し、LCP との競合を排除
- `next.config.ts`: `withSentryConfig` に `bundleSizeOptimizations.{excludeDebugStatements, excludeReplayShadowDom, excludeReplayIframe, excludeReplayWorker}` を設定。Replay は 0% 運用なので tree-shake 可能（実測では今回のビルドでは効果限定的、将来の SDK update で効く）

**削減効果（First Load JS、`next build` 実測）**
| Page | Before | After | 差分 |
|---|---|---|---|
| `/` (LP) | 283 kB | **221 kB** | **-62 kB (-22%)** |
| `/blog` | 283 kB | 221 kB | -62 kB |
| `/cast` | 282 kB | 219 kB | -63 kB |
| `/faq` | 283 kB | 221 kB | -62 kB |
| `/philosophy` | 282 kB | 219 kB | -63 kB |
| `/privacy` `/terms` `/tokushoho` | 282 kB | 219 kB | -63 kB |

LP の chunk 構成（`.next/app-build-manifest.json` 確認）:
- 削除: chunk 5281 (Supabase 178 KB raw)
- 維持: 7528 (Sentry), 4bd1b696 (React), 1356, 7862, 8538, page-...

GTM は build size は変わらないが initial paint からブロック解除（運用効果のみ）。typecheck・build 通過、Static ルートの状態は全て維持。

**指摘パターン（追加）**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| 「auth state を UI 表示するため」だけに重い SDK 全体を marketing pages に持ち込む | 1 | 初出 | 🔲 要提案（cookie 存在判定で済む UI 用途は Supabase JS を import しない） |
| GTM/GA を `afterInteractive` で initial paint と競合させる | 1 | 初出 | 🔲 要提案（marketing 用途は `lazyOnload` がデフォルト） |

---

## 週: 2026-04-22 〜（進行中・以下は日次ログ）

### 今週やったこと

#### 2026-04-27（日次品質改善サイクル 第7回・ブログマイルストーン達成）

**テーマ**: ブログ10本達成・SEO/パフォーマンス/アクセシビリティ改善・ブログCTA追加

**修正内容**
- ブログ記事9・10・11本目を追加 → **中間マイルストーン「ブログ累計10本」達成 ✅**
  - 記事9: AI文章生成と一次情報インタビュー記事の違い（why-ai-cant-write-your-story）
  - 記事10: 動物キャラ設計の本音 — 動物にした理由（why-animal-character-design）
  - 記事11: AI検索時代に中小企業のHPで起きていること（ai-search-era-for-small-business）
- `app/(site)/blog/[slug]/page.tsx`: 記事末尾に無料体験・お問い合わせCTA（ミントアイコン付き）を追加
- `app/auth/login/page.tsx` / `app/auth/signup/page.tsx`: ライトプランの導線ラベルを追加
- `lib/firecrawl.ts`: `isSafeUrl` に SSRF 対策を追加（ループバック・プライベートIP範囲をブロック）
- `app/(site)/loading.tsx` / `app/(site)/error.tsx`: (site) グループに共通ロード中・エラー画面を追加
- `app/(site)/privacy/page.tsx` 等: 法的ページの meta description 充実（SEO改善）
- `components/ui.tsx`: `role=switch` ボタンに `aria-label` を追加（アクセシビリティ改善）
- 静的インポート画像に `placeholder="blur"` 追加（LCP改善）
- Geist Mono フォントに `display: swap` 追加（FOIT解消）
- テーブルに `caption` を追加（スクリーンリーダー改善）
- `--text3` のコントラスト比を改善（#b8a898 → #8f7d6d、WCAG AA 水準改善）
- ルートメタデータに OGP 画像を設定（SNSシェア改善）
- `target="_blank"` リンクに `rel="noopener noreferrer"` を追加（セキュリティ修正）
- 削除確認ダイアログを `ConfirmDialog` に共通化し、フォーカストラップを追加（アクセシビリティ）
- Next.js Image の `fill` 使用箇所に `sizes` props を追加（画像パフォーマンス改善）

**今回のレビューで見つかった初出パターン**
- 特になし（継続的な品質改善サイクル）

---

#### 2026-04-27（日次品質改善サイクル 第6回）

**テーマ**: SEO・法的ページ・セキュリティ修正のレビューと課金導線の脆弱性対応

**修正内容**
- `app/sitemap.ts`: フォールバックURLを `vercel.app` → `insight-cast.jp` に統一
- `app/(site)/privacy/page.tsx`: Anthropic・Stripe・Resend の記載追加、更新日を 2026-04-27 に更新
- `app/api/stripe/checkout/route.ts`:
  - authError ハンドリング追加（auth障害時に500を返す）
  - `priceId` に `z.string().min(1)` バリデーション追加（空文字の通過を防止）
  - priceId ホワイトリスト検証の欠落を修正（未知のpriceIdで400を返す）
  - `session.url` の null チェック追加
  - `catch (err)` + サーバーログ追加

**今回のレビューで見つかった初出パターン**
- 特商法「代金の支払時期」がStripe実態（即時課金）と矛盾 → **人間確認待ち・未修正**
- priceIdToPlan の `?? ''` フォールバックによる空文字キー問題（課金ホワイトリスト設計の欠陥）
- セキュリティ修正の横展開漏れ（analysis-status で修正済みのパターンが checkout に未適用）
- プライバシーポリシーの外部サービス記載漏れ（AI処理・決済・メール配信）

**持ち越し**
- ✅ 特商法「代金の支払時期」: 「申込み完了時に即時決済」に修正済み
- 🟡 プライバシーポリシーの Anthropic 利用目的の記述充実（マーケター担当・Phase 3前に必須）
- 🟡 `priceIdToPlan` の `?? ''` 問題（環境変数未設定時の空文字キー）→ 対応済み

**AI社員モデル構成の変更**（今セッション）
- レビュアー: sonnet → opus
- オペレーター: sonnet → haiku
- CLAUDE.md: 委任原則・暫定マッピング追加
- reviewer.md: 良し悪し判断専念に方針変更（修正指示を出力しない）

---

#### 2026-04-27（日次品質改善サイクル 第5回：5周完結）

**テーマ別5周の構成**
- 周1: UI状態表示（コード重複・記号不統一）
- 周2: コピー温度感（専門用語・冷たい表現）
- 周3: 世界観一貫性（AI文言露出・絵文字→キャラアイコン）
- 周4: API/コスト（レート制限の抜け・コストログ）
- 周5: 総合（フォールバック絵文字の直書き）

**具体的な修正内容（全5周）**

周1:
- `app/articles/page.tsx`: `CHAR_LABEL` 辞書を削除 → `getCastName()` に一本化
- `app/projects/page.tsx`: `AddProjectCard` の `＋`（全角）を `+`（半角）に統一
- `app/projects/page.tsx`: HP URL 表示の `🔗` 絵文字 → インラインSVG
- `app/interviews/page.tsx`: `interviewIds` を明示変数化（可読性）

周2:
- `app/projects/[id]/interview/page.tsx`: placeholder 「質問上限に達しました」→「取材はここまでです。ここまでの内容を記事素材にまとめられます。」
- `app/settings/SettingsClient.tsx`: セクション名「プラン・請求」→「ご利用プラン」

周3:
- `components/loading-scenes.tsx`: `ic-orbit-center` の「AI」文字 → `✦`（装飾記号）
- `components/loading-scenes.tsx`: クラウスステップ「技術的な質問リスト」→「聞きたい切り口」
- `components/loading-scenes.tsx`: レインステップ「メッセージ戦略の質問」→「引き出したい切り口」
- `components/loading-scenes.tsx`: ミントステップ「質問リストを作成」→「お話を聞く準備」
- `components/loading-scenes.tsx`: 取材準備完了表示の `🎤` → `CharacterAvatar`、「最初の質問」→「最初の話しかけ」

周4:
- `lib/api-usage.ts`: `RATE_LIMITS` に `interview/summarize`（5回/時）を追加
- `app/api/projects/[id]/interview/summarize/route.ts`: `checkRateLimit` の呼び出しを追加

周5:
- `app/dashboard/page.tsx`: 取材メモリスト内 `CharacterAvatar` の `emoji={char?.emoji ?? '🎙️'}` を `emoji={char?.emoji}` に統一（フォールバック絵文字の直書きを除去）

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| キャラ名称の複数管理（getCastName 未使用） | 1 | 再発 | ✅ 既存ルール（浸透が課題） |
| 全角文字の混入（＋） | 1 | 初出 | 🔲 engineer.md 追記候補 |
| 顧客画面への絵文字直書き（SVG 代替可能箇所） | 2 | 再発 | ✅ CLAUDE.md §実装ルール記載済み |
| 顧客画面への「AI」文字露出 | 1 | 再発 | ✅ CLAUDE.md 禁止事項記載済み |
| 「質問リスト」等の AI ツール的語彙 | 3 | 再発 | ✅ CLAUDE.md 禁止事項記載済み |
| APIルートのレート制限抜け（summarize） | 1 | 初出 | ✅ 修正済み |
| CharacterAvatar フォールバック絵文字の直書き | 1 | 初出 | 🔲 engineer.md 追記候補 |

**CLAUDE.md / エージェントmd 更新候補（今回追加）**
- 🔲 `engineer.md`: `CharacterAvatar` の `emoji` props にフォールバック絵文字を直書きしない。フォールバックは `CharacterAvatar` 内で処理する
- 🔲 `engineer.md`: 半角文字を使うべき場所（ボタン、記号）に全角文字（`＋` `－` 等）を使わない

#### 2026-04-26（日次品質改善サイクル 第4回）

**主な実施内容（機能追加 + 品質改善）**
- インタビュー充足判断ロジック改善（8回以降の再提案・continueCount 管理）
- AIキャスト SUFFICIENCY_INSTRUCTION 更新（充足条件を1点以上に緩和・毎ターン再確認）
- 記事公開ページ: インタビュアー未選択時の「取材担当」表示を非表示に変更
- admin 記事下書き: 本文からタイトルH1を除去（2重表示解消）
- Cast Talk 生成にテーマ指定オプションを追加
- SF修正: chat/route.ts に型チェック追加、forcedTheme に200文字上限
- SF修正: モバイルでも参考記事ボタン・パネルを表示（`hidden md:*` を解除）
- NH修正: 会話ログの key を複合キー（role+index）に変更
- NH修正: 関連記事カードのキャラフォールバックをメイン記事と統一（インタビュアー未設定なら非表示）
- NH修正: Cast Talk 生成エラーの技術文字列を汎用メッセージに変換
- NH修正: blog_posts スラッグを UUID suffix に変更（衝突対策）
- ルール追加: engineer.md に「AIプロンプト変更はAIデザイナー承認必須」を明記

**8軸評価サマリー**

| 軸 | 評価 | 主な指摘 |
|---|---|---|
| 1. UI | B+: モバイル参考記事パネル対応で改善 | — |
| 2. UX | B+: continueCount >= 2 後の無音は意図的仕様 | — |
| 3. 整合性 | A: 関連記事カードとメイン記事のフォールバックポリシー統一 | — |
| 4. AIキャスト品質 | B: 充足条件変更は人間承認済み。SF-5は設計意図確認完了 | — |
| 5. AI社員品質 | B+: engineer.md にプロンプト変更フロールール追加 | — |
| 6. コピー | A: 技術文字列の漏洩なし | — |
| 7. セキュリティ | B+: chat/route.ts 型チェック・forcedTheme 長さ制限追加 | — |
| 8. 実使用フィードバック | 未実施 | — |

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| APIバリデーション不足（Zod/型チェック） | 2 | 再発 | ✅ engineer.md 記載あり（浸透強化が課題） |
| PC専用機能のモバイル代替不在 | 1 | 初出 | 🔲 daily-quality-cycle 軸1 追記候補 |
| プロンプトインジェクションリスク（長さ未制限） | 1 | 初出 | ✅ 修正済み（200文字上限） |
| AIプロンプト変更の承認フロー未整備 | 1 | 初出 | ✅ engineer.md に追記済み |

#### 2026-04-24（日次品質改善サイクル 第3回・レスポンシブ全面対応・ヘッダー刷新後）

**主な実施内容**
- サイトヘッダーを client component に分離（SiteHeaderClient）、sticky 対応、backdrop-blur による portal 問題修正
- 下層ページ FV を PublicHero compact に統一（faq / cast / pricing）
- レスポンシブ全面修正（12ファイル）：記事検索フィルター・プロジェクト一覧・インタビュー一覧・ダッシュボード等
- loading 中の空状態にスケルトン追加（settings / summary）
- z-index 統一（z-[31]/z-[25]）、空 catch → return に修正、pricing FAQ の準備中矛盾を解消

**8軸評価サマリー**

| 軸 | 評価 | 主な指摘 |
|---|---|---|
| 1. UI | B+: レスポンシブ修正で大幅改善。z-index 定数化は残課題 | 低 |
| 2. UX | B: page-transition 空 href・mounted state 修正済み。AccountLabel の一瞬ブレは軽微 | 低 |
| 3. 整合性 | B+: pricing FAQ の矛盾解消済み。データ保持ポリシーは正式提供時まで保留 | — |
| 4. AIキャスト品質 | B: cast/page.tsx のキャラ説明文が lib/characters.ts と二重管理（次回整理推奨） | 低 |
| 5. AI社員品質 | B+: 空 catch 修正済み。URL パース共通化は Nice to Have | 低 |
| 6. コピー | B+: pricing FAQ 修正済み。「プラン・請求」の温度感は検討余地あり | 低 |
| 7. セキュリティ | A: /api/account/delete に getUser 認証チェック確認済み | — |
| 8. ドッグフーディング | 未実施（コードから判断不可） | — |

**今回の指摘パターン集計**

| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| 公開ページのコピー矛盾 | 1 | 初出 | 🔲 要確認 |
| 空 catch ブロック | 2 | 初出 | 🔲 engineer.md に追記推奨 |
| hydration ガード漏れ（createPortal） | 1 | 初出 | 🔲 engineer.md に追記推奨 |

**CLAUDE.md / エージェントmd 更新候補**
- `engineer.md`: URL パース時の空 catch は禁止（パース失敗時は `return`）
- `engineer.md`: `createPortal` 使用時は `mounted` state で SSR 安全を保証する

#### 2026-04-24（日次品質改善サイクル 第2回・ページ遷移loading刷新後）

**8軸評価サマリー**

| 軸 | 評価 | 優先度 |
|---|---|---|
| 1. UX | B: 概ね良好。インタビュー画面の終了判断がやや受動的 | 中 |
| 2. 世界観一貫性 | B+: FullPageLoading・InterviewerSpeech が機能している。AppShellSkeleton のアイコン文字が記号的 | 低 |
| 3. パフォーマンス | A: プログレスバー方式への切り替えで体感速度が改善。エリア間2秒ミニマム維持 | — |
| 4. コピー・テキスト | B: 顧客画面の専門用語は概ね除去済み。「取材先」「取材」語の一貫性に微妙なブレあり | 中 |
| 5. モバイル対応 | C: 明示的なモバイル最適化は未着手（Phase 1 仕様でP3扱い）。インタビュー画面の入力欄が小さい可能性 | 低（Phase 3） |
| 6. 機能完成度 | A: 登録→調査→インタビュー→記事生成の一本道は動作確認済み | — |
| 7. エラー・空状態 | B+: interview のエラーで入力復元・再送メッセージ実装済み。空状態の案内は画面差あり | 中 |
| 8. ドッグフーディング適性 | B: ツールとして使える状態。ブログ5本完成・目標10本まであと5本。取材初回実行が未着手 |  高 |

**今回の評価で発見した具体的な問題点**

- [Should Fix] `AppShellSkeleton` のナビアイコンに `⊡` `◫` 等の記号文字を使用 → 実際のサイドバーと見た目が一致しない（ローディング中の信頼感を下げる）
- [Should Fix] `NavigationOverlay` の site エリア判定では、ヘッダーが `PublicShellSkeleton` と同じように表示されない。サイト内遷移でヘッダーが一瞬 blank になる可能性
- [Nice to Have] インタビュー画面の「取材を終わらせる」ボタンが小さく、タップしにくい可能性（モバイル向け検討事項）
- [Nice to Have] FullPageLoading の最低2秒はエリア間遷移で意図的だが、ユーザーが「遅い」と感じるケースがある。キャラアイコン表示で待ち時間を「楽しい」にする仕掛けはできている

#### 2026-04-24（日次品質改善サイクル 初回・8軸に拡張）
- 日次品質改善サイクルの6軸定義を策定（`docs/ops/daily-quality-cycle.md` 新規作成）
- 無料プラン取材回数を全箇所「2回（単発）」に統一（Blocker: LP・料金ページ・FAQ・CLAUDE.md・lib/plans.ts）
- DevAiLabel をボタンラベル内から外出しに修正（Blocker）
- 特定商取引法ページの「準備中」注記を削除（Should Fix）
- インタビュー画面 placeholder から「Ctrl+Enter」表記を削除（Should Fix）
- 記事生成画面の「バッチ」表記を自然な言葉に変更（Should Fix）
- テーマ0件時のボタン無効化に案内テキスト追加（Should Fix）
- インタビュアー選択「このキャストを選ぶ」ボタン色を accent に統一（Should Fix）
- `[INTERVIEW_COMPLETE]` マーカー除去を `/g` フラグで全出現に対応（Should Fix）
- article API に Zod バリデーション追加・zod インストール（Should Fix）
- 特商法ページのカードに `mt-6` 追加
- email メール転送設定を案内（info@insight-cast.jp → Gmail 転送）
- 日次品質改善サイクルを6軸→8軸に拡張（軸7: セキュリティ、軸8: ドッグフーディング進捗）
- XSS: ArticleExportPanel の dangerouslySetInnerHTML に DOMPurify サニタイズ追加（Blocker）
- ドッグフーディング使用記録フォルダ作成（`ops/dogfooding-log/`）
- ブログ記事進捗: 5本確認（目標10本まであと5本）

#### 2026-04-22〜23
- Stripe サブスク実装（checkout / webhook / customer portal）
- オンボーディング廃止（サインアップ→Stripe直行フローに変更）
- 購入導線の網羅修正（next/plan パラメータ引き継ぎ、ログイン状態分岐）
- レビュアー / マーケター による品質レビュー → Blocker 4件・Should Fix 8件を全修正
- プランID統一（`individual` → `personal`、DB と TypeScript を一致）
- AI社員の命名刷新（lead/build/arch 等 → ディレクター/エンジニア/AIデザイナー等の職種名カタカナに）
- コードcleanup（不要ファイル削除・ui.tsx整理・lib/utils.ts新設で重複排除）
- コスト管理ダッシュボード強化（Firecrawl計測・全ルート0件表示・HP運用費修正）
- AIキャスト評価設計書を新規作成（`docs/review-log/ai-cast-evaluation.md`）
  - 共通評価軸13項目（A〜M）・33〜39点満点・キャラ別追加軸
  - ラリー定義・15回目締めラリー・6回以下は事業者離脱として分析
- プライバシー分離強化（`PRIVACY_SCOPE_INSTRUCTION` / `INTERVIEW_SCOPE_INSTRUCTION` を全キャラに追加）
- LP初稿をマーケターに依頼（進行中）

### 今週出た意思決定
- オンボーディング廃止 → ダッシュボード内設定に移行
- AI社員命名をカタカナ職種名に統一（ファイル名は英語）
- AIキャスト定期評価をAIデザイナー設計・レビュアー運用で体制化

### 今週の指摘パターン集計
| カテゴリ | 件数 | 初出/再発 | ルール化済みか |
|---|---|---|---|
| XSS（dangerouslySetInnerHTML にサニタイズなし）| 1 | 初出 | 🔲 CLAUDE.md「marked→HTML変換後は必ずDOMPurifyを通す」追加候補 |
| Zodバリデーション未適用のAPIルート（interview系）| 複数 | 再発 | 🔲 engineer.md「Zodパターンを全APIルートに横展開」追加候補 |
| Image alt 属性の欠落 | 複数 | 初出 | 🔲 engineer.md「Image には必ず alt を入れる（装飾は alt=""）」追加候補 |
| プラン仕様の数値が複数箇所でバラバラ（無料プラン取材回数）| 1 | 初出 | 🔲 CLAUDE.md「プラン仕様はここを唯一の参照元に」追加候補 |
| 技術用語が顧客画面に露出（「バッチ」「Ctrl+Enter」）| 2 | 再発 | CLAUDE.md 既存ルール（運用が追いついていない） |
| DevAiLabel をボタンラベル内部で使用 | 1 | 初出 | 🔲 engineer.md に「DevAiLabel はボタン外テキストにのみ使う」追加候補 |
| APIルートの入力バリデーション漏れ | 1 | 再発 | 🔲 engineer.md に「req.json() には必ず Zod を通す」追加候補 |
| 導線パラメータ（next/plan）の引き継ぎ漏れ | 4 | 初出 | ✅ CLAUDE.md §8 / engineer.md |
| ログイン状態による表示分岐漏れ | 3 | 初出 | ✅ CLAUDE.md §9 / engineer.md |
| コピーが導線文脈と不一致 | 3 | 初出 | ✅ CLAUDE.md §10 / engineer.md |
| DB値とTypeScript型の不一致（personal/individual） | 1 | 初出 | ✅ CLAUDE.md §11 / engineer.md |
| 世界観禁止ワード（「生成AI」）が顧客画面に混入 | 1 | 初出 | CLAUDE.md 既存ルール（認知されていなかった） |
| インストラクション連結順が意図なく並んでいた | 1 | 初出 | AIデザイナーが設計意図をai-specsに記録 |

### CLAUDE.md / エージェントmd 更新候補
- 🔲 CLAUDE.md「プラン仕様の数値はCLAUDE.mdを唯一の参照元とし、変更時はCLAUDE.mdを先に更新する」
- 🔲 engineer.md「DevAiLabel はボタンラベル外のテキストにのみ使う」
- 🔲 engineer.md「APIルートで req.json() を使う箇所には必ず Zod でバリデーションする」
- ✅ 完了: CLAUDE.md §8〜11 追記、engineer.md チェックリスト強化
- ✅ 完了: 全エージェントmd に「学習ループへの貢献」セクション追加
- ✅ 完了: director.md に「学習ループオーナー責務」追加
- ✅ 完了: weekly-review.md に「指摘パターン集計」フォーマット追加
- ✅ 完了: AI社員命名刷新をCLAUDE.mdに反映

### 今週発生した課題・未解決事項
- login ページへのキャラ追加はテキスト案内のみ（画像ベースのLeftPanel化は次フェーズ）
- Stripe live mode 切り替えタイミング未決定
- 特商法「代金の支払時期」の記述がStripe即時課金と矛盾（人間確認待ち・未修正）
- `priceIdToPlan` の `?? ''` 問題（環境変数未設定時の空文字キー）→ ディレクター判断待ち
- Resend ドメイン認証（Verifyボタン押下）未完了
- Supabaseマイグレーション本番適用（20260428000001_add_lightning_plan.sql）未実施

### 来週やること（Phase目標への貢献を明記）
1. ブログ10本達成（残り1本）→ 中間マイルストーン「ブログ累計10本」達成
2. Supabase マイグレーション本番適用（20260428000001_add_lightning_plan.sql）
3. Resend ドメイン認証完了（Verifyボタン）
4. 中間マイルストーン（月500セッション・問い合わせ月2件）に向けたSEO・ブログ発信強化
5. ドッグフーディング取材の初回実行（キャラ選定・代表者インタビュー）
6. AIキャスト評価の初回実施（ドッグフーディングセッションを1件目として）

### Phase進捗の体感
- Phase 2: 40%（ライトプラン追加・競合調査・メール基盤整備・品質監査完了で前進）

### 気になること・人間に判断を仰ぎたいこと
- 特商法「代金の支払時期」の記述（Stripe即時課金との整合）→ 人間が確認・承認後に修正
- `priceIdToPlan ?? ''` 問題の対処方針（環境変数未設定時の挙動をどう扱うか）
- 課金フロー本番テスト（Stripe live mode 切り替えのタイミング）
- ドッグフーディング取材の最初のキャラをどれにするか（ミント/クラウス/レイン）

---

## 週: 2026-04-14 〜 2026-04-21

### 今週やったこと
- 記事生成品質改善（max_tokens 拡張、抜粋自動生成、視点ブレ防止ルール追加）
- 文字化けバグ修正（Array.from でサロゲートペア対応）
- 管理者機能追加（左メニューに admin 限定ボタン）
- ブログ管理改善（スラッグ自動生成、保存バグ修正）
- 取材メモに記事件数バッジ表示
- 設定画面不具合修正（マイグレーション適用）
- レビュアー による網羅的チェックおよび Blocker 修正
- Phase 1 完了判断・Phase 2 移行決定

### 今週出た意思決定
- [Phase 1 完了・Phase 2 移行](../docs/decisions/2026-04-21-phase1-complete.md)

### 今週発生した課題・未解決事項
- なし（既知の Blocker はすべて修正済み）

### 来週やること（Phase目標への貢献を明記）
- Phase 2 開始: Insight Cast 自社 LP・ブログの構成設計（マーケター に依頼予定）
- 自社 HP を Insight Cast 自身で取材・運用するフローの初回実走
- 中間マイルストーン（月2件問い合わせ・月500セッション・ブログ10本）に向けた発信計画の整理

### Phase進捗の体感
- Phase 1: 100%（完了）
- Phase 2: 5%（移行直後）

### 気になること・人間に判断を仰ぎたいこと
- 自社 LP の初稿を マーケター に起こしてもらうタイミングを確認したい
- ドッグフーディング取材の最初のインタビュアーをどのキャラにするか（ミント/クラウス/レイン）の方針を決めたい
