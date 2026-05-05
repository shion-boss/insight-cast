/**
 * blog_posts のハッシュスラッグを意味のある英語スラッグにリネームする一回限りのスクリプト。
 * 実行:
 *   - dry-run: npx dotenv -e .env.local -- npx tsx scripts/rename-blog-slugs.ts
 *   - apply:   npx dotenv -e .env.local -- npx tsx scripts/rename-blog-slugs.ts --apply
 */
import { createClient } from '@supabase/supabase-js'

const RENAMES: Array<{ from: string; to: string }> = [
  { from: '2026-04-27-30337bfe', to: 'hidden-strengths-emerge-from-questions' },
  { from: '2026-04-26-ef260ef8', to: 'why-ai-articles-fail-in-search' },
  { from: '2026-04-25-23hlx',    to: 'dashboard-should-be-simple' },
  { from: '2026-04-25-mvzc3',    to: 'developer-experience-ai-interview' },
  { from: '2026-04-25-a93ju',    to: 'interview-format-removes-writers-block' },
  { from: '2026-04-23-m0r3k',    to: 'homepage-as-active-signboard' },
  { from: '2026-04-21-kvga0',    to: 'origin-story-of-insight-cast' },
  { from: '2026-04-21-01xr3',    to: 'why-blog-updates-stop' },
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const apply = process.argv.includes('--apply')

async function main() {
  console.log(apply ? '⚙️  APPLY MODE' : '🔍 DRY RUN MODE')
  console.log()

  let okCount = 0
  let issues = 0

  for (const { from, to } of RENAMES) {
    const { data: src, error: srcErr } = await supabase
      .from('blog_posts')
      .select('id, slug, title, published')
      .eq('slug', from)
      .maybeSingle()

    if (srcErr) {
      console.log(`❌ ${from} → ${to}: query error: ${srcErr.message}`)
      issues++
      continue
    }
    if (!src) {
      console.log(`⚠️  ${from} → ${to}: source slug not found in DB (skip)`)
      issues++
      continue
    }

    const { data: conflict } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', to)
      .maybeSingle()
    if (conflict) {
      console.log(`❌ ${from} → ${to}: TARGET SLUG ALREADY EXISTS (skip)`)
      issues++
      continue
    }

    const status = src.published ? 'published' : 'draft'
    console.log(`✅ ${from} → ${to}  [${status}]  "${src.title.slice(0, 40)}..."`)

    if (apply) {
      const { error: updErr } = await supabase
        .from('blog_posts')
        .update({ slug: to })
        .eq('id', src.id)
      if (updErr) {
        console.log(`   ↳ ❌ update failed: ${updErr.message}`)
        issues++
        continue
      }
      console.log(`   ↳ updated`)
    }
    okCount++
  }

  console.log()
  console.log(`Summary: ${okCount} ok, ${issues} issues`)
  if (!apply && okCount > 0) {
    console.log('Re-run with --apply to actually update.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
