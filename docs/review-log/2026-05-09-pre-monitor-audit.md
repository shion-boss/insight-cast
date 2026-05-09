# 監査結果 2026-05-09 / フレンドリーモニター招待前チェック

> **このレポートは前回（2026-05-09 02:31〜02:48）のセッションがコンテキスト肥大で途中停止したため、JSONL から findings を抽出して再構成したもの。** 4本の Explore エージェント並列調査 + 主要導線の手動深掘り + 短時間のブラウザ実踏が完了した状態の成果物。レポート整形（task 8）の途中で落ちたが、調査内容自体は失われていなかった。

## 対象範囲

**含む:**
- サイト側（公開）: LP / pricing / cast / faq / about / blog / signup / login / 特商法 / 利用規約 / プライバシー
- ツール側（ログイン後）: ダッシュボード / プロジェクト / 自社HP調査 / 競合調査 / インタビュアー選択 / 取材（テキスト・Y/N・画像） / 取材リンク / 記事生成・編集 / settings / cast-talk
- 横断観点: 状態の見え方 / ローディング / 文字サイズ / キャラアイコン / URL params / ログイン分岐 / 専門用語

**除外:**
- admin 画面（モニターは見ない）
- 課金本番フロー（テストモード通過確認のみ）
- skill-book / 業種特化（Phase 4）
- 細かいパフォーマンス / SEO / アクセシビリティ監査

---

## 結論サマリ

**Go/No-Go 判定: 条件付き GO。** 致命的な P0 は限られており、以下の P0 を修正してからモニター 1 人目に声をかけるのが安全。サイト側・モバイル・文字サイズ・世界観・ガードレール13 は全て通過済み。

### 確定 P0（モニター招待前に必ず修正） — 3件

| # | 内容 | 場所 |
|---|---|---|
| P0-A | インタビュー画面の初期化失敗時、再読み込みボタンがない（手動でブラウザリロードする必要） | `app/(tool)/projects/[id]/interview/InterviewClient.tsx:271-275` |
| P0-B | 記事生成画面でテーマ選択肢の読み込み失敗が無声（白い画面のまま） | `app/(tool)/projects/[id]/article/ArticleClient.tsx:113-114, 149-150` |
| P0-C | Stripe Webhook の `.single()` 失敗時にエラーハンドリング・ログがなく、データ不整合のリスクがある | `app/api/stripe/webhook/route.ts:60-84` |

### Explore が P0 として挙げたが、手動深掘りで誤検出と確認したもの — 3件

これらは**修正不要**。記録だけ残す。

| 当初の指摘 | 実際 |
|---|---|
| `/api/admin/**` 全ルートで checkIsAdmin 漏れ | 全 admin API は middleware + checkIsAdmin の二段で保護されている |
| 外部インタビューリンク token の暗号強度不足 + 推測攻撃可能性 | token は 128bit ランダム + middleware で 60req/min の rate limit あり |
| 外部リンク無効時 (`linkInfo.valid === false`) に真っ白画面 | 無効時 UI 実装あり（ただしキャラアイコン不在 = P1-X として別計上） |

### P1（体験を損なう / 修正してから募集が望ましい） — 9件

ツール側状態管理:
- **P1-1** インタビュー実行中の「送信中」表示が `loading` と `streamingMessage` の二重管理で分散（ガードレール4抵触） — `InterviewClient.tsx:95-175 + InputArea`
- **P1-2** 記事編集画面で「保存中 / 保存済み / 失敗」の区別が不明確、失敗後の再送導線も曖昧 — `ArticleClient.tsx:115-118`
- **P1-3** 設定画面の複数セクションが各々 `{Saving, Saved, Error}` を独立管理しており、どこが保存済みか把握しづらい — `SettingsClient.tsx:135-159`
- **P1-4** ダッシュボード / projects / interviews / articles の空状態が画面ごとに微妙に違い、共通コンポーネント化されていない（ガードレール6抵触） — `dashboard/page.tsx:410-411,524-569` ほか
- **P1-5** プロジェクト一覧でロック中プロジェクトの「取材不可」が `<span>` 文字列だけで、押せない理由が視覚的に伝わらない（ガードレール3抵触） — `projects/page.tsx:337-347`
- **P1-X** 外部取材リンク無効時 UI にキャラアイコンがない（世界観原則抵触） — `app/interview/ext/[token]/page.tsx`

サイト側:
- **P1-6** 料金ページの比較表セクション見出しが `Plan Comparison`（英語）。日本語統一されている他箇所と齟齬 — `pricing/page.tsx:415`
- **P1-7** PainSection に未対応の TODO コメント残存（統計数値の根拠未確認） — `app/(site)/_components/lp/PainSection.tsx:35`

セキュリティ・モバイル:
- **P1-8** Stripe `checkout-redirect?plan=...` の plan パラメータが Zod 検証されていない（手動チェックのみ） — `api/stripe/checkout-redirect/route.ts:13-19`
- **P1-9** signup → Google OAuth → callback で plan パラメータが消失。Stripe checkout に渡らない可能性（ガードレール8抵触） — `auth/callback` 周辺
- **P1-10** invite token の再利用判定がない（一度使っても token が consumed にならない可能性） — `auth/callback:52`
- **P1-11** site/loading.tsx が `aria-busy` だけで視覚的ローディングなし、Suspense fallback で空白の可能性（ガードレール14抵触） — `app/(site)/loading.tsx`

### P2（後でいい・記録のみ） — 6件

- **P2-1** インタビュー再開時のパスストリーク復元ロジック（`ivCount - usrCount - 1`）が読みにくい。ヘルパー関数化推奨 — `InterviewClient.tsx:208-211`
- **P2-2** `CONVERSATION_BLOCKED_CASTS = new Set(['mogro'])` がクライアントにハードコード。`lib/characters.ts` に移すべき — `ArticleClient.tsx:97`
- **P2-3** SettingsClient のアバターアップロード後の表示パスがコード上見えない（署名URL fetch なし？） — `SettingsClient.tsx:192-260`
- **P2-4** 外部取材リンクの localStorage 進捗保存にタイムスタンプチェックなし。古い ID が復元される可能性 — `app/interview/ext/[token]/page.tsx:35-66`
- **P2-5** 法人向けプラン記述「複数アカウント管理」の実態がツール側で未確認。FAQ に詳細追加 or 削除 — `pricing/page.tsx:113`
- **P2-6** 追加キャスト「期間限定」の終了予定日がページに記載されていない — `pricing/page.tsx:471-477`
- **P2-7** Contact form の name/message に max length / サニタイズなし（Resend HTML escape は効くがメールフッタへの埋め込みでは XSS リスクは低いが残る） — `api/contact/route.ts:44-55`
- **P2-8** モバイル drawer width 280px 固定、landscape で safe-area 考慮なし — `components/mobile-nav.tsx:100`

---

## 良かった点

- **CLAUDE.md ガードレール 8 / 9 / 13 / 15 はほぼ完璧に守られている**
- キャラアイコン (`CharacterAvatar`) が 39 箇所で活用され、世界観が一貫
- 法務文書（privacy / terms / tokushoho）は最新日付で空欄なし
- エラーメッセージは「正しくありません」「失敗しました」のような冷たい定型文を避け、ユーザー視点の指示的表現
- `lib/plans.ts` ↔ `pricing/page.tsx` ↔ FAQ のプラン情報が完全同期
- `window.confirm/alert/prompt` はゼロ件、`ConfirmDialog` で統一
- 文字サイズ規則（本文16px / ラベル12px / caption13px）すべて準拠、`text-[10px]` `text-[9px]` ゼロ件
- middleware で admin 二段チェック + Stripe webhook 署名検証 + invite token 期限・メール一致チェックなど基本セキュリティ実装あり
- ボタンの `min-h-[44px]` 統一・dvh 対応・レスポンシブグリッド崩れなし

---

## 推奨対応の進め方

### Step 1: P0 を3件修正（〜1時間）

1. **P0-A** InterviewClient の初期化失敗時に「ページを再読み込み」ボタンを表示
2. **P0-B** ArticleClient のテーマ取得失敗時に error state を立ててキャラアイコン付き警告
3. **P0-C** Stripe webhook の `.single()` を `.maybeSingle()` に統一 + null 時に明示ログ

### Step 2: モニター 1人目（クローズドベータ）に声をかける

P0 修正完了の時点で、**バグ前提・直接フィードバックチャネル付き**で1人だけ募集。
（前回相談した「Tier制で段階募集」方針 — `ops/weekly-review.md` 参照）

### Step 3: 1人目で出たバグを潰してから P1 を順次修正 + 残り2人募集

P1 は10件以上あるが、すべて事前修正してから募集する必要はない。**1人目の体験で何が実際に詰まるか**を見てから優先度をつけ直す方が、工数が無駄にならない。

### Step 4: P2 は Phase 3 直前か後でも可

ただし P2-7（Contact form sanitize）と P2-3（avatar upload path）は Phase 3 で課金が動き出す前に確認しておく。

---

## メモ: 課金・認証・プラン判定変更時の追加チェック

CLAUDE.md ガードレール12 により、Stripe webhook（P0-C）と plan param 検証（P1-8）の修正は **レビュアーチェック必須**。実装後、commit 前にレビュアーへ「重複・誤操作・改ざん耐性」を確認させる。

---

## 前回セッション停止の原因メモ（再発防止用）

- 4本 Explore 並列の出力 + 大きな curl HTML（191KB persisted）+ 多数のファイル読み込み + ブラウザスクショ系処理が、main コンテキストに累積した
- レポート起稿（task 8）に入った直後にコンテキスト圧迫で停止
- 「フォルダ置き場所」というよりは **1セッションに詰め込みすぎ**
- 次回似たレビューを走らせる時の対策:
  - Explore の出力は要点だけ（findings JSON 形式）にして main に戻す
  - 中間結果は `/tmp` ではなく `docs/review-log/draft/` に都度保存しながら進める
  - 4本並列ではなく 2本ずつ × 2 ラウンドに分ける
