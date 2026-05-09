# 監査結果 2026-05-09 / 取材フロー第5回検証

> 対象: 取材リンク6キャスト対応 + 通常/外部の取材UI共通化（53c197a）以降の取材フロー全体。
> 過去の F-1〜F-7 / H-2再 / M-6回帰 / L-2 を踏まえ、「共通化に伴う渡し漏れ」と「片側だけ実装が古い」差分を中心に通読。

## 対象範囲

- `app/(tool)/projects/[id]/interview/InterviewClient.tsx`（通常取材, 958 行）
- `app/interview/ext/[token]/page.tsx`（外部取材, 852 行）
- `components/interview/InputArea.tsx` / `MessageList.tsx` / `ProgressBar.tsx`
- `lib/interview-markers.ts` / `lib/interview-state.ts`
- `app/(tool)/projects/[id]/interview/page.tsx` / `app/interview/ext/layout.tsx`
- `app/(tool)/projects/[id]/interviewer/page.tsx`

## 結論サマリ

通常側と外部側で **共通コンポーネントは統一されたものの、props の渡し方と挙動が片側だけ古いまま**残っている。第3回の F-4再 / H-2再と同じ系統の「片側だけ追従」回帰が再発している。High 2件・Medium 3件・Low 3件・N 2件。

---

## High — モニター招待前に直す

### H5-1: 外部取材の終了確認モーダルにフォーカストラップが無い
- **場所**: `app/interview/ext/[token]/page.tsx:77-144` (`FinishInterviewModal`)
- **症状**: モーダルを開いている間、背景の `textarea` (`InputArea.tsx:80-85` で loading=false 時に強制 focus) が focus を奪う。Tab で背景に飛び、ESC キーも効かない。通常側 `InterviewClient.tsx:540-560` には keydown フォーカストラップが実装されているのに、ext 側だけ無い。
- **影響**: aria-modal=true を宣言しているのに振る舞いが追いついていない（A11y 違反）。モバイルでモーダル開いた瞬間にキーボード IME が背景 textarea で立ち上がる。
- **修正方針**: 通常側 `useEffect (showComplete)` のフォーカストラップ実装をそのまま ext 側にも移植 + ESC で onCancel。

### H5-2: ハル × 外部取材で「写真なしで進める」が出ない（F-7 系の渡し漏れ）
- **場所**: `app/interview/ext/[token]/page.tsx:804-822` (`InterviewInputArea` 呼び出し)
- **症状**: 通常側は `showSkipPhoto` / `onSkipPhoto` を渡すが、ext 側は両方未渡し。さらに ext は `interviewId` が解決するまで `onAttachmentSelected` を渡さない（`characterId === 'hal' && interviewId ? handleAttachmentUpload : undefined`）。結果、ハル × 外部リンクのユーザーは挨拶直後の状態で「写真添付ボタンも出ない」「スキップボタンも出ない」状態になる。
- **影響**: 取材代理店 → 事業者の主要フロー（memory: project_external_link_use_case）でハル取材を依頼された事業者は、写真を持っていないと進路を失う。代理店フローの主要ユースケースが詰まる。
- **修正方針**: ext 側でも `showSkipPhoto` / `onSkipPhoto` を InputArea に渡す。`SKIP_PHOTO_TOKEN` を chat API に送る handleSkipPhoto を ext 側にも実装。photoSkipped state を持つ。

---

## Medium

### M5-1: 進捗ラベル `getProgressLabel` が通常側と外部側で食い違う（共通化漏れ）
- **場所**: 通常 `InterviewClient.tsx:31-40` / 外部 `app/interview/ext/[token]/page.tsx:68-74`
- **症状**: 通常側は STANDARD_TURNS 接近時「いい話が集まってきました（あと${remaining}問でひと区切り）」と残数表示。ext 側は「いい話が集まってきました」だけで残数を見せない。
- **影響**: ガードレール6（共通パターンを崩さない）抵触。同じ進捗バー UI で見える文言が場所によって違う。
- **修正方針**: 文言ロジックを `lib/interview-progress.ts` に一本化して両側で参照する。

### M5-2: `MessageList.onYesNo` の渡し方が両側で食い違う
- **場所**: 通常 `InterviewClient.tsx:722` (`(answer) => void handleYesNo(answer)`) / 外部 `app/interview/ext/[token]/page.tsx:799` (`characterId === 'mogro' ? handleYesNo : undefined`)
- **症状**: MessageList 内部で `msg.yesno === true` フラグで Yes/No ボタン表示の有無を判定するため、動作上は同じになる（モグロ以外で `[YESNO_QUESTION]` マーカーが立つことは無い前提）。だが props の渡し方が両側で散らばっており、将来「モグロ以外でも yesno を使う」改修時に通常側だけ動いて ext 側が動かない、という第3回 F-4再と同じ系統の片側追従が起きる温床。
- **影響**: 即時の挙動バグは無いが、共通化方針が揺れている。
- **修正方針**: 両側ともに `(answer) => void handleYesNo(answer)` で常時渡す形に揃える（characterId 判定はコンポーネント内に閉じる）。または `characterId === 'mogro'` 判定を MessageList 側に持たせる。

### M5-3: `handleManualFinish` が messages 0 件 / loading 中でも押せる
- **場所**: `InterviewClient.tsx:529-532` + `687-705`（ヘッダーの「インタビューを終わらせる」）
- **症状**: 通常側のヘッダー終了ボタンに disabled が無いため、挨拶ストリーミング中（loading=true / messages.length=0）でも押すと `completionType='manual'` でモーダルが出る。「もう少し話す」を選ぶと `handleContinue` が走り、走行中の挨拶ストリームと衝突する可能性。
- **対比**: ext 側は `disabled={loading || messages.length === 0}` を入れている。
- **影響**: レアケースだが ext と挙動差。第3回の片側追従と同じパターン。
- **修正方針**: 通常側の終了ボタンに `disabled={loading || messages.length === 0}` を追加。

---

## Low

### L5-1: ext 完了画面 `paused` のとき「インタビューに戻る」しか選べない
- **場所**: `app/interview/ext/[token]/page.tsx:725-739`
- **症状**: `canResume === false`（`userTurns >= MAX_TURNS`）になると、paused 表示にもかかわらず再開ボタンが消えて、操作肢ゼロの行き止まり画面になる。実コードでは hard limit 到達は別経路で `done` に行くため到達しにくいが、ロジック的に空の盲目区間が残る。
- **修正方針**: `paused` で再開不能になる経路を確認し、必要なら「完了する」フォールバックを置く。

### L5-2: ext 側 `validating` 中の表示にキャラアイコン無し
- **場所**: `app/interview/ext/[token]/page.tsx:598-604`
- **症状**: 「確認しています...」のテキストのみ。intro 画面はちゃんとキャラを置いているのに、その手前の数秒だけ冷たい SaaS 画面。
- **影響**: 世界観原則・ガードレール14（ローディング表示はルールに従う）抵触ぎみ。同一セクション内なのでプログレスバーに寄せるか、Insight Cast ロゴを置く。
- **修正方針**: 同一セクション内の中継表示として、薄いプログレスバー or ロゴ + 「確認しています...」に変更。

### L5-3: ext ヘッダー終了ボタン disabled の根拠が控えめ
- **場所**: `app/interview/ext/[token]/page.tsx:763-784`
- **症状**: `disabled={loading || messages.length === 0}` のため、AI ストリーミング中は終了不可。長文回答のストリーム中にユーザーが急ぎ抜けたい時に止められない。
- **影響: 体感問題のみ。仕様意図と思われるが要確認。
- **修正方針**: 仕様確認のうえ、ストリーミング中も「中断」だけは押せるようにする選択肢あり。今回は記録のみ。

---

## N（A11y / 細部）

### N5-1: ext モーダルの ESC キーが効かない
- **場所**: `FinishInterviewModal` (`app/interview/ext/[token]/page.tsx:77-144`)
- **症状**: aria-modal=true 宣言しているが、Escape ハンドラなし。
- **修正方針**: H5-1 の修正と一緒に keydown(Escape) → onCancel を入れる。

### N5-2: ext 完了画面 (`done`/`ai_proposed`/`paused`) でキャラアイコンの border 色が同一
- **場所**: `app/interview/ext/[token]/page.tsx:683-690`
- **症状**: いずれも `border-[var(--ok)]` を使っており、3パターンの違いが文言だけで色が伝わらない。
- **修正方針**: 仕様判断（必要なら ai_proposed を accent、done を ok、paused を border のままに分ける）。今回は記録のみ。

---

## 良かった点

- 第3回 F-4再で追加された `stripPostCompletionSummary` が両画面の履歴復元と新着メッセージで一貫して呼ばれている（コメントの運用方針も書かれている）
- markers regex の共通化（`lib/interview-markers.ts`）が完成している
- 通常 / 外部両方の Hal アップロードが server-side admin client 経由でストレージ RLS の罠を回避できている
- パスストリーク復元ロジックが両側でほぼ同型
- メタデータ (title) は ext layout / 通常 page どちらにも入っており F-1, F-2 系は維持されている

---

## 推奨対応の進め方

### Step 1: H5-1 / H5-2 を修正（このサイクル中）
- ext モーダルにフォーカストラップ + ESC ハンドラを移植
- ext 側で「写真なしで進める」を有効化（state + handler + InputArea への props 渡し）

### Step 2: M5-1 / M5-2 / M5-3 を続けて修正
- 進捗ラベルを共通化
- onYesNo の渡し方を両側で揃える
- 通常側の終了ボタンに disabled 追加

### Step 3: L / N は次回サイクルへ
- 大きな仕様判断が必要な L5-1 / L5-3 / N5-2 は ディレクター 判断後に着手
- L5-2 は 5分で直せるので一緒にやってもよい

---

## 次回検証時に注意

- 共通化リファクタ直後は「共通コンポーネントの呼び出し側で props 渡し漏れ」が起きやすい。今回も M5-1 / M5-2 / M5-3 / H5-2 がすべてその系統。
- 第6回検証では通常側 → 外部側へ追加された機能（写真スキップ、進捗残数、loading時の終了ボタン disabled）を「もう片側に移植してあるか」を最初にチェックすると、同じ系統の発見が早く出る。
