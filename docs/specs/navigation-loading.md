# ナビゲーション Loading 実装仕様

> デグレチェック用リファレンス。実装を変更したときは必ずこのドキュメントを確認し、
> チェックリストの全項目が満たされていることを確認する。

---

## 設計方針

ページ遷移中の UX を「現在のページを保持 → プログレスバー表示 → 新ページが完全に描画されたらバー消去」の順序で実現する。白い中間状態・全画面スピナー・コンテンツの空白を遷移中に出さない。

---

## 実装の全体像

### 担当コンポーネント

| コンポーネント | 役割 | 配置 |
|---|---|---|
| `NavigationOverlay` | tool / admin エリア内遷移のプログレスバー | `app/layout.tsx`（ルート） |
| `SiteHeaderClient` | site エリア内遷移のプログレスバー（ヘッダー下端） | `components/site-header.tsx` 経由 |
| `PageTransitionOverlay` | エリア間遷移（site ↔ tool）の全画面ローディング | `app/layout.tsx`（ルート） |
| `loading.tsx`（各セグメント） | `return null`（意図的に空） | 各ルートセグメント |

---

## NavigationOverlay の仕組み

### ファイル
`components/navigation-overlay.tsx`

### 動作フロー

```
1. ユーザーが <Link> をクリック
   └─ handleClick (capture フェーズ) が発火
      ├─ 外部URL / 同一ページ / エリアをまたぐ遷移 → スキップ
      ├─ site エリア内遷移 → スキップ（SiteHeaderClient が担当）
      └─ tool / admin エリア内遷移 → 続行
         ├─ [data-app-header] の bottom を取得してバーの top を決定
         ├─ クリックした <a> に data-nav-pending="true" を付与
         │   └─ CSS: opacity 0.5 + pointer-events: none + cursor: wait
         └─ flushSync(() => setVisible(true)) でバーを即時表示

2. Next.js が新ページを RSC フェッチ（バックグラウンド）
   └─ React は startTransition 中のため旧ページをそのまま表示し続ける
      （loading.tsx = null なのでフォールバックなし → stale content を保持）

3. React が新ページを DOM にコミット → usePathname() が変化
   └─ useEffect([pathname]) が発火
      ├─ MIN_MS（400ms）が残っていれば残り時間だけ待つ
      └─ double requestAnimationFrame でブラウザの描画完了を待機
         └─ setTimeout 300ms 後に setVisible(false)
            └─ data-nav-pending 属性をクリア
```

### 定数

| 定数 | 値 | 意味 |
|---|---|---|
| `MIN_MS` | `400` | バーが最低限表示される時間（ms）|
| hide delay | `300` | 新ページ描画後、バーが消えるまでの遅延（ms）|

### エリア判定（`lib/nav-area.ts`）

```
tool  : /dashboard, /projects/*, /interviews/*, /articles/*, /settings/*, /onboarding
admin : /admin/*
site  : 上記以外（LP・ブログ等）
```

- **tool / admin 内**: `NavigationOverlay` が担当
- **site 内**: `SiteHeaderClient` が担当（`NavigationOverlay` はスキップ）
- **エリアをまたぐ遷移**: `PageTransitionOverlay` が担当

### バーの位置

```tsx
// [data-app-header] 要素の bottom を取得
const h = document.querySelector('[data-app-header]')?.getBoundingClientRect().bottom ?? 62
style={{ top: headerBottom }}
```

`data-app-header` 属性は以下に付与されている:
- `components/app-shell.tsx` — tool エリアのヘッダー
- `app/admin/layout.tsx` — admin エリアのヘッダー

### アニメーション（`app/globals.css`）

```css
@keyframes page-load {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
/* バーの class: animate-[page-load_1s_ease-in-out_infinite] */
```

左から右へ 1 秒で掃け、無限ループする。

### クリックフィードバック（`app/globals.css`）

```css
a[data-nav-pending] {
  opacity: 0.5;
  pointer-events: none;
  cursor: wait;
}
```

---

## SiteHeaderClient の仕組み

### ファイル
`components/site-header-client.tsx`

### 役割
site エリア（LP・ブログ等）内のページ間遷移でプログレスバーを表示する。
`NavigationOverlay` が site 内遷移をスキップするため、site ヘッダー自身が担当する。

### 動作フロー

```
1. ユーザーが site エリア内の <a> をクリック
   └─ handleClick (capture フェーズ) が発火
      ├─ 外部URL / 同一ページ / どちらかが tool/admin → スキップ
      └─ site → site の遷移 → 続行
         ├─ prevPath.current = 現在のパス
         ├─ hideAt.current = Date.now() + MIN_MS（400ms）
         └─ setNavActive(true) でバーを表示

2. React が新ページを DOM にコミット → usePathname() が変化
   └─ useEffect([pathname]) が発火
      ├─ MIN_MS（400ms）が残っていれば残り時間だけ待つ
      └─ double requestAnimationFrame でブラウザの描画完了を待機
         └─ setTimeout 300ms 後に setNavActive(false) でバーを消す
```

### バーの位置

ヘッダー要素（`<header>`）の `bottom` 直下、`sticky top-0` ヘッダーに `absolute` で貼りついている。

```tsx
{navActive && (
  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
    <div className="h-full animate-[page-load_1s_ease-in-out_infinite] bg-[var(--accent)]" />
  </div>
)}
```

### NavigationOverlay との違い

| 項目 | NavigationOverlay | SiteHeaderClient |
|---|---|---|
| 対象エリア | tool / admin | site |
| バー位置 | `[data-app-header]` の bottom | ヘッダー `<header>` の bottom 直下 |
| 即時表示 | `flushSync` | 通常 `setState`（ヘッダーは常時表示で問題なし） |
| クリックフィードバック | `data-nav-pending` 属性付与 | なし（site ヘッダーは軽量） |

---

## loading.tsx の役割

**全セグメントで `return null`。これは意図的な設計。**

```tsx
// NavigationOverlay がローディング演出を担うため null を返す
export default function Loading() {
  return null
}
```

### なぜ null なのか

Next.js App Router では `<Link>` が内部で `startTransition` を使う。
`loading.tsx` が null（フォールバックなし）のとき、React は遷移中に旧ページの
stale content を保持したまま新ページを裏で準備する。
新ページの RSC ペイロードが揃ったタイミングで原子的にコミットされる。

全画面スピナーや骨格 UI を挟まないことで「白飛び」「中間スピナー」が出なくなる。

---

## デグレチェックリスト

ナビゲーション関連の実装変更（レイアウト・ルーティング・loading.tsx）をしたときに確認する。

### 基本動作

- [ ] tool エリア内のページ間（例: `/dashboard` → `/projects`）でリンクをクリックしたとき、クリックした瞬間からプログレスバーが出る
- [ ] 遷移中、現在のページのコンテンツがそのまま表示されている（真っ白にならない）
- [ ] 新しいページが描画された後、約0.3秒でバーが消える（消えるタイミングが新ページ表示より早くない）
- [ ] クリックした `<a>` 要素が `opacity: 0.5` + `cursor: wait` になる
- [ ] 遷移完了後、`<a>` の opacity が元に戻っている

### エリア別の動作

- [ ] site エリア内（LP・ブログ等）の遷移で `NavigationOverlay` のバーが**出ない**（SiteHeaderClient が担当）
- [ ] site エリア内の遷移でヘッダー下端にプログレスバーが出る（SiteHeaderClient）
- [ ] site → tool（ログイン後など）の遷移で全画面ローディング（`PageTransitionOverlay`）が出る
- [ ] admin エリア内の遷移でバーが出る（`[data-app-header]` 下端にくっついている）
- [ ] 遷移中にフッターが持ち上がらない（site 側でコンテンツが消えない）

### 実装チェック

- [ ] `NavigationOverlay` が `app/layout.tsx` のルートレイアウトに**1箇所だけ**配置されている
- [ ] 各セグメントの `loading.tsx` が `return null` になっている（全画面スピナーを返していない）
- [ ] ページコンポーネント内に `<Suspense fallback={<スピナー />}>` が増えていない（中間状態の原因になる）
- [ ] `data-app-header` 属性がヘッダー要素に付いている（tool: `app-shell.tsx`、admin: `admin/layout.tsx`）
- [ ] `lib/nav-area.ts` の `TOOL_PATHS` に新しいツールページのパスが追加されている（追加した場合）

### やってはいけない変更

- `loading.tsx` に全画面スピナーや骨格 UI を追加する → 白飛び・中間状態の原因
- ページ内部に `<Suspense fallback={<何か />}>` で大きなセクションを囲む → 遷移時に中間スピナーが出る
- `NavigationOverlay` をルートレイアウト以外に移動する → ページ遷移で再マウントされる
- `data-app-header` 属性をヘッダーから外す → バーの位置がデフォルト値（62px）になる
- `SiteHeaderClient` の `setNavActive(false)` を double rAF + 300ms を外して即時呼ぶ → site 側でフッターが持ち上がる
- `SiteHeaderClient` にオーバーレイ div（`fixed` + 背景色）を追加する → サイト遷移中にコンテンツが消えてフッターが浮く

---

## 関連ファイル

| ファイル | 内容 |
|---|---|
| `components/navigation-overlay.tsx` | tool / admin エリアのプログレスバー |
| `components/site-header-client.tsx` | site エリアのプログレスバー（ヘッダー内） |
| `lib/nav-area.ts` | エリア判定ロジック・TOOL_PATHS |
| `app/globals.css` | `page-load` アニメーション・`a[data-nav-pending]` スタイル |
| `components/app-shell.tsx` | tool エリアのヘッダー（`data-app-header` 付与） |
| `app/admin/layout.tsx` | admin エリアのヘッダー（`data-app-header` 付与） |
| `components/page-transition-overlay.tsx` | エリア間遷移の全画面ローディング |
