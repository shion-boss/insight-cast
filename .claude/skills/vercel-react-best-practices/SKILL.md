---
name: vercel-react-best-practices
description: Next.js 15 App Router / React / Vercel のベストプラクティスを適用する。コンポーネント設計・データフェッチ・キャッシュ・パフォーマンス・デプロイ設定・環境変数・Edge Runtime・Server Actions など、Next.js/React/Vercel に関わる実装判断で積極的に使うこと。「どう実装すべきか」「パフォーマンスを改善したい」「キャッシュの設定を正しくしたい」「サーバー/クライアントの境界が分からない」時に使う。
---

# Vercel / React / Next.js 15 Best Practices

## スタック前提

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript strict**
- **Tailwind CSS**
- **Vercel** (デプロイ先)

---

## Server Component vs Client Component

**原則: デフォルトはServer Component。`'use client'` は最小限に。**

```
Server Component が適切な場合:
- データフェッチ（DB, API）
- 大きなライブラリのimport（バンドルに含めたくない）
- バックエンドリソースへの直接アクセス

Client Component が必要な場合:
- useState / useEffect / useReducer
- イベントハンドラ（onClick, onChange等）
- ブラウザAPIの使用
- リアルタイム更新
```

コンポーネントツリーの「葉」に近い側で `'use client'` を使う。親をクライアントにすると子全体がクライアントになる。

```tsx
// NG: 親ごとクライアントにする
'use client'
export default function Page() { ... } // データフェッチも含んでしまう

// OK: インタラクションが必要な部分だけクライアントに切り出す
// page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData()
  return <InteractiveWidget data={data} /> // このコンポーネントだけ 'use client'
}
```

---

## データフェッチ

### Server Component でのフェッチ（推奨）

```tsx
// app/projects/page.tsx
export default async function ProjectsPage() {
  const supabase = createServerClient()
  const { data } = await supabase.from('projects').select('*')
  return <ProjectList projects={data} />
}
```

### Server Actions（フォーム・ミューテーション）

```tsx
// lib/actions/projects.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  // validation
  if (!name) throw new Error('名前が必要です')
  
  const supabase = createServerClient()
  await supabase.from('projects').insert({ name })
  revalidatePath('/dashboard')
}
```

### Route Handlers（外部からのAPI呼び出し）

```tsx
// app/api/projects/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // ...
  return Response.json({ data })
}
```

---

## キャッシュ戦略

Next.js 15 ではデフォルトキャッシュが**無効**になった（fetch はデフォルト `no-store`）。

```tsx
// 動的データ（毎回フェッチ）
const res = await fetch('/api/data') // デフォルトで no-store

// 静的データ（ビルド時にキャッシュ）
const res = await fetch('/api/data', { cache: 'force-cache' })

// 一定時間でrevalidate
const res = await fetch('/api/data', { next: { revalidate: 60 } })

// タグベースのrevalidate
const res = await fetch('/api/data', { next: { tags: ['projects'] } })
// 別の場所でrevalidate
revalidateTag('projects')
```

Supabase クライアントは `fetch` を使わないので、個別のキャッシュ制御に注意する。

---

## ルーティング & レイアウト

```
app/
├── layout.tsx          # ルートレイアウト（<html><body>）
├── page.tsx            # /
├── (public)/           # グループ（URLに影響しない）
│   ├── about/page.tsx
│   └── pricing/page.tsx
├── (app)/              # 認証必須ページグループ
│   ├── layout.tsx      # 認証チェック
│   └── dashboard/page.tsx
└── api/
    └── projects/
        └── route.ts    # POST /api/projects
```

- `(group)` でレイアウトを分けるとルートレイアウトが汚れない
- `loading.tsx` で自動的にSuspenseをラップ
- `error.tsx` でエラーバウンダリを設置

---

## パフォーマンス

### 画像

```tsx
import Image from 'next/image'

// 必ずwidth/heightかfillを指定
<Image src="/hero.png" alt="..." width={800} height={600} priority />
// priority: LCPに関わる画像（above the fold）に付ける
```

### フォント

```tsx
// app/layout.tsx
import { Geist } from 'next/font/google'
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
// フォントをCSSクラスで使う → 外部リクエスト不要
```

### 動的import

```tsx
import dynamic from 'next/dynamic'
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false, // ブラウザAPIを使うコンポーネントはssrをfalseに
})
```

---

## 環境変数

```
NEXT_PUBLIC_ プレフィックス: クライアントサイドで公開される
それ以外:                  サーバーサイドのみ（絶対に漏らさない）
```

```tsx
// サーバーサイドのみ
const apiKey = process.env.OPENAI_API_KEY

// クライアントでも使える
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
```

`.env.local` は `.gitignore` に入れる。Vercelのダッシュボードで環境ごとに設定する。

---

## TypeScript

```tsx
// Props は interface で定義
interface ProjectCardProps {
  project: Project
  onDelete?: (id: string) => void
}

// Server Actions の戻り値型
type ActionResult = { success: true; data: Project } | { success: false; error: string }

// fetch レスポンスの型
const data = await res.json() as ProjectResponse
```

- `any` は使わない。どうしても必要なら `unknown` から絞り込む
- `strict: true` を維持する

---

## Vercel デプロイ

### vercel.json（必要な場合）

```json
{
  "functions": {
    "app/api/interview/**": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store" }]
    }
  ]
}
```

### Edge vs Node.js Runtime

```tsx
// Edge: 高速・軽量・グローバル分散。ただしNode.js APIが使えない
export const runtime = 'edge'

// Node.js: デフォルト。全APIが使える。Cold startが少し遅い
// （何も書かなければNode.js）
```

Supabase SDK は Node.js Runtime が安全（Edge では一部制限あり）。

---

## エラーハンドリング

```tsx
// Server Action
export async function saveData(data: FormData) {
  'use server'
  try {
    await db.insert(...)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    // ユーザーに見せるエラーとログは分ける
    console.error('saveData failed:', e)
    return { success: false, error: '保存できませんでした。もう一度お試しください。' }
  }
}

// Client側
const result = await saveData(formData)
if (!result.success) toast.error(result.error)
```

---

## チェックリスト

- [ ] `'use client'` はインタラクション必要な最小単位のコンポーネントだけか
- [ ] データフェッチはServer Componentで行っているか
- [ ] 秘密の環境変数に `NEXT_PUBLIC_` が付いていないか
- [ ] 画像に `next/image` を使っているか（`<img>` を使っていないか）
- [ ] LCP画像に `priority` を付けているか
- [ ] Server Actionで `revalidatePath` / `revalidateTag` を呼んでいるか
- [ ] エラー時にユーザーが次に何をすべきか伝えているか
