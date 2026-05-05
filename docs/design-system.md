# Insight Cast デザインシステム

> **このドキュメントの位置づけ**
> Insight Cast の **サイト側 / ツール側 / admin 側** に共通する、デザインの根幹ルール。
> Google Material Design 3 (M3) の **設計フレームワーク（Color Role / Typography / Shape / Elevation / Motion / State Layer）** を骨格として採用し、世界観（水彩調・暖色・キャラクター中心）はそのまま保つ。
>
> 既製ライブラリ（`@material/web` / MUI）は導入しない。**設計概念とトークン体系のみ**取り入れて、自前コンポーネントに反映する。
>
> このドキュメントは「定義」までを書く。実装適用（トークン置換・コンポーネント書き換え・既存ページのリファクタ）は別タスクで段階的に進める。
>
> CLAUDE.md の世界観ルールが上位。本ドキュメントはそれを表現するための実装規約である。

---

## 目次

1. [設計原則](#設計原則)
2. [M3 から取り入れる範囲（早見表）](#m3-から取り入れる範囲早見表)
3. [Color Roles](#color-roles)
4. [Typography Scale](#typography-scale)
5. [Shape Scale](#shape-scale)
6. [Elevation](#elevation)
7. [Motion](#motion)
8. [State Layers](#state-layers)
9. [Focus Visibility](#focus-visibility)
10. [globals.css 設計（実装ターゲット）](#globalscss-設計実装ターゲット)
11. [共有コンポーネントの仕様](#共有コンポーネントの仕様)
12. [3 サイドの使い分けガイド](#3-サイドの使い分けガイド)
13. [旧 → 新トークン対応表（チートシート）](#旧--新トークン対応表チートシート)
14. [CLAUDE.md 世界観ルールとの整合](#claudemd-世界観ルールとの整合)
15. [移行手順（後続タスク）](#移行手順後続タスク)
16. [やらないこと](#やらないこと)

---

## 設計原則

1. **役割で命名する**。「色相・段階」の名前（accent / bg / bg2）ではなく、「使い道」の名前（primary / surface / surface-container）を使う。後でテーマ替え・ダークモード化・別ブランド派生があっても、命名側を変えずに値を差し替えられる。
2. **段階を限定する**。M3 のフルセットは取らない。Insight Cast に必要な段階だけを残し、迷いどころを減らす（Surface 5 段、Typography 6 段、Shape 6 段、Elevation 6 段）。
3. **既存コードを壊さない**。旧トークン名は alias として残し、論理的には無修正で動作させる。新規実装は新名で書く。リファクタは段階的に進める。
4. **世界観に従って M3 を曲げる**。Surface のティント方向を反転させる（白いほど浮いて見える）など、Insight Cast の暖色文化に合わせて M3 のデフォルトから外れる箇所がある。曲げるたびに **理由をドキュメントに残す**。
5. **キャラクターはトークン化しない**。キャラごとの色や体格は `lib/characters` 側に残す。デザインシステムはキャラを「載せる土台」を提供する役割。
6. **3 サイドで同じトークンを使う**。site / tool / admin で違うのは「どの段階を多用するか」であって、トークン定義そのものは共通。

---

## M3 から取り入れる範囲（早見表）

| M3 の層 | M3 が言うこと | Insight Cast で採用する範囲 |
|---|---|---|
| **Color** | 役割ベースの色トークン（primary / surface / outline 等）、tonal palette、light/dark/contrast、state layer | ロール命名と段階化のみ採用。色そのものは現在の暖色を保つ。Dynamic Color と HCT 生成は使わない |
| **Typography** | display / headline / title / body / label × large/medium/small（15 段階） | 6 段階に削減して採用。日本語向けに line-height・字間を調整 |
| **Shape** | extra-small / small / medium / large / extra-large の角丸スケール | そのまま採用。既存値とマッピング |
| **Elevation** | 0〜5 の段階。色のティント + 影で表現 | 影だけ採用。surface tint は世界観に合わないので不採用 |
| **Motion** | emphasized / standard の easing、duration token | duration を 5 段階トークン化。`--ease-emphasized` を新規追加。既存の spring / out も残す |
| **State Layer** | hover / focus / pressed / dragged を半透明レイヤーで重ねる | 採用。opacity トークンとして定義 |
| **Components**（FAB / Snackbar / Top App Bar 等） | 既製コンポーネント仕様 | **採用しない**。自前コンポーネントを M3 トークンに合わせて磨く |
| **Iconography**（Material Symbols） | Google 提供のアイコンセット | **採用しない**。世界観としてキャラアイコン優先（CLAUDE.md 準拠） |
| **Dark mode / Dynamic Color** | 自動カラースキーム | 実装は将来。本ドキュメントでは概念のみ言及 |

---

## Color Roles

すべての色を「役割」で命名する。直接の hex は **トークン定義の 1 箇所のみ**。それ以外（コンポーネント・ページ）はトークン名で参照する。

### Primary（暖色アクセント）

サービスの主アクセント。CTA・リンク・選択状態・キャラクターの示唆色に使う。

| Role | Value | 用途 |
|---|---|---|
| `--primary` | `#c2722a` | プライマリボタン背景、リンク、強調テキストの色、フォーカスリング色 |
| `--on-primary` | `#ffffff` | プライマリ背景の上に乗る文字・アイコン |
| `--primary-container` | `#fdf0e4` | バッジ・タグ・薄い強調背景（Eyebrow 等） |
| `--on-primary-container` | `#8a4a18` | primary-container 背景上の文字（より濃い暖色） |
| `--primary-hover` | `#a85e20` | primary のホバー色（M3 標準では state layer で表現するが、既存コードとの互換のため明示変数を残す） |

### Secondary（ティール）

副アクセント。ステータス表示・補助 CTA・フリーキャストや無料導線の示唆色などに使う。

| Role | Value | 用途 |
|---|---|---|
| `--secondary` | `#0d9488` | 副 CTA、補助強調 |
| `--on-secondary` | `#ffffff` | secondary 背景の上に乗る文字 |
| `--secondary-container` | `#e0f5f3` | 副バッジ・タグ |
| `--on-secondary-container` | `#0a7a70` | secondary-container 上の文字 |
| `--secondary-hover` | `#0a7a70` | secondary のホバー色（既存 `--teal-h` の互換） |

### Tertiary（将来用）

第 3 アクセントが必要になったときに使う枠。**現時点で未使用**。

### Surface（背景・カード階層）

> **設計判断**: Insight Cast は **白に近い面を「base surface」、暖色のクリーム面を「surface-dim（浅く沈んだ面）」** として扱う。これは M3 公式の light テーマと同じ思想（`surface` が最も明るい・ニュートラルで、`surface-dim` がそれより暗いトーン）。Insight Cast では暖色文化のため、白いほど "紙が浮いている" 印象になる。
>
> この命名で、既存 `--surface`（旧コードで `#fffdf9` を指す 260+ 箇所）の **値が変わらない**。互換性を最大化する。

| Role | Value | 用途 |
|---|---|---|
| `--surface` | `#fffdf9` | base surface。浮いたカード・パネル・入力欄背景・ボタン白系の地（旧 `--surface` を維持） |
| `--surface-dim` | `#faf6f0` | dimmer surface。ページ最背面・body 背景（旧 `--bg`） |
| `--surface-container-low` | `#f5ede0` | わずかにティントされた背景（旧 `--surface2`） |
| `--surface-container` | `#f0e9de` | 浅いセクション背景・サイドバー（旧 `--bg2`） |
| `--surface-container-high` | `#e8ddd0` | より強くティントされた背景・ヘッダー帯（旧 `--bg3`） |

### On-Surface（テキスト階層）

| Role | Value | 用途 |
|---|---|---|
| `--on-surface` | `#1c1410` | 本文・見出し（最重要テキスト） |
| `--on-surface-variant` | `#7a6555` | 補助テキスト・キャプション・サブコピー |
| `--on-surface-muted` | `#8f7d6d` | プレースホルダ・無効状態テキスト・パンくず |

### Outline（罫線）

| Role | Value | 用途 |
|---|---|---|
| `--outline` | `#e2d5c3` | 通常の罫線・カードボーダー・フォームボーダー |
| `--outline-variant` | `#d0c0a8` | 強調罫線・hover 時のボーダー |

### Status（成功・警告・エラー）

| Role | Value | 用途 |
|---|---|---|
| `--success` | `#16a34a` | 成功状態の文字・アイコン |
| `--success-container` | `#dcfce7` | 成功状態の背景・通知 |
| `--on-success-container` | `#16a34a` | success-container 背景上の文字（success と同値で運用） |
| `--warning` | `#d97706` | 警告状態の文字 |
| `--warning-container` | `#fef3c7` | 警告状態の背景 |
| `--error` | `#dc2626` | エラー状態の文字 |
| `--error-container` | `#fee2e2` | エラー状態の背景 |

### M3 とのズレ（明示）

- **Surface のティント方向反転**：高い container ほど白に近づく。理由は世界観（水彩調・暖色のため、白いほど "紙が浮いている" 感が出る）。
- **Tertiary を持たない**：現状の暖色 + ティールで足りる。将来必要になったら追加。
- **Dark theme の値はまだない**：Dark の役割名（`--primary-dark` 等）は本ドキュメントで予約しておくが、実値は未定義。

---

## Typography Scale

M3 は 15 段階を用意するが、Insight Cast では **6 段階に削減** する。日本語は欧文より line-height を広めにする必要があるため、line-height は M3 推奨より大きめ。

| Token | Size | Line Height | Tracking | Family | 用途 |
|---|---|---|---|---|---|
| `--type-display` | `clamp(34px, 4vw, 54px)` | 1.14 | -0.01em | serif（`--font-noto-serif-jp`） | LP の H1、視覚的キャッチ |
| `--type-headline` | `clamp(24px, 3vw, 40px)` | 1.22 | -0.005em | serif | ページの H1、セクションの H2 大 |
| `--type-title` | `1.125rem` (18px) | 1.4 | 0 | sans | カード見出し、フォームのセクション見出し、H3 |
| `--type-body` | `1rem` (16px) | 1.95 | 0 | sans | 本文 |
| `--type-label` | `0.75rem` (12px) | 1.4 | 0.2em | sans uppercase | バッジ、Eyebrow、ステータス Pill |
| `--type-caption` | `0.8125rem` (13px) | 1.5 | 0 | sans | 補足、キャプション、フォームヘルパー |

### フォントファミリ
- 本文・タイトル：Noto Sans JP（`--font-noto-sans-jp`）。Hiragino Sans フォールバック。
- 見出し（display / headline）：`--font-noto-serif-jp` を参照する。**実体は M PLUS 1p にリマップ済み**（Shippori Mincho 廃止）。実体がサンセリフであることを忘れない。

### 使用ルール
- 1 ページに display は基本 **1 箇所**。LP の Hero でのみ採用。
- headline は **ページの最上位見出しに 1 つ**。下位セクションは title。
- body の行高 1.95 は日本語向け。長文ブロックでは `text-pretty` を併用してよい。
- label は uppercase + tracking 広め。日本語は uppercase が効かないので、英文 / 英数字混在向け。

---

## Shape Scale

既存の角丸を M3 命名に揃える。値は変えない。

| Token | Value | 用途 |
|---|---|---|
| `--shape-xs` | `4px` | アイコン背景、極小 Pill |
| `--shape-sm` | `8px` | ボタン、入力欄、小カード |
| `--shape-md` | `12px` | 通常カード、ステータスカード、ローディングボックス |
| `--shape-lg` | `20px` | 大きなカード、パネル |
| `--shape-xl` | `28px` | パネル（getPanelClass）、ヒーロー画像枠、モーダル |
| `--shape-full` | `9999px` | Pill、丸アバター、サークルバッジ |

旧 `--r-sm / --r / --r-lg / --r-xl` はそれぞれ `--shape-sm / --shape-md / --shape-lg / --shape-xl` の alias として残す。

---

## Elevation

M3 公式は「色のティント + 影」で elevation を表現するが、**Insight Cast は影のみ採用**。surface tint は世界観に合わないので不採用。

| Token | box-shadow | 用途 |
|---|---|---|
| `--elevation-0` | `none` | フラット（罫線のみで分離） |
| `--elevation-1` | `0 1px 2px rgba(28,20,16,0.04), 0 1px 3px rgba(28,20,16,0.06)` | 浮いた小要素（ホバー前ボタン、入力欄 hover） |
| `--elevation-2` | `0 4px 8px rgba(28,20,16,0.06), 0 2px 4px rgba(28,20,16,0.04)` | 通常カード（card-interactive 通常時） |
| `--elevation-3` | `0 8px 16px rgba(28,20,16,0.08), 0 4px 8px rgba(28,20,16,0.06)` | ホバー時のカード、ドロップダウン、ヘッダー |
| `--elevation-4` | `0 16px 32px rgba(28,20,16,0.10), 0 8px 16px rgba(28,20,16,0.08)` | モーダル背景、Hero 画像枠 |
| `--elevation-5` | `0 24px 48px rgba(28,20,16,0.12), 0 12px 24px rgba(28,20,16,0.10)` | トースト、最前面の通知、最高位パネル |

### 使用ルール
- ボタンの通常状態は **影なし or 1**。プライマリボタンに限り 1 を採用してよい。
- カードの通常状態は **影なし or 1**。`card-interactive` でホバー時に 2〜3 へ上げる。
- モーダル本体は 4。背景の overlay には影なし。
- 影色は **暖色寄りの黒 `rgba(28,20,16,...)`**。純黒（`rgba(0,0,0,...)`）は使わない。冷たく見えるため。

---

## Motion

### Duration

| Token | Value | 用途 |
|---|---|---|
| `--duration-1` | `100ms` | 微小なフィードバック（ボタン active 時の scale 等） |
| `--duration-2` | `150ms` | 通常のトランジション（hover, focus）。**デフォルト** |
| `--duration-3` | `200ms` | 中規模の変化（パネル開閉、選択状態） |
| `--duration-4` | `300ms` | モーダル・サイドバーの出入り |
| `--duration-5` | `500ms` | LP の reveal、画面遷移、アクセント演出 |

### Easing

| Token | Value | 用途 |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | デフォルト。要素の出現、hover、focus |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | キャラ系・LP・装飾的なポップ感がほしい時 |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | 重要な状態変化（成功表示、フォーム送信完了など） |

### prefers-reduced-motion

既存の挙動を維持：
- `[data-reveal]` のスクロール駆動アニメーションは無効化
- `ic-*` 系ローディングのアニメーションは duration を ~0 に短縮、iteration-count を 1 に
- transition-duration も同様に短縮

---

## State Layers

M3 の state layer は「要素の上に半透明レイヤーを重ねる」考え方。Insight Cast でも採用し、opacity トークンを定義する。

| Token | Value | 用途 |
|---|---|---|
| `--state-hover` | `0.08` | hover 時のレイヤー濃度 |
| `--state-focus` | `0.12` | focus 時のレイヤー濃度（focus-visible は別途 outline で表示するので、これは追加効果） |
| `--state-pressed` | `0.16` | active / pressed 時 |
| `--state-disabled` | `0.38` | disabled 時の opacity（コンテンツ全体に適用） |

### 実装方針
- 半透明レイヤーは `bg-[var(--primary)]/[var(--state-hover)]` のように tailwind arbitrary value で重ねるのが基本
- ボタンの実装例：
  - 通常：`bg-[var(--primary)] text-[var(--on-primary)]`
  - hover：`bg-[var(--primary-hover)]`（明示的な hover 色を持つ場合）または state layer を上に重ねる
  - active：`active:scale-95 active:opacity-75`（既存挙動を維持）
  - disabled：`disabled:opacity-50`（state-disabled の 0.38 ではなく既存の 0.5 を当面維持。微調整は別タスク）

---

## Focus Visibility

`globals.css` のグローバル focus-visible 定義を **唯一の正** とする。

```css
:where(a, button, input, textarea, select, summary, [role="button"]):focus-visible {
  outline: 3px solid rgba(194, 114, 42, 0.45);   /* var(--primary) の 45% */
  outline-offset: 3px;
}
```

### ルール
- 各コンポーネントで `focus-visible:ring-2 ring-[var(--accent)]/40` を **追加で書かない**。グローバル outline で十分。
- 例外：暗い背景（プライマリ塗りつぶしボタンなど）で outline が見えにくい場合は、**コンポーネント単位で** `focus-visible:ring-2 ring-offset-2` を上書きしてよい。理由をコードコメントに残す。
- ring を残すか撤去するかの一括決定は **別タスク**。本ドキュメントでは「新規コードでは追加しない」が原則。

---

## globals.css 設計（実装ターゲット）

`app/globals.css` の `:root` を以下の構造に再構築する。**alias 群を残すことで、既存コードは無修正で動く**。

```css
:root {
  /* === Color: Primary === */
  --primary: #c2722a;
  --on-primary: #ffffff;
  --primary-container: #fdf0e4;
  --on-primary-container: #8a4a18;
  --primary-hover: #a85e20;

  /* === Color: Secondary (teal) === */
  --secondary: #0d9488;
  --on-secondary: #ffffff;
  --secondary-container: #e0f5f3;
  --on-secondary-container: #0a7a70;
  --secondary-hover: #0a7a70;

  /* === Color: Surface === */
  --surface: #fffdf9;
  --surface-dim: #faf6f0;
  --surface-container-low: #f5ede0;
  --surface-container: #f0e9de;
  --surface-container-high: #e8ddd0;

  /* === Color: On-Surface === */
  --on-surface: #1c1410;
  --on-surface-variant: #7a6555;
  --on-surface-muted: #8f7d6d;

  /* === Color: Outline === */
  --outline: #e2d5c3;
  --outline-variant: #d0c0a8;

  /* === Color: Status === */
  --success: #16a34a;
  --on-success: #ffffff;
  --success-container: #dcfce7;
  --warning: #d97706;
  --warning-container: #fef3c7;
  --error: #dc2626;
  --error-container: #fee2e2;

  /* === Shape === */
  --shape-xs: 4px;
  --shape-sm: 8px;
  --shape-md: 12px;
  --shape-lg: 20px;
  --shape-xl: 28px;
  --shape-full: 9999px;

  /* === Elevation === */
  --elevation-0: none;
  --elevation-1: 0 1px 2px rgba(28,20,16,0.04), 0 1px 3px rgba(28,20,16,0.06);
  --elevation-2: 0 4px 8px rgba(28,20,16,0.06), 0 2px 4px rgba(28,20,16,0.04);
  --elevation-3: 0 8px 16px rgba(28,20,16,0.08), 0 4px 8px rgba(28,20,16,0.06);
  --elevation-4: 0 16px 32px rgba(28,20,16,0.10), 0 8px 16px rgba(28,20,16,0.08);
  --elevation-5: 0 24px 48px rgba(28,20,16,0.12), 0 12px 24px rgba(28,20,16,0.10);

  /* === Motion === */
  --duration-1: 100ms;
  --duration-2: 150ms;
  --duration-3: 200ms;
  --duration-4: 300ms;
  --duration-5: 500ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);

  /* === State Layer (opacities) === */
  --state-hover: 0.08;
  --state-focus: 0.12;
  --state-pressed: 0.16;
  --state-disabled: 0.38;

  /* === Typography === */
  --type-display-size: clamp(34px, 4vw, 54px);
  --type-display-line: 1.14;
  --type-headline-size: clamp(24px, 3vw, 40px);
  --type-headline-line: 1.22;
  --type-title-size: 1.125rem;
  --type-title-line: 1.4;
  --type-body-size: 1rem;
  --type-body-line: 1.95;
  --type-label-size: 0.75rem;
  --type-label-tracking: 0.2em;
  --type-caption-size: 0.8125rem;
  --type-caption-line: 1.5;

  --font-noto-serif-jp: var(--font-noto-sans-jp); /* Shippori Mincho 廃止のためサンセリフへリマップ済み（既存維持） */

  /* ───────────────────────────────── */
  /* === Compatibility Aliases === */
  /* リファクタ完了後に削除予定。既存コード互換のために残す。 */
  /* ───────────────────────────────── */

  /* old surface — `--surface` 自体は新旧で同値（#fffdf9）なので alias 不要 */
  --bg: var(--surface-dim);
  --bg2: var(--surface-container);
  --bg3: var(--surface-container-high);
  --surface2: var(--surface-container-low);

  /* old text */
  --text: var(--on-surface);
  --text2: var(--on-surface-variant);
  --text3: var(--on-surface-muted);

  /* old outline */
  --border: var(--outline);
  --border2: var(--outline-variant);

  /* old accent */
  --accent: var(--primary);
  --accent-h: var(--primary-hover);
  --accent-l: var(--primary-container);
  --accent-d: var(--on-primary-container);

  /* old teal */
  --teal: var(--secondary);
  --teal-h: var(--secondary-hover);
  --teal-l: var(--secondary-container);

  /* old status */
  --ok: var(--success);
  --ok-l: var(--success-container);
  --warn: var(--warning);
  --warn-l: var(--warning-container);
  --err: var(--error);
  --err-l: var(--error-container);

  /* old shape */
  --r: var(--shape-md);
  --r-sm: var(--shape-sm);
  --r-lg: var(--shape-lg);
  --r-xl: var(--shape-xl);

  /* old shadow (raw color values, used in arbitrary `shadow-[0_..._var(--shadow)]`) */
  --shadow: rgba(28,20,16,0.07);
  --shadow-lg: rgba(28,20,16,0.13);
}
```

### 注意点
- `--surface` は新旧で **値が同じ**（`#fffdf9`）。既存の 260+ 箇所の `var(--surface)` 参照は無修正で動く。
- 旧 `--bg`（`#faf6f0` クリーム） → 新 `--surface-dim` にマッピング。alias `--bg = var(--surface-dim)` で既存コード互換。
- 旧 `--bg2 / --bg3 / --surface2` も alias 経由で値が変わらない。
- 新規実装では、ページ最背面は `--surface-dim`、浮いたカードは `--surface`、より沈んだ面は `--surface-container-low` 〜 `--surface-container-high` を使う。

---

## 共有コンポーネントの仕様

`components/ui.tsx` の各 export を、新ロール参照に書き換える。**API（props 名・型）は変えない**。内部のクラス参照だけ差し替える。

### 既存コンポーネント別の更新点

| Export | 現状の主な参照 | 更新後の参照 | 備考 |
|---|---|---|---|
| `getButtonClass` 共通基底 | `rounded-[var(--r-sm)]` `focus-visible:ring-[var(--accent)]/40` | `rounded-[var(--shape-sm)]` `focus-visible` のリングは撤去（globals 任せ） | active:scale / opacity は既存維持 |
| `getButtonClass('primary')` | `border-[var(--accent)]` `bg-[var(--accent)]` `text-white` `hover:bg-[var(--accent-h)]` | `border-[var(--primary)]` `bg-[var(--primary)]` `text-[var(--on-primary)]` `hover:bg-[var(--primary-hover)]` | |
| `getButtonClass('secondary')` | `border-[var(--border)]` `bg-white` `text-[var(--text)]` `hover:border-[var(--accent)]` `hover:text-[var(--accent)]` | `border-[var(--outline)]` `bg-[var(--surface-container-high)]` `text-[var(--on-surface)]` `hover:border-[var(--primary)]` `hover:text-[var(--primary)]` | bg を `white` から `--surface-container-high` に。暖色背景の中で白すぎる印象を緩和 |
| `getButtonClass('ghost')` | `text-[var(--text2)]` `hover:bg-[var(--bg2)]` | `text-[var(--on-surface-variant)]` `hover:bg-[var(--surface-container-low)]` | |
| `PrimaryButton` / `SecondaryButton` / `ButtonLink` | 上記基底を使用 | 同上 | API 不変 |
| `getPanelClass` | `rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)]` | `rounded-[var(--shape-xl)] border border-[var(--outline)] bg-[var(--surface-container-high)]` | 「浮いたパネル」の意味を明示 |
| `EyebrowBadge` | `border-[var(--accent)]/20 bg-[var(--accent-l)] text-[var(--accent)] text-xs tracking-[0.2em] uppercase` | `border-[var(--primary)]/20 bg-[var(--primary-container)] text-[var(--on-primary-container)] text-[length:var(--type-label-size)] tracking-[var(--type-label-tracking)] uppercase` | label タイポを参照 |
| `StatusPill` neutral | `bg-[var(--surface)] text-[var(--text2)] ring-[var(--border)]` | `bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] ring-[var(--outline)]` | |
| `StatusPill` success | `bg-[var(--ok-l)] text-[var(--ok)] ring-[var(--ok)]/20` | `bg-[var(--success-container)] text-[var(--success)] ring-[var(--success)]/20` | |
| `StatusPill` warning | `bg-[var(--warn-l)] text-[var(--warn)]` | `bg-[var(--warning-container)] text-[var(--warning)]` | |
| `StatusPill` info | `bg-[var(--teal-l)] text-[var(--teal)]` | `bg-[var(--secondary-container)] text-[var(--secondary)]` | |
| `StateCard` default | `border-[var(--border)] bg-[var(--surface)]` | `border-[var(--outline)] bg-[var(--surface-container-high)]` | |
| `StateCard` soft | `border-[var(--border)] bg-[var(--bg2)]` | `border-[var(--outline)] bg-[var(--surface-container-low)]` | |
| `StateCard` warning | `border-[var(--warn)]/30 bg-[var(--warn-l)]` | `border-[var(--warning)]/30 bg-[var(--warning-container)]` | |
| `CharacterAvatar` | `border-[var(--border)] bg-[var(--surface)]` | `border-[var(--outline)] bg-[var(--surface-container-high)]` | |
| `InterviewerSpeech` | 吹き出し背景 `var(--surface)` | 吹き出し背景 `var(--surface-container-high)`、矢印 `var(--outline-variant)` | キャラアイコン優先ルールは継続 |
| `TextInput` | `bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border2)] focus-visible:border-[var(--accent)]` | `bg-[var(--surface-container-high)] border-[var(--outline)] hover:border-[var(--outline-variant)] focus-visible:border-[var(--primary)]` | focus 時の ring は撤去 |
| `Breadcrumb` | `text-[var(--text3)]` | `text-[var(--on-surface-muted)]` | |
| `SiteBrand` / `HeaderSurface` / `PageHeader` / `FieldLabel` / `DevAiLabel` | 各種 `--text*` `--bg*` | `--on-surface*` `--surface*` 系 | リネーム追随のみ |

### 新規追加するヘルパー

`components/ui.tsx`（または新ファイル `components/design-system.ts`）に、トークン参照をクラスに展開するヘルパーを追加する：

```ts
// 影段階を style or className で適用するためのユーティリティ
// 用法: <div style={getElevation(2)} />  または  className 経由で利用
export function getElevation(level: 0 | 1 | 2 | 3 | 4 | 5) {
  return { boxShadow: `var(--elevation-${level})` }
}

// タイポスケールを Tailwind クラス文字列で返す
export function getTypeClass(level: 'display' | 'headline' | 'title' | 'body' | 'label' | 'caption') {
  const map = {
    display:  'text-[length:var(--type-display-size)] leading-[var(--type-display-line)] font-[family-name:var(--font-noto-serif-jp)] font-bold',
    headline: 'text-[length:var(--type-headline-size)] leading-[var(--type-headline-line)] font-[family-name:var(--font-noto-serif-jp)] font-bold',
    title:    'text-[length:var(--type-title-size)] leading-[var(--type-title-line)] font-semibold',
    body:     'text-[length:var(--type-body-size)] leading-[var(--type-body-line)]',
    label:    'text-[length:var(--type-label-size)] tracking-[var(--type-label-tracking)] uppercase font-semibold',
    caption:  'text-[length:var(--type-caption-size)] leading-[var(--type-caption-line)]',
  }
  return map[level]
}

// state layer を背景に重ねる場合の opacity 値を返す（背景色は呼び出し側が指定）
export function getStateOpacity(state: 'hover' | 'focus' | 'pressed' | 'disabled') {
  return `var(--state-${state})`
}
```

### 後方互換
- 既存の呼び出し側コードは **無修正で動く**（旧トークン名は alias で残るため）
- `getTypeClass` などの新ヘルパーは新規実装で使う。既存実装は段階的に書き換え

---

## 3 サイドの使い分けガイド

トークン定義は 3 サイド共通。違うのは **どの段階を多用するか**。

### Site（公開サイト）

世界観で引き込む側。装飾と余白が主役。

- **Typography**：`--type-display`（Hero）→ `--type-headline`（セクション）→ `--type-body`（本文）。`--type-label` を Eyebrow で。`--type-caption` は補助のみ。
- **Surface**：`--surface-dim` をページ背景にし、ヒーローセクションには `--surface-dim` の上にグラデを敷く。カード類は `--surface` を主面に。ハードコード hex グラデは段階的に削減。
- **Elevation**：通常 0〜2。Hero 画像枠に 4。
- **Motion**：`--duration-3` 〜 `--duration-5` を多用。`--ease-spring` で装飾的なポップ感を出してよい。
- **キャラクター**：必ず登場させる。アイコン or イラスト。

### Tool（ログイン後アプリ）

機能で勝負する側。情報階層と操作のしやすさが主役。

- **Typography**：`--type-headline`（ページ最上部）→ `--type-title`（カード見出し）→ `--type-body`（本文）→ `--type-label / --type-caption`（補助）。`--type-display` は使わない。
- **Surface**：AppShell の背景は `--surface-dim`、サイドバーは `--surface-container`、本体カードは `--surface`。`--surface-container-low` をホバー差替えに使う。
- **Elevation**：通常 0〜1。ホバー 2。モーダル 4。トースト 5。
- **Motion**：`--duration-1` 〜 `--duration-3`。装飾的な `--ease-spring` は最小限。
- **キャラクター**：通知・エラー・状態カードに必ず添える（CLAUDE.md 規約）。

### Admin（管理画面）

情報密度を上げる側。ダッシュボード視認性が主役。

- **Typography**：`--type-title` `--type-body` `--type-caption` 中心。`--type-headline` はページタイトルのみ。テーブル系は `--type-caption` 多めで密に。
- **Surface**：tool と同骨格。さらに密に並べるため、カード間 gap は tool より狭めにする。
- **Elevation**：基本 0〜1。アクションパネルで 2。
- **Motion**：`--duration-1` 〜 `--duration-2` のみ。装飾は不要。
- **キャラクター**：内部用なので最低限。意思決定が必要な操作には添える。

---

## 旧 → 新トークン対応表（チートシート）

リファクタ時の grep / 置換用。

### Color

| 旧 | 新 | 注意 |
|---|---|---|
| `--bg` | `--surface-dim` | 値同じ（`#faf6f0`）。ページ最背面の意味 |
| `--bg2` | `--surface-container` | 値同じ（`#f0e9de`） |
| `--bg3` | `--surface-container-high` | 値同じ（`#e8ddd0`） |
| `--surface` | `--surface` | **新旧で同値**（`#fffdf9`、白系の浮いたカード）。M3 でも light テーマの "base surface" は最も明るい面なので、命名上の整合も取れる |
| `--surface2` | `--surface-container-low` | 値同じ（`#f5ede0`） |
| `--text` | `--on-surface` | |
| `--text2` | `--on-surface-variant` | |
| `--text3` | `--on-surface-muted` | |
| `--border` | `--outline` | |
| `--border2` | `--outline-variant` | |
| `--accent` | `--primary` | |
| `--accent-h` | `--primary-hover` | |
| `--accent-l` | `--primary-container` | |
| `--accent-d` | `--on-primary-container` | |
| `--teal` | `--secondary` | |
| `--teal-h` | `--secondary-hover` | |
| `--teal-l` | `--secondary-container` | |
| `--ok` | `--success` | |
| `--ok-l` | `--success-container` | |
| `--warn` | `--warning` | |
| `--warn-l` | `--warning-container` | |
| `--err` | `--error` | |
| `--err-l` | `--error-container` | |

### Shape

| 旧 | 新 |
|---|---|
| `--r-sm` | `--shape-sm` |
| `--r` | `--shape-md` |
| `--r-lg` | `--shape-lg` |
| `--r-xl` | `--shape-xl` |

### Shadow / Elevation

旧 `--shadow / --shadow-lg` は **生の rgba 値** だったため、`shadow-[0_4px_20px_var(--shadow)]` のような arbitrary value で使われていた。新では **完成済みの box-shadow 値** が `--elevation-1` 〜 `--elevation-5` に入っている。

| 旧の使い方 | 新 |
|---|---|
| `shadow-[0_1px_2px_var(--shadow)]` | `shadow-[var(--elevation-1)]` |
| `shadow-[0_4px_20px_var(--shadow)]` | `shadow-[var(--elevation-2)]` または `--elevation-3` |
| `shadow-[0_16px_48px_var(--shadow)]` | `shadow-[var(--elevation-3)]` または `--elevation-4` |
| `shadow-[0_32px_80px_rgba(0,0,0,.14)]` | `shadow-[var(--elevation-4)]` または `--elevation-5` |
| `shadow-xl` (Tailwind 標準) | `shadow-[var(--elevation-3)]`（要視覚確認） |
| `shadow-lg` (Tailwind 標準) | `shadow-[var(--elevation-2)]`（要視覚確認） |

### Typography

旧コードは `text-[15px] leading-[1.95]` のような直接指定が多い。新では：

| 旧の典型パターン | 新 |
|---|---|
| `text-[clamp(34px,4vw,54px)] leading-[1.14]` | `getTypeClass('display')` |
| `text-[clamp(24px,3vw,40px)] leading-[1.22]` | `getTypeClass('headline')` |
| `text-[18px] leading-[1.4] font-semibold` | `getTypeClass('title')` |
| `text-[15px] / text-base leading-[1.95]` | `getTypeClass('body')` |
| `text-[11px] / text-xs uppercase tracking-[0.2em]` | `getTypeClass('label')` |
| `text-[13px] leading-[1.5]` | `getTypeClass('caption')` |

---

## CLAUDE.md 世界観ルールとの整合

CLAUDE.md の「UI ガードレール 14 項目」「世界観」「禁止事項」と本ドキュメントの整合を確認する。

| CLAUDE.md ルール | 本デザインシステムでの守り方 |
|---|---|
| **1. 状態は無言にしない** | `StateCard` を `surface / surface-container / warning` の 3 tone で運用。各状態が visible 化される |
| **2. フォームは閲覧/編集/保存済みが分かる** | `TextInput` の hover/focus/disabled 状態を `--outline → --outline-variant → --primary → state-disabled` で表現 |
| **3. クリックできるものは見た目でも分かる** | グローバル focus-visible（outline 3px）で全要素対応。hover は state layer または明示的 hover 色で |
| **4. 会話 UI は連続入力しやすさ最優先** | デザインシステム外の話題。ただし `--type-body` の行高 1.95 は会話表示にも適する |
| **5. テキストは「お願いごと」温度** | デザインシステム外（コピーの問題） |
| **6. 共通パターンを崩さない** | 本ドキュメントが「共通パターンの定義」そのもの。新規実装はこれを参照する |
| **7. AI/API コスト導線に ✨ を付ける** | `DevAiLabel` の存在を維持。トークン化で消えない |
| **8. URL params の引き継ぎ** | デザインシステム外 |
| **9. ログイン状態で表示分岐** | デザインシステム外 |
| **10. コピーは導線で変える** | デザインシステム外 |
| **11. DB 値とコードキー一致** | デザインシステム外 |
| **12. 課金/認証/プラン変更はレビュアー** | デザインシステム外 |
| **13. ブラウザネイティブダイアログ禁止** | 自作モーダル / トーストには `--elevation-4` `--elevation-5` を使う。alert / confirm を使わない選択肢としての視覚資源を提供 |
| **14. 遷移中ローディング表示ルール** | 既存 `ic-*` クラスを維持。新トークンに移行する際にも演出は変えない |
| **世界観：キャラアイコン優先** | `CharacterAvatar` `InterviewerSpeech` を維持。トークンは「キャラを載せる土台」のみ提供 |
| **世界観：絵文字 NG（フォールバック以外）** | デザインシステム外。`CharacterAvatar` のフォールバックロジックを維持 |
| **世界観：SaaS 的冷たい UI 禁止** | 暖色トークンを基本とする原則を本ドキュメントで明文化（影色も `rgba(28,20,16,...)` で純黒不採用） |
| **専門用語禁止（プロンプト/モデル/トークン/生成/AI）** | デザインシステム外（コピーの問題） |

---

## 移行手順（後続タスク）

本ドキュメント完成後、以下の順で実装を進める想定。**1 タスク 1 PR** が原則。

1. **globals.css 適用**：新ロール定義 + 互換 alias を `:root` に追加。**既存コードはこの段階で無修正のまま動作**することをローカルで確認。
2. **`components/ui.tsx` 内部書き換え**：上記の対比表に従って共有コンポーネントを新ロール参照に。API 不変、ビジュアル不変であることを目視で確認。
3. **新ヘルパー追加**：`getElevation` `getTypeClass` `getStateOpacity` を export。
4. **focus ring の二重定義整理**：各コンポーネントの `focus-visible:ring-2 ring-[...]` を撤去（globals の outline を信頼）。視覚確認で見えにくい箇所だけ例外で残す。
5. **site 側のハードコード色除去**：LP の `#xxx` グラデを `--surface-container-low` 〜 `--primary-container` の組み合わせに置換。10+ ファイルを 1 PR ずつ。
6. **shadow 段階化**：`shadow-[0_..._rgba(...)]` を `shadow-[var(--elevation-N)]` へ置換。
7. **typography 統一**：`text-[15px]` 系の直接指定を `getTypeClass(...)` に置換。site → tool → admin の順。
8. **旧 alias の削除**：すべての参照が新名に切り替わったら、`globals.css` の alias 群を削除。

各ステップは **既存挙動を壊さない**ことを最優先にする。視覚的なリファインメントは別タスクで切り分ける。

---

## やらないこと

- 既存ページのリファクタ（このドキュメントは「定義」までを担う）
- 新トークンへの一括置換（移行は段階的に）
- ダークモード対応（M3 の light/dark 二重定義は将来）
- Dynamic Color（HCT 自動生成）
- M3 既製コンポーネント（FAB / Snackbar / Bottom Sheet 等）の追加
- Material Symbols の採用（キャラアイコン優先）
- FV リデザイン依頼（デザインシステムが固まった後に別タスクで Claude Design に出す）
- Tailwind config の拡張（CSS 変数 + arbitrary value で当面回す）
