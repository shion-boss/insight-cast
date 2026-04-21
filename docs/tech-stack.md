# 技術スタック詳細規約

> 対象読者: build / arch / review
> Phase 1 MVP 構築開始時点の合意事項。変更する場合は `docs/decisions/` に記録してから更新する。

---

## 1. 使用技術一覧

| 領域 | 採用技術 | 備考 |
|---|---|---|
| フロントエンド | Next.js 15 (App Router) | Pages Router は使わない |
| 言語 | TypeScript（strict モード） | `strict: true` 必須 |
| スタイル | Tailwind CSS v4 | CSS-in-JS は使わない |
| バックエンド/DB | Supabase | Auth / DB / Storage / Edge Functions |
| ホスティング | Vercel | Preview Deploy / Production Deploy |
| AI API（プロダクト用） | Anthropic Claude / OpenAI | 社内AIとは分離。詳細は Section 6 |
| コード管理 | GitHub | ブランチ戦略は Section 7 |

---

## 2. ディレクトリ構成方針

```
app/                          # Next.js App Router のルート
├── (auth)/                   # 認証が必要なルートグループ
│   ├── dashboard/            # Phase 1 内部ツール画面
│   └── interview/            # インタビュー実施画面
├── (public)/                 # 認証不要ルートグループ（Phase 3 以降）
├── api/                      # Route Handlers
│   ├── interview/            # インタビュー関連 API
│   ├── analysis/             # サイト分析 API
│   └── webhooks/             # 外部サービス Webhook 受信
└── layout.tsx                # ルートレイアウト

components/
├── ui/                       # 汎用 UI コンポーネント（ボタン・モーダル等）
├── characters/               # キャラアイコン・キャラメッセージ
├── interview/                # インタビュー画面固有コンポーネント
└── layout/                   # ヘッダー・サイドバー等

lib/
├── supabase/
│   ├── client.ts             # ブラウザ用 Supabase クライアント
│   ├── server.ts             # サーバー用 Supabase クライアント
│   └── middleware.ts         # Auth Middleware
├── ai/
│   ├── claude.ts             # Anthropic SDK ラッパー（プロダクトAI用）
│   └── openai.ts             # OpenAI SDK ラッパー（プロダクトAI用）
├── utils/                    # 汎用ユーティリティ
└── types/                    # 共通型定義（DB の型含む）

types/
└── database.ts               # Supabase CLI で自動生成する DB 型

public/
├── characters/
│   ├── portraits/            # キャラ全身・半身イラスト
│   └── icons/                # UI 用小サイズアイコン（24px / 48px / 96px）
└── ...

supabase/
├── migrations/               # DB マイグレーションファイル
└── seed.sql                  # 開発用シードデータ
```

### 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネントファイル | PascalCase | `CharacterIcon.tsx` |
| ユーティリティファイル | kebab-case | `format-date.ts` |
| Route Handler | ディレクトリ名 + `route.ts` | `app/api/interview/route.ts` |
| Supabase テーブル | snake_case | `interview_sessions` |
| 型名 | PascalCase | `InterviewSession` |
| 環境変数 | UPPER_SNAKE_CASE | `NEXT_PUBLIC_SUPABASE_URL` |

---

## 3. TypeScript 設定・コーディング規約

### tsconfig.json の基本設定

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

`strict: true` が有効にするオプション（全て守ること）:
- `strictNullChecks`: `null` / `undefined` の混入を型で防ぐ
- `strictFunctionTypes`: 関数型の引数の共変性チェック
- `noImplicitAny`: 暗黙的な `any` を禁止

### 型の使い方

```typescript
// 良い: 明示的な型
const fetchSession = async (id: string): Promise<InterviewSession> => { ... }

// 悪い: any を使う
const fetchSession = async (id: any): Promise<any> => { ... }

// 良い: null チェック
const name = session?.user?.name ?? "名前なし";

// 悪い: 非 null アサーション（! 演算子）の乱用
const name = session.user!.name;
```

- `any` は原則禁止。どうしても必要な場合は `// eslint-disable-next-line @typescript-eslint/no-explicit-any` とコメント理由を添える
- 非 null アサーション（`!`）は使わない。`??` や `?.` で対処する
- `unknown` を受け取った場合は型ガードで絞り込んでから使う
- API レスポンスには必ず型を定義する（`z.infer<typeof Schema>` で Zod と組み合わせると良い）

### エラーハンドリング

```typescript
// Route Handler の基本形
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // ...
    return Response.json({ success: true, data });
  } catch (error) {
    // error は unknown 型なので instanceof で絞り込む
    if (error instanceof SomeError) {
      return Response.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("Unexpected error:", error);
    return Response.json({ success: false, message: "もう一度お試しください" }, { status: 500 });
  }
}
```

- エラーメッセージは顧客向け画面では「どうすればいいか」を書く（「エラーが発生しました」は使わない）
- サーバーエラーはコンソールにログを残す。顧客には詳細を出さない

---

## 4. Tailwind CSS 使い方方針

### 基本原則

- CSS ファイル（`*.module.css` 等）は原則作らない。Tailwind ユーティリティクラスで完結させる
- 共通スタイルはコンポーネント化する（`cn()` ヘルパーと `class-variance-authority` (CVA) を活用）
- `@apply` は使わない

### カラーパレット

世界観（水彩調・アンティーク・やわらかい配色）に合わせ、`tailwind.config.ts` でカスタムカラーを定義する。

```typescript
// tailwind.config.ts の抜粋（Phase 1 で確定させる）
theme: {
  extend: {
    colors: {
      brand: {
        cream:   "#F5F0E8",   // 背景: アンティーク白
        warm:    "#E8DCC8",   // カード背景
        primary: "#5B8A6F",   // プライマリグリーン
        accent:  "#C4763A",   // アクセントオレンジ
        text:    "#3A3228",   // メインテキスト
        muted:   "#8A7E72",   // サブテキスト
      },
    },
  },
}
```

### キャラアイコンの扱い

- UIメッセージ・通知・エラーには必ずキャラアイコンを添える
- アイコンサイズは `w-6 h-6`（24px）/ `w-12 h-12`（48px）/ `w-24 h-24`（96px）で統一
- `<Image>` コンポーネントを使い、`alt` には `"[キャラ名] のアイコン"` を設定

### アニメーション

- ローディング・待機中のアニメーションはキャラアイコン付きで行う
- `transition-*` / `animate-*` ユーティリティを使う。ゴテゴテした演出は不要
- 「AI が動いている感」を出すが「生成中」等の表現は画面に出さない

---

## 5. Supabase 使い方方針

### クライアントの使い分け

| 使う場所 | クライアント | ファイル |
|---|---|---|
| Server Components / Route Handlers | `createServerClient` | `lib/supabase/server.ts` |
| Client Components | `createBrowserClient` | `lib/supabase/client.ts` |
| Middleware | `createServerClient` | `lib/supabase/middleware.ts` |

`lib/supabase/server.ts` では `cookies()` を使ってセッションを読む。

### Auth（認証）

- Phase 1（内部運用ツール）: Supabase Auth の Email/Password 認証を使う
- Phase 3（顧客向け）: Magic Link または Google OAuth を追加検討
- セッションは Supabase の `pkce` フローで管理する
- Middleware で未認証アクセスをはじく（`(auth)/` 配下は必須）

```typescript
// middleware.ts の基本形
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}
```

### DB 設計方針

- テーブル名は snake_case（複数形）
- 全テーブルに `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
- 全テーブルに `created_at timestamptz DEFAULT now()` / `updated_at timestamptz DEFAULT now()`
- Row Level Security (RLS) を必ず有効化する
- マイグレーションは `supabase/migrations/` に連番で管理する（`YYYYMMDDHHMMSS_description.sql`）

### 主要テーブル（Phase 1 最小セット）

```
clients               # 顧客情報
interview_sessions    # インタビューセッション
interview_messages    # インタビューの発言履歴（1メッセージ1行）
site_analyses         # HP分析結果
competitor_analyses   # 競合分析結果
articles              # 生成した記事・素材
```

### Storage

- バケット: `character-icons`（公開）/ `client-assets`（認証必須）
- クライアントから直接アップロードする場合は RLS ポリシーで `auth.uid()` を必ず検証する

### 履歴保存

- インタビューの発言は1メッセージ1行で `interview_messages` に保存する
- `role` カラムで `user` / `assistant` / `system` を区別する
- AI に渡す文脈構築は `interview_messages` から取得して組み立てる
- 保存漏れを防ぐため、AI レスポンス受信直後に DB 保存する（画面表示より先に保存する）

---

## 6. AI API の使い方方針

### 社内AIとプロダクトAIの分離（重要）

| 種別 | 定義 | コスト管理 | 業種知識の蓄積先 |
|---|---|---|---|
| 社内AI | この Claude Code + `.claude/agents/` の7人 | Anthropic Console（開発コスト） | CLAUDE.md / agents/ ファイル |
| プロダクトAI | Next.js アプリ内でエンドユーザーに対して動くAI | Supabase + Vercel 経由のランタイムコスト | キャラの prompt / `lib/ai/` |

- 社内AIに業種知識を溜めない（プロダクトAI側のキャラに持たせる）
- 個別顧客のHP診断を社内AIがやらない（プロダクトAIの仕事）

### Anthropic Claude（プロダクトAI用）

```typescript
// lib/ai/claude.ts の基本形
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function chat(messages: Anthropic.MessageParam[]) {
  return anthropic.messages.create({
    model: "claude-opus-4-5",    // モデルは arch が決める。ここを直接書かない
    max_tokens: 1024,
    messages,
  });
}
```

- モデル選定は arch が担当。build は `lib/ai/` の関数を呼ぶだけにする
- API Key はサーバーサイドのみで使う（`NEXT_PUBLIC_` を付けない）
- ストリーミングは Vercel AI SDK（`ai` パッケージ）を使って実装する

### OpenAI

- 用途: 将来的な音声入力（ウサギキャラ）等、Claude が苦手な領域で補完利用
- Phase 1 では基本不使用。arch の判断で追加する

### レート制限・エラー処理

- AI API のエラーは `try/catch` で必ずキャッチし、顧客には「しばらくしてからもう一度お試しください」を表示する
- コスト管理のため、1リクエストあたりのトークン上限を Route Handler 側で設ける

---

## 7. 環境変数の管理方針

### ファイル運用

| ファイル | 用途 | Git 管理 |
|---|---|---|
| `.env.local` | ローカル開発用（実際の値） | 管理しない（`.gitignore` 済） |
| `.env.example` | 必要な変数名の一覧（値はダミー） | 管理する |
| Vercel 環境変数 | 本番 / Preview の実際の値 | Vercel ダッシュボードで管理 |

- `.env.local` に実際の API Key を書く。絶対に Git にコミットしない
- Supabase の Service Role Key は **サーバーサイドのみ**（`NEXT_PUBLIC_` を付けない）

### 変数命名規則

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # サーバーサイドのみ

# AI API
ANTHROPIC_API_KEY=                 # サーバーサイドのみ
OPENAI_API_KEY=                    # サーバーサイドのみ（使う場合）

# アプリ設定
NEXT_PUBLIC_APP_URL=               # 公開 URL（フロントで使う場合）
```

### シークレット漏洩チェック

- コミット前に `.env.local` が差分に含まれていないか確認する
- CI（GitHub Actions）に `git-secrets` や `truffleHog` を将来追加する（Phase 2 以降）

---

## 8. GitHub ブランチ戦略

### ブランチ構成

```
main              # 常にデプロイ可能な状態。直 push 禁止
├── dev           # 開発統合ブランチ（Phase 2 以降、チーム規模が増えたら使う）
└── feature/*     # 機能開発ブランチ（個人開発の間は main から切る）
    fix/*         # バグ修正ブランチ
    docs/*        # ドキュメントのみの変更
```

### 運用ルール

- `main` への直 push は禁止（CLAUDE.md 記載済み）
- 全ての変更は Pull Request 経由でマージする
- PR マージ前に `review` エージェントによるレビューを行う（Phase 1 では簡略可）
- マージ方法は Squash Merge を基本とする（コミット履歴をきれいに保つ）

### ブランチ命名規則

```
feature/phase1-interview-ui
feature/phase1-supabase-auth
fix/interview-message-save
docs/tech-stack
```

### コミットメッセージ

```
<type>: <概要>（日本語可）

type:
  feat     新機能
  fix      バグ修正
  docs     ドキュメントのみ
  style    コードの意味に影響しない変更（フォーマット等）
  refactor リファクタリング
  test     テストの追加・修正
  chore    ビルドプロセス、補助ツールの変更

例:
  feat: Supabase Auth のログイン画面を実装
  fix: インタビューメッセージ保存時の null エラーを修正
  docs: tech-stack.md を新規作成
```

---

## 9. テスト方針

- Phase 1（内部ツール）では E2E テストより「動作確認できる状態」を優先する
- ロジック系ユーティリティ（`lib/utils/`）は Vitest で単体テストを書く
- AI 出力を含む処理のテストは、モックを使ってコスト発生を避ける
- CLAUDE.md の「テストなしの機能追加禁止」に従い、最低限のハッピーパステストは書く

---

## 10. パフォーマンス・セキュリティの基本方針

### パフォーマンス

- Server Components を積極的に使い、クライアント JS を減らす
- `"use client"` は本当に必要な箇所（インタラクション・状態管理）のみに限定する
- 画像は全て `next/image` の `<Image>` コンポーネントを使う

### セキュリティ

- Supabase の RLS を全テーブルで有効にする（ポリシーなしの公開テーブルを作らない）
- API Route は認証チェックを必ず行う（`supabase.auth.getUser()` でサーバー側検証）
- `SUPABASE_SERVICE_ROLE_KEY` は Route Handler・Server Actions のみで使う
- XSS 対策: ユーザー入力を `dangerouslySetInnerHTML` に渡さない
