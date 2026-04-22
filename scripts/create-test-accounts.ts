/**
 * テスト用アカウント作成スクリプト
 * 実行: npx dotenv -e .env.local -- npx tsx scripts/create-test-accounts.ts
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const TEST_ACCOUNTS = [
  { email: 'test-free@insightcast.dev',     password: 'TestFree1234!',     plan: 'free',     name: 'テスト（無料）' },
  { email: 'test-personal@insightcast.dev', password: 'TestPersonal1234!', plan: 'personal', name: 'テスト（個人向け）' },
  { email: 'test-business@insightcast.dev', password: 'TestBusiness1234!', plan: 'business', name: 'テスト（法人向け）' },
]

async function main() {
  for (const account of TEST_ACCOUNTS) {
    // ユーザー作成
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    })

    if (createError && createError.message !== 'A user with this email address has already been registered') {
      console.error(`❌ ${account.email}: ユーザー作成失敗 — ${createError.message}`)
      continue
    }

    // 既存ユーザーの場合はIDを取得
    let userId = created?.user?.id
    if (!userId) {
      const { data: existing } = await supabase.auth.admin.listUsers()
      userId = existing?.users.find((u) => u.email === account.email)?.id
    }

    if (!userId) {
      console.error(`❌ ${account.email}: ユーザーID取得失敗`)
      continue
    }

    // プロフィール名を設定
    await supabase
      .from('profiles')
      .upsert({ id: userId, name: account.name }, { onConflict: 'id' })

    // プランを設定（subscriptions upsert）
    const { error: planError } = await supabase
      .from('subscriptions')
      .upsert({ user_id: userId, plan: account.plan, status: 'active' }, { onConflict: 'user_id' })

    if (planError) {
      console.error(`❌ ${account.email}: プラン設定失敗 — ${planError.message}`)
      continue
    }

    console.log(`✅ ${account.email} (${account.plan}) — パスワード: ${account.password}`)
  }
}

main()
