export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { CostValue, CostCard, CostTotal } from './CostValue'

// 固定費（月額・USD換算）
const FIXED_COSTS = [
  { label: 'Claude Max', plan: '$100/月プラン（社内AI用）', usd: 100 },
  { label: 'Vercel', plan: 'Hobby（無料）', usd: 0 },
  { label: 'Supabase', plan: 'Free（無料）', usd: 0 },
  { label: 'Resend', plan: 'Free（無料）', usd: 0 },
  { label: 'Firecrawl', plan: '従量課金', usd: null },
  { label: 'Cast Talk 自動生成', plan: '毎日1記事（Haiku + Sonnet）・月約$0.78', usd: 0.78 },
]

const EXCHANGE_RATE = 150 // 1 USD = 150 JPY（概算）

const FIXED_COST_TOTAL = FIXED_COSTS.reduce((acc, r) => acc + (r.usd ?? 0), 0)

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

// ホームページ運用に使う機能（管理者の自社運用）
const SITE_OPS_ROUTES = new Set(['interview/chat', 'interview/summarize', 'article', 'analyze', 'account/analyze'])

async function getCostData() {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  // 管理者のuser_idを取得
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', ADMIN_EMAILS.length > 0 ? ADMIN_EMAILS : ['__none__'])
  const adminUserIds = (adminProfiles ?? []).map((p) => p.id as string)

  const [currentMonth, lastMonth, byRoute, daily, byUser, adminLogs] = await Promise.all([
    supabase.from('api_usage_logs').select('cost_usd, input_tokens, output_tokens').gte('created_at', monthStart),
    supabase.from('api_usage_logs').select('cost_usd, input_tokens, output_tokens').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    supabase.from('api_usage_logs').select('route, cost_usd').gte('created_at', monthStart),
    supabase.from('api_usage_logs').select('created_at, cost_usd').gte('created_at', monthStart).order('created_at', { ascending: true }),
    // ユーザー別 × プラン別
    supabase.from('api_usage_logs').select('user_id, cost_usd').gte('created_at', monthStart).not('user_id', 'is', null),
    // 管理者自身のブログ運用コスト
    adminUserIds.length > 0
      ? supabase.from('api_usage_logs').select('route, cost_usd').gte('created_at', monthStart).in('user_id', adminUserIds)
      : Promise.resolve({ data: [] }),
  ])

  const sumCost = (rows: Array<{ cost_usd: number }> | null) =>
    (rows ?? []).reduce((acc, r) => acc + (r.cost_usd ?? 0), 0)
  const sumTokens = (rows: Array<{ input_tokens: number; output_tokens: number }> | null) =>
    (rows ?? []).reduce((acc, r) => acc + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0)

  const currentCost = sumCost(currentMonth.data)
  const lastCost = sumCost(lastMonth.data)
  const currentTokens = sumTokens(currentMonth.data)

  // ルート別集計
  const routeMap: Record<string, { cost: number; calls: number }> = {}
  for (const row of (byRoute.data ?? [])) {
    if (!routeMap[row.route]) routeMap[row.route] = { cost: 0, calls: 0 }
    routeMap[row.route].cost += row.cost_usd ?? 0
    routeMap[row.route].calls += 1
  }
  const byRouteList = Object.entries(routeMap).map(([route, v]) => ({ route, ...v })).sort((a, b) => b.cost - a.cost)

  // 日別集計
  const dayMap: Record<string, number> = {}
  for (const row of (daily.data ?? [])) {
    const day = row.created_at.slice(0, 10)
    dayMap[day] = (dayMap[day] ?? 0) + (row.cost_usd ?? 0)
  }
  const dailyList = Object.entries(dayMap).map(([day, cost]) => ({ day, cost }))

  // ユーザー別コスト集計（user_idごと）
  const userCostMap: Record<string, number> = {}
  for (const row of (byUser.data ?? [])) {
    const uid = row.user_id as string
    userCostMap[uid] = (userCostMap[uid] ?? 0) + (row.cost_usd ?? 0)
  }

  // プラン情報を取得
  const userIds = Object.keys(userCostMap)
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, email, plan').in('id', userIds)
    : { data: [] }

  const byPlan: Record<string, { cost: number; userCount: number }> = {}
  for (const profile of (profiles ?? [])) {
    const plan = (profile.plan as string) ?? 'individual'
    const cost = userCostMap[profile.id as string] ?? 0
    if (!byPlan[plan]) byPlan[plan] = { cost: 0, userCount: 0 }
    byPlan[plan].cost += cost
    byPlan[plan].userCount += 1
  }
  const byPlanList = Object.entries(byPlan).map(([plan, v]) => ({ plan, ...v })).sort((a, b) => b.cost - a.cost)

  // 管理者のブログ運用コスト
  const blogCost = (adminLogs.data ?? [])
    .filter((r) => SITE_OPS_ROUTES.has(r.route))
    .reduce((acc, r) => acc + (r.cost_usd ?? 0), 0)
  const blogCallsByRoute: Record<string, number> = {}
  for (const row of (adminLogs.data ?? [])) {
    if (SITE_OPS_ROUTES.has(row.route)) {
      blogCallsByRoute[row.route] = (blogCallsByRoute[row.route] ?? 0) + 1
    }
  }

  return { currentCost, lastCost, currentTokens, byRouteList, dailyList, byPlanList, blogCost, blogCallsByRoute }
}

function usd(v: number) {
  return `$${v.toFixed(4)}`
}

function jpy(usdAmount: number) {
  return `¥${Math.round(usdAmount * EXCHANGE_RATE).toLocaleString()}`
}

const ROUTE_LABELS: Record<string, string> = {
  'interview/chat': 'インタビュー（会話）',
  'interview/summarize': 'インタビュー（まとめ）',
  'article': '記事生成',
  'analyze': 'HP分析',
  'account/analyze': 'アカウント分析',
  'cast-talk/generate': 'Cast Talk 生成',
}

export default async function AdminCostsPage() {
  const { currentCost, lastCost, currentTokens, byRouteList, dailyList, byPlanList, blogCost, blogCallsByRoute } = await getCostData()

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const projectedCost = daysPassed > 0 ? (currentCost / daysPassed) * daysInMonth : 0

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]">コスト管理</h1>
        <p className="mt-1 text-sm text-[var(--text2)]">
          {now.getFullYear()}年{now.getMonth() + 1}月 — AI API利用料・固定費の確認
        </p>
      </div>

      {/* 今月サマリー */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]">今月のAI API費用</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <CostCard label="今月累計" usd={currentCost} />
          <CostCard label="月末予測" usd={projectedCost} />
          <CostCard label="先月合計" usd={lastCost} />
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">今月トークン数</p>
            <p className="mt-2 font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]">{currentTokens.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-[var(--text3)]">tokens</p>
          </div>
        </div>
      </section>

      {/* 月額合計 */}
      <CostTotal usd={currentCost + FIXED_COST_TOTAL} fixedUsd={FIXED_COST_TOTAL} apiUsd={currentCost} />

      {/* ルート別 */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]">機能別内訳（今月）</h2>
        {byRouteList.length === 0 ? (
          <p className="text-sm text-[var(--text3)]">まだデータがありません</p>
        ) : (
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
            {byRouteList.map((row, i) => (
              <div
                key={row.route}
                className={`flex items-center gap-4 px-5 py-3.5 ${i < byRouteList.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)]">{ROUTE_LABELS[row.route] ?? row.route}</p>
                  <p className="text-xs text-[var(--text3)]">{row.calls}回</p>
                </div>
                <CostValue usd={row.cost} className="text-sm font-semibold text-[var(--text)]" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 固定費 */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]">固定費（月額）</h2>
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
          {FIXED_COSTS.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center gap-4 px-5 py-3.5 ${i < FIXED_COSTS.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text)]">{row.label}</p>
                <p className="text-xs text-[var(--text3)]">{row.plan}</p>
              </div>
              {row.usd === null
                ? <p className="text-sm font-semibold text-[var(--text)]">要確認</p>
                : row.usd === 0
                  ? <p className="text-sm font-semibold text-[var(--ok)]">無料</p>
                  : <CostValue usd={row.usd} className="text-sm font-semibold text-[var(--text)]" />
              }
            </div>
          ))}
          <div className="flex items-center gap-4 border-t border-[var(--border)] bg-[var(--bg2)] px-5 py-3.5">
            <p className="flex-1 text-sm font-bold text-[var(--text)]">固定費合計（概算）</p>
            <CostValue usd={FIXED_COST_TOTAL} className="text-sm font-bold text-[var(--text)]" />
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--text3)]">Firecrawlは利用量に応じて変動。Supabase/Vercelは無料枠を超えると課金が発生します。</p>
      </section>

      {/* プラン別コスト */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]">プラン別コスト（今月・ユーザーAPI使用分）</h2>
        {byPlanList.length === 0 ? (
          <p className="text-sm text-[var(--text3)]">まだデータがありません</p>
        ) : (
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
            {byPlanList.map((row, i) => (
              <div key={row.plan} className={`flex items-center gap-4 px-5 py-3.5 ${i < byPlanList.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text)]">
                    {row.plan === 'individual' ? '個人プラン' : row.plan === 'business' ? 'ビジネスプラン' : row.plan}
                  </p>
                  <p className="text-xs text-[var(--text3)]">{row.userCount}ユーザー</p>
                </div>
                <div className="text-right">
                  <CostValue usd={row.cost} className="text-sm font-semibold text-[var(--text)]" />
                  {row.userCount > 0 && (
                    <p className="text-xs text-[var(--text3)]">
                      平均 <CostValue usd={row.cost / row.userCount} className="text-xs" /> /人
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HP運用コスト（管理者） */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]">ホームページ運用費（今月・管理者自身）</h2>
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-4 border-b border-[var(--border)] bg-[var(--bg2)] px-5 py-3.5">
            <p className="flex-1 text-sm font-bold text-[var(--text)]">合計</p>
            <CostValue usd={blogCost} className="text-sm font-bold text-[var(--text)]" />
          </div>
          {Object.entries(blogCallsByRoute).map(([route, calls]) => (
            <div key={route} className="flex items-center gap-4 border-b border-[var(--border)] px-5 py-3 last:border-0">
              <p className="flex-1 text-sm text-[var(--text2)]">{ROUTE_LABELS[route] ?? route}</p>
              <p className="text-xs text-[var(--text3)]">{calls}回</p>
            </div>
          ))}
          {Object.keys(blogCallsByRoute).length === 0 && (
            <p className="px-5 py-4 text-sm text-[var(--text3)]">まだデータがありません</p>
          )}
        </div>
        <p className="mt-2 text-xs text-[var(--text3)]">HP分析・インタビュー・記事生成の合計。自社HPを Insight Cast で運用するためにかかったAI費用です。</p>
      </section>

      {/* 日別推移 */}
      {dailyList.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]">日別推移（今月）</h2>
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
            <div className="space-y-1.5">
              {dailyList.map((d) => {
                const maxCost = Math.max(...dailyList.map((x) => x.cost), 0.001)
                const pct = Math.round((d.cost / maxCost) * 100)
                return (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-[var(--text3)]">{d.day}</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--bg2)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                    </div>
                    <CostValue usd={d.cost} className="w-16 text-right text-xs font-medium text-[var(--text)]" />
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <div className="text-xs text-[var(--text3)]">
        <p>* AI API費用は claude-sonnet-4-6 の公開レート（$3/M input, $15/M output）で計算しています。</p>
        <p>* 為替レートは概算 1 USD = {EXCHANGE_RATE} JPY です。</p>
        <p>* ログが取れるのはこの機能実装以降の利用分からです。</p>
      </div>

      <div>
        <Link href="/admin" className="text-sm text-[var(--text3)] hover:text-[var(--text)] transition-colors">
          ← 管理ダッシュボードに戻る
        </Link>
      </div>
    </div>
  )
}
