# 週次振り返り

ディレクター と オペレーター が毎週更新する。

## フォーマット

```
## 週: YYYY-MM-DD 〜 YYYY-MM-DD

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

## 週: 2026-04-22 〜（進行中・以下は日次ログ）

### 今週やったこと

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
- 🔴 特商法「代金の支払時期」修正（Stripeの課金タイミングを人間が確認後に対応）
- 🟡 プライバシーポリシーの Anthropic 利用目的の記述充実（マーケター担当・Phase 3前に必須）
- 🟡 `priceIdToPlan` の `?? ''` 問題（環境変数未設定時の空文字キー）→ ディレクター判断待ち

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
- `app/dashboard/page.tsx`: 取材履歴リスト内 `CharacterAvatar` の `emoji={char?.emoji ?? '🎙️'}` を `emoji={char?.emoji}` に統一（フォールバック絵文字の直書きを除去）

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
