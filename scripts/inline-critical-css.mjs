// `next build` 後に prerender 済 HTML へ critical CSS を inline する post-build スクリプト。
//
// Next.js 15 の `experimental.optimizeCss` は App Router では機能しない
// （Pages Router のみ）。代わりに critters を直接 `.next/server/app/*.html`
// に当てて、external CSS の render-blocking を解消する。
//
// 動作:
//   1. .next/server/app/ 配下を再帰的に走査して .html ファイルを集める
//   2. 各 HTML に対して critters を実行
//      - DOM で実際に使われている CSS セレクタだけ抽出して <style> として
//        <head> に inline
//      - 元の <link rel="stylesheet"> を <link rel="preload" as="style"
//        onload="this.rel='stylesheet'"> に書き換え（async 化）
//   3. 結果を同じ場所に書き戻す
//
// 対象: Static prerender ルート（/, /about, /blog, /cast, /faq,
//   /philosophy, /privacy, /terms, /tokushoho, /auth/*, /blog/[slug] 等）
// 対象外: dynamic ルート（/dashboard, /pricing, /cast-talk 等）— これらは
//   Vercel の lambda で SSR されるが、本スクリプトは build 出力にしか触れない

import Critters from 'critters'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const APP_DIR = path.join(process.cwd(), '.next', 'server', 'app')
const NEXT_DIR = path.join(process.cwd(), '.next')

async function* walkHtmlFiles(dir) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walkHtmlFiles(full)
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield full
    }
  }
}

async function main() {
  // Next.js が出す `<link href="/_next/static/css/abc.css">` を critters が
  // FS から読めるように path を解決する。critters は URL から publicPath を
  // 除去し path と join する。
  // publicPath '/_next/' + path '.next/' で URL `/_next/static/css/abc.css`
  // → ファイル `.next/static/css/abc.css` に正しく解決される。
  //
  // preload mode の選定:
  // - 既定モード（省略）: link を body に移動 + head に rel="preload" 挿入。
  //   ただし body 側は `rel="stylesheet"` のままなので spec 上 render-blocking
  //   になり、Lighthouse でも引き続き警告される。NG。
  // - 'swap': onload 追加するだけで rel が stylesheet のまま。実質 no-op。NG。
  // - 'media': link 自体に `media="print" onload="this.media='all'"` を
  //   付与し、screen には適用されない link として扱われるので render-blocking
  //   から外れる。`<noscript>` フォールバック付き。これを採用。
  const critters = new Critters({
    path: NEXT_DIR,
    publicPath: '/_next/',
    // 本番ファイル名の hash 化に対応するため、CSS は filesystem から読みに行く
    pruneSource: true,
    // 既存 <link> を `media="print" onload="this.media='all'"` に書き換え。
    // CSS はバックグラウンドで取得され、ロード完了時に screen に適用される。
    // critters が <noscript><link rel="stylesheet"></noscript> も追加する。
    preload: 'media',
    // フォント関連 @font-face はインライン化しない（別途 preload で扱う）
    inlineFonts: false,
    fonts: false,
    // critters は Tailwind の `group-open:` 等のパスを苦手として頻繁に warn を
    // 出すが、それらのセレクタは critical でなく link 経由で適用されるので
    // 表示には影響しない。コンソールノイズを避けるため silent に倒す。
    logLevel: 'silent',
  })

  const processed = []
  let totalIn = 0
  let totalOut = 0

  for await (const filePath of walkHtmlFiles(APP_DIR)) {
    const original = await fs.readFile(filePath, 'utf8')
    if (!original.includes('<link rel="stylesheet"')) {
      continue
    }
    let modified
    try {
      modified = await critters.process(original)
    } catch (err) {
      console.warn(`[inline-critical-css] skip ${path.relative(process.cwd(), filePath)}: ${err.message}`)
      continue
    }
    if (modified && modified !== original) {
      await fs.writeFile(filePath, modified, 'utf8')
      processed.push({
        path: path.relative(process.cwd(), filePath),
        before: original.length,
        after: modified.length,
      })
      totalIn += original.length
      totalOut += modified.length
    }
  }

  if (processed.length === 0) {
    console.log('[inline-critical-css] no HTML files needed processing')
    return
  }

  console.log(`[inline-critical-css] processed ${processed.length} HTML files`)
  for (const f of processed) {
    const delta = f.after - f.before
    const pct = ((delta / f.before) * 100).toFixed(1)
    const sign = delta > 0 ? '+' : ''
    console.log(`  ${f.path}: ${f.before} → ${f.after} (${sign}${delta} bytes, ${sign}${pct}%)`)
  }
  const totalDelta = totalOut - totalIn
  const totalPct = ((totalDelta / totalIn) * 100).toFixed(1)
  const sign = totalDelta > 0 ? '+' : ''
  console.log(`  TOTAL: ${totalIn} → ${totalOut} (${sign}${totalDelta} bytes, ${sign}${totalPct}%)`)
}

main().catch((err) => {
  console.error('[inline-critical-css] failed:', err)
  process.exit(1)
})
