# 記事 埋め込みHTML デザイン仕様書

> Claude Design への依頼用。3パターンそれぞれのHTML/CSSを静的プロトタイプとして作成してほしい。

---

## 共通方針

- **トーン**: Insight Cast のブランドトーン（近未来的で暖かい）
- **配色**: 下記のデザイントークンに従う
- **フォント**: system-ui / sans-serif（外部フォント読み込みなし、どのサイトでも動く）
- **スタイル方式**: インラインCSS のみ（`<style>` タグ不可）。WordPressなど外部サイトのCSSと競合しないようにするため
- **最大幅**: `800px`、中央揃え
- **フッター**: 全パターン共通で末尾に `Powered by Insight Cast` リンクを入れる（後述）

### デザイントークン

```
背景（温かみのあるオフホワイト）: #fdf7f0
背景2（セクション区切り用）:      #f5e8d8
ボーダー:                         #e2d5c3
テキスト（メイン）:               #1c1410
テキスト（サブ）:                 #7a6555
テキスト（薄め）:                 #b8a898
アクセント（暖色）:               #c2722a
アクセント薄（バッジ背景等）:     #faebd7
インタビュアーバブル背景:         #fff8f0
事業者バブル背景:                 #f0f4ff
```

---

## パターン1: クライアント視点（`article_type: 'client'`）

事業者本人が一人称で語る読み物記事。暖かみのある読み物スタイル。

### 利用可能なデータ

| データ | 内容 |
|---|---|
| `title` | 記事タイトル |
| `content` | Markdown本文（markedでHTML変換済み） |
| `created_at` | 公開日 |

### レイアウト構成

```
┌─────────────────────────────────────┐
│ [眉文字: "取材記事"]                 │  ← 小さい上部ラベル、アクセントカラー
│                                     │
│  タイトル（大）                      │  ← h1, 太め
│                                     │
│  公開日                             │  ← テキスト薄め、小さめ
│                                     │
│ ─────────────────────────────────── │  ← 区切り線（アクセントカラー）
│                                     │
│  本文                               │  ← markedで変換されたHTML
│  ・h2見出し: 左にアクセントカラーの  │
│    縦ボーダーを入れる                │
│  ・本文: 行間1.8、テキストサブカラー │
│  ・リスト: 標準スタイル             │
│                                     │
│ ─────────────────────────────────── │
│  Powered by Insight Cast ↗          │  ← フッター（共通）
└─────────────────────────────────────┘
```

### スタイル指示

- 背景: `#fdf7f0`
- 全体を `padding: 40px 32px` の `div` で包む
- `h1`: `font-size: 24px`, `font-weight: 700`, `color: #1c1410`, `line-height: 1.4`
- `h2`: `font-size: 18px`, `font-weight: 700`, `border-left: 3px solid #c2722a`, `padding-left: 12px`, `color: #1c1410`
- `p`: `font-size: 15px`, `line-height: 1.8`, `color: #7a6555`
- 上部ラベル: `font-size: 11px`, `font-weight: 700`, `letter-spacing: 0.1em`, `color: #c2722a`, `text-transform: uppercase`

---

## パターン2: インタビュアー視点（`article_type: 'interviewer'`）

AIキャストが「取材して発見した魅力」を語る。取材レポート感のあるスタイル。冒頭にキャストのバイライン（署名）が入る。

### 利用可能なデータ

| データ | 内容 |
|---|---|
| `title` | 記事タイトル |
| `content` | Markdown本文（markedでHTML変換済み） |
| `created_at` | 公開日 |
| `interviewer_id` | キャストID（`'mint'` / `'claus'` / `'rain'`） |
| `interviewer_name` | キャスト名（`ミント` / `クラウス` / `レイン`） |
| `interviewer_label` | キャスト専門ラベル（`Customer Perspective` 等） |

### レイアウト構成

```
┌─────────────────────────────────────┐
│ [眉文字: "取材レポート"]             │  ← 小さい上部ラベル、アクセントカラー
│                                     │
│  タイトル（大）                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [●] ミント  Customer Perspective│ │  ← バイライン。●はキャストカラーの丸
│ │     2026.04.23 取材              │ │
│ └─────────────────────────────────┘ │  ← 背景 #f5e8d8、rounded
│                                     │
│  本文                               │
│  ・h2見出し: 上部に細い区切り線      │
│  ・本文: クライアント視点より少し    │
│    ドキュメント感。#1c1410に近い色  │
│                                     │
│ ─────────────────────────────────── │
│  Powered by Insight Cast ↗          │
└─────────────────────────────────────┘
```

### キャストカラー

| キャストID | 名前 | カラー |
|---|---|---|
| `mint` | ミント | `#c2722a` |
| `claus` | クラウス | `#0f766e` |
| `rain` | レイン | `#7c3aed` |

### スタイル指示

- 背景: `#fdf7f0`
- バイライン欄: `background: #f5e8d8`, `border-radius: 12px`, `padding: 12px 16px`, `display: flex`, `align-items: center`, `gap: 10px`
- バイラインの●: `width: 10px`, `height: 10px`, `border-radius: 50%`, キャストカラーで塗る
- `h2`: `font-size: 17px`, `font-weight: 700`, `border-top: 1px solid #e2d5c3`, `padding-top: 20px`, `margin-top: 28px`
- `p`: `font-size: 15px`, `line-height: 1.8`, `color: #3d2b1f`（クライアント視点より少し濃め）

---

## パターン3: 会話形式（`article_type: 'conversation'`）

Q&A・FAQ・お客様の声としても汎用的に使える会話バブルレイアウト。
タイトル・日付・キャスト情報は含まない。会話ブロックのみを出力し、埋め込み先のコンテンツと自然に馴染む。

### 利用可能なデータ

| データ | 内容 |
|---|---|
| `content` | Markdown本文（パース前）|
| `interviewer_name` | キャスト名（話者判定に使用） |
| `client_name` | 事業者名（イニシャルバッジに使用） |

### 会話データの構造

記事本文（`content`）の会話パートは以下のMarkdown形式:

```
**ミント**: 質問テキスト

**事業者名**: 回答テキスト

**ミント**: 次の質問

**事業者名**: 次の回答
```

正規表現 `/^\*\*(.+?)\*\*[:：]\s*(.+)$/` で検出し、バブルに変換する。

### レイアウト構成

```
─────────────────────────────────────
                                     
              ┌──────────────────────┐  ← 右: 質問（インタビュアー）アイコンなし
              │ 質問テキスト         │     背景 #ede8e0
              └──────────────────────┘
                                     
[事] ┌──────────────────────────┐       ← 左: 回答（事業者）イニシャルバッジあり
     │ 回答テキスト              │          背景 #e8eeff
     └──────────────────────────┘
                                     
（繰り返し）
                          Powered by Insight Cast ↗
─────────────────────────────────────
```

### スタイル指示

**ラッパー**
- 背景: なし（透明。埋め込み先に馴染む）
- `max-width: 800px`, `margin: 0 auto`, `padding: 28px 0`（左右パディングなし）

**上下ボーダー**
- `height: 1px`, `background: #e2d5c3`
- 上: `margin-bottom: 28px` / 下: Powered by の直後

**質問バブル（右寄せ・アイコンなし）**
- `display: flex`, `justify-content: flex-end`, `margin-bottom: 12px`
- バブル: `background: #ede8e0`, `border-radius: 16px 4px 16px 16px`
- `padding: 14px 18px`, `max-width: 60%`
- `font-size: 15px`, `line-height: 1.85`, `color: #3d2b1f`

**回答バブル（左寄せ・イニシャルバッジあり）**
- `display: flex`, `align-items: flex-start`, `gap: 12px`, `margin-bottom: 24px`
- バッジ: `width: 44px`, `height: 44px`, `border-radius: 50%`, `background: #d4a26a`, 白文字, `font-size: 15px`, `font-weight: 700`
- バブル: `background: #e8eeff`, `border-radius: 4px 16px 16px 16px`
- `padding: 14px 18px`, `max-width: 60%`
- `font-size: 15px`, `line-height: 1.85`, `color: #2a2a3d`

**Powered by（下ボーダーの直前・右寄せ）**
- `text-align: right`, `margin-bottom: 12px`
- リンク: `font-size: 11px`, `color: #b8a898`, `text-decoration: none`, `letter-spacing: 0.05em`
- href: `https://insight-cast.jp`（dofollow、`rel="nofollow"` 付けない）

---

## 共通フッター（全パターン）

```html
<div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2d5c3; text-align: right;">
  <a href="https://insight-cast.jp"
     target="_blank"
     style="font-size: 11px; color: #b8a898; text-decoration: none; letter-spacing: 0.05em;">
    Powered by Insight Cast ↗
  </a>
</div>
```

- `rel="nofollow"` は付けない（被リンク効果を活かすため）
- 目立たせすぎない。ユーザーのコンテンツを邪魔しない

---

## Claude Design への依頼事項

1. 上記3パターンを **静的HTML（インラインCSS）** で作成してほしい
2. 各パターンにダミーコンテンツを入れてプロトタイプを作成する
3. スマートフォン幅（375px）でも崩れないようにする（`max-width: 100%`, `box-sizing: border-box`）
4. 完成したHTMLはそのまま `ArticleExportPanel.tsx` のテンプレート文字列として使える形にする（JavaScriptの変数埋め込みを想定した `{{title}}` `{{content}}` 等のプレースホルダーを入れておく）

### プレースホルダー一覧

| プレースホルダー | 内容 |
|---|---|
| `{{title}}` | 記事タイトル |
| `{{content}}` | 変換済みHTML本文 |
| `{{date}}` | 公開日（例: 2026.04.23） |
| `{{interviewer_name}}` | キャスト名（パターン2・3） |
| `{{interviewer_label}}` | キャスト専門ラベル（パターン2） |
| `{{interviewer_color}}` | キャストカラー（パターン2・3） |
| `{{interviewer_initial}}` | キャストイニシャル（パターン3） |
| `{{client_name}}` | 事業者名（パターン3） |
| `{{client_initial}}` | 事業者名イニシャル（パターン3） |
