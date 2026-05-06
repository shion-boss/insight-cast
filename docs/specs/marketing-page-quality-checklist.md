# マーケティングページ品質チェックリスト

> Phase 2 で LP を Lighthouse 4部門 100 に持ち上げた際の知見を、新しいページや既存ページの改善時に再利用するためのチェックリスト。
> 対象は `app/(site)/` 配下の marketing ルート全般（LP / about / blog / cast / faq / philosophy / pricing / privacy / terms / tokushoho / cast-talk）。

---

## 1. グローバル設定（基盤・全ページ自動反映）

新しい marketing ページを追加する場合、これらは既に整っているのでそのまま恩恵を受ける。**追加ページ側の作業は不要**。

| 項目 | 場所 | 観点 |
|---|---|---|
| Static rendering | `app/(site)/<route>/page.tsx` | server component で `cookies()` / `getUser()` を呼ばないこと。`searchParams` を読むと dynamic 化するので注意 |
| フォント | `app/layout.tsx` | M PLUS 1p は撤去済（CSS 281KB / woff2 378個削減）。Geist Mono は tool/admin 限定 |
| Sentry SDK | `instrumentation-client.ts` 空 / `components/sentry-loader.tsx` | marketing には Sentry が乗らない（dynamic import で tool/admin 限定） |
| Supabase client | `lib/auth-state.ts` の `useIsLoggedIn` は cookie 判定で SDK を import しない | marketing で `import('@/lib/supabase/client')` を直接使わない |
| Tool 専用 CSS | `app/tool.css` を `(tool)/layout.tsx` でのみ import | `.ic-loading-*` 系は marketing に乗らない |
| GTM | `app/components/google-analytics.tsx` で `lazyOnload` | preconnect / dns-prefetch は `app/layout.tsx` にある |
| Critical CSS | `scripts/inline-critical-css.mjs`（`postbuild` で自動実行） | Static prerender HTML に critical CSS を inline + 残りを `media=print` で defer |
| middleware | `middleware.ts` の `isFullyPublicSkippableAuth()` | 新しい marketing ルート追加時はここに追加（auth 不要 path） |

---

## 2. ページ単位のパフォーマンス（必要なときに適用）

### 2-1. LCP 画像
LCP 候補（above-the-fold の Hero 画像など）には:
```tsx
<Image src={...} priority quality={60} sizes="..." />
```
- `priority` で preload + fetchpriority=high
- `quality={60}` で AVIF/WebP の転送量を 30%削減（`next.config.ts` の qualities=[60,75,85] で許可済）
- `sizes` を実 render に合わせて指定（mobile=100vw, desktop=480px 等）

### 2-2. 長いページ：below-fold セクションに `content-visibility: auto`
LP のように 5+ セクションある縦長ページのみ。`globals.css` の `.cv-auto-section` を section root に付与:
```tsx
<section className="cv-auto-section py-14 ...">...</section>
```
viewport 外のセクションのスタイル/レイアウト計算をブラウザが skip する。短いページ（privacy/terms/tokushoho 等）は不要。

### 2-3. tool/auth への `<Link>` には `prefetch={false}`
marketing ページから `/dashboard` `/auth/login` `/auth/signup` `/settings` `/pricing` に飛ぶリンクは全て:
```tsx
<Link href="/auth/signup" prefetch={false} ...>...</Link>
```
これがないと Next.js が tool/auth ルートの chunk（Supabase JS 等）を marketing HTML の `<script async>` に含めてしまう。

---

## 3. ページ単位のアクセシビリティ（コントラスト）

### 3-1. text-[var(--accent)] は使わない（小さい/通常テキスト）
`--accent`（#c2722a）は white 上で 4.0:1 = AA fail。

| 用途 | 使うトークン |
|---|---|
| 小さいテキスト・ラベル（10〜14px） | `text-[var(--on-primary-container)]`（#8a4a18, ~6:1 PASS） |
| Hover state | `hover:text-[var(--accent)]` は OK（hover には AA 要件なし） |
| 大きい見出し（≥18px font-bold） | `text-[var(--accent)]` も AA-LG (3:1) PASS なので可 |
| Border / 装飾的な背景 | `border-[var(--accent)]` / `bg-[var(--accent-l)]` は OK（テキストではない） |

### 3-2. text-[var(--text3)] は機能テキストには使わない
`--text3`（#8f7d6d）は ~3:1 = AA fail。

| 用途 | 使うトークン |
|---|---|
| 機能ラベル・日付・抜粋・補助情報 | `text-[var(--text2)]`（#7a6555, ~5:1 PASS） |
| 純装飾（disable な視覚的弱化） | `text-[var(--text3)]` のままでもよい（読まれる必要がないもの） |

### 3-3. CTA ボタン（white text on accent bg）
`bg-[var(--accent)] text-white` は 4.0:1 = AA fail。

| 用途 | 使うトークン |
|---|---|
| primary CTA の bg | `bg-[var(--accent-h)]`（#a85e20, ~5:1 PASS） |
| hover bg | `hover:bg-[var(--on-primary-container)]`（#8a4a18, ~7:1） |
| 共通ボタン（ButtonLink/ButtonAction） | `components/ui.tsx` の `buttonToneClass.primary` で既に対応済。`getButtonClass('primary', ...)` を使えば自動で AA pass |

### 3-4. 白文字 opacity（accent 系背景上）
- `text-white/85` 以下は AA fail のリスクが高い
- 本文（13px 以下）には `text-white`（完全白）を使う
- `text-white/95` は border 程度の差で borderline OK だが、念のため完全白推奨

### 3-5. inline color の hex 直書きを避ける
`style={{ color: '#c2722a' }}` 等は AA をすり抜けやすい。
- 小さいテキスト用途 → `var(--on-primary-container)`
- 弱コントラストの灰系 (`#b8a898`) → `var(--on-surface-variant)` (#7a6555)
- カテゴリ・テーマパレット系（BlogCategoryColor / CastTalkTheme）の `mint: '#c2722a'` は `'#8a4a18'` で揃える

---

## 4. ページ追加・改修時のチェック手順

### 監査 grep（2分でできる）
```bash
# 違反候補件数
grep -cE "[^:]text-\[var\(--accent\)\]" app/(site)/<route>/page.tsx        # 小さいテキストで使われてないか
grep -cE "[^:]text-\[var\(--text3\)\]" app/(site)/<route>/page.tsx         # 機能テキストで使われてないか
grep -cE "bg-\[var\(--accent\)\] text-white" app/(site)/<route>/page.tsx   # CTA で使われてないか
grep -cE "color: ?'#c2722a'|color: ?'#b8a898'" app/(site)/<route>/page.tsx # inline 色
grep -cE "/dashboard|/auth/(login|signup)" app/(site)/<route>/page.tsx     # prefetch=false 検討
```

### 一括置換（hover/focus を保護）
```bash
sed -i.bak \
  -e 's/\([^:]\)text-\[var(--accent)\]/\1text-[var(--on-primary-container)]/g' \
  -e 's/\([^:]\)text-\[var(--text3)\]/\1text-[var(--text2)]/g' \
  -e 's/bg-\[var(--accent)\] text-white/bg-[var(--accent-h)] text-white/g' \
  app/(site)/<route>/page.tsx
rm app/(site)/<route>/page.tsx.bak
```

### 検証
1. `npm run typecheck && npm run build` が通る
2. ビルド出力で対象ルートが `○ Static`（または ● SSG）であること
3. 大きい見出しの `text-[var(--accent)]` を誤って置換していないか目視確認
4. PSI で再計測（Lighthouse 4 部門）

---

## 5. ページ別の状態（2026-05-06 時点）

| ルート | Static | LCP最適化 | コントラスト | 備考 |
|---|---|---|---|---|
| `/` | ○ | ✅ Hero quality=60, content-visibility | ✅ | LP（基準ページ） |
| `/about` | ○ | – | ✅ | |
| `/blog` | ○ (5m) | – | ✅ | |
| `/blog/[slug]` | ● SSG (5m) | – | ✅ | |
| `/cast` | ○ (5m) | – | ✅ | |
| `/cast-talk` | ƒ Dynamic | – | ✅ | searchParams (page) で dynamic |
| `/cast-talk/[slug]` | ƒ Dynamic | – | ✅ | dynamic generateMetadata |
| `/contact` | ○ | – | ✅ | |
| `/faq` | ○ | – | ✅ | |
| `/philosophy` | ○ | – | ✅ | |
| `/pricing` | ƒ Dynamic | – | ✅ | searchParams (reason/plan) で dynamic |
| `/privacy` | ○ | – | ✅ | |
| `/terms` | ○ | – | ✅ | |
| `/tokushoho` | ○ | – | ✅ | |

---

## 6. tool / admin 側への適用

tool 側（認証済み）と admin 側でも、コントラスト系（観点 C）は marketing と同じパターンで適用できる。
ただし以下は **適用しない**:

- Static 化・content-visibility・critters・preconnect・prefetch=false（tool は dynamic 前提・内部ナビは prefetch あり推奨）
- Sentry 除外（tool には必要）
- LCP 画像 quality 60（機能 UI なので優先度低）

### 暗背景上の brand text に注意（誤置換ポイント）

`bg-[var(--surface-dark)]`（#1c1410）等の **暗背景上**で `text-[var(--accent)]` を使っているケースは、`--on-primary-container`（#8a4a18）に置換すると逆に読めなくなる。暗背景上では:
- 完全白 (`text-white`) — 読みやすい・無難
- 明るい brand orange `text-[#e8954a]` — ブランド色で映える（PainSection / CompareCards で既に採用、AA pass）

判断: 一括 sed で置換した後、`grep -nE "(surface-dark|#1c1410|#1e1610).*on-primary-container"` 系で誤置換を検出して個別に戻す。

### tool 側の実績

2026-05-06 に `app/(tool)/` + `app/admin/` + 関連 components 計 104 ファイルを一括処理:
- `text-[var(--accent)]` 51件 / `text-[var(--text3)]` 379件 / `bg-[var(--accent)] text-white` 23件 を解消
- `app/admin/layout.tsx` と `components/admin-mobile-nav.tsx` の "Cast" ロゴ（暗背景）は `text-[#e8954a]` に修正

---

## 7. 新ページ追加時の最短手順

1. `app/(site)/<route>/page.tsx` を作る
2. server component なら `cookies()` / `getUser()` を呼ばない（dynamic 化を防ぐ）
3. auth state を見たいなら `useIsLoggedIn()`（client-side、SDK ロードなし）
4. tool/auth に飛ぶ `<Link>` には `prefetch={false}`
5. CTA ボタンは `getButtonClass('primary')`（既に AA 対応済）か `bg-[var(--accent-h)]` を使う
6. eyebrow / label の小さいテキストは `text-[var(--on-primary-container)]`、補助情報は `text-[var(--text2)]`
7. inline color の hex 直書きはしない（`var(--*)` トークン経由）
8. 長いページなら下半分 section に `cv-auto-section` クラス
9. LCP 画像は `priority quality={60}`
10. ビルドして `○ Static` か確認、PSI で 100 を狙う
