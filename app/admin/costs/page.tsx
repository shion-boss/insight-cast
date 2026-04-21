export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { CostValue } from './CostValue'

// 固定費（月額・USD換算）
const FIXED_COSTS = [
  { label: 'Claude Max', plan: '$100/月プラン（社内AI用）', usd: 100 },
  { label: 'Vercel', plan: 'Hobby（無料）', usd: 0 },
  { label: 'Supabase', plan: 'Free（無料）', usd: 0 },
  { label: 'Resend', plan: 'Free（無料）', usd: 0 },
  { label: 'Firecrawl', plan: '従量課金', usd: null },
]

const EXCHANGE_RATE = 150 // 1 USD = 150 JPY（概算）

async function getCostData() {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const [currentMonth, lastMonth, byRoute, daily] = await Promise.all([
    supabase
      .from('api_usage_logs')
      .select('cost_usd, input_tokens, output_tokens, route')
      .gte('created_at', monthStart),
    supabase
      .from('api_usage_logs')
      .select('cost_usd, input_tokens, output_tokens')
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd),
    supabase
      .from('api_usage_logs')
      .select('route, cost_usd, input_tokens, output_tokens')
      .gte('created_at', monthStart),
    supabase
      .from('api_usage_logs')
      .select('created_at, cost_usd')
      .gte('created_at', monthStart)
      .order('created_at', { ascending: true }),
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
  const byRouteList = Object.entries(routeMap)
    .map(([route, v]) => ({ route, ...v }))
    .sort((a, b) => b.cost - a.cost)

  // 日別集計（今月）
  const dayMap: Record<string, number> = {}
  for (const row of (daily.data ?? [])) {
    const day = row.created_at.slice(0, 10)
    dayMap[day] = (dayMap[day] ?? 0) + (row.cost_usd ?? 0)
  }
  const dailyList = Object.entries(dayMap).map(([day, cost]) => ({ day, cost }))

  return { currentCost, lastCost, currentTokens, byRouteList, dailyList }
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
}

export default async function AdminCostsPage() {
  const { currentCost, lastCost, currentTokens, byRouteList, dailyList } = await getCostData()

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
          {[
            { label: '今月累計', cost: currentCost },
            { label: '月末予測', cost: projectedCost },
            { label: '先月合計', cost: lastCost },
          ].map((card) => (
            <div key={card.label} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">{card.label}</p>
              <CostValue usd={card.cost} className="mt-2 block font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]" />
              <p className="mt-0.5 text-xs text-[var(--text3)]">ホバーで円換算</p>
            </div>
          ))}
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text3)] uppercase">今月トークン数</p>
            <p className="mt-2 font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--text)]">{currentTokens.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-[var(--text3)]">tokens</p>
          </div>
        </div>
      </section>

      {/* 月額合計 */}
      <section className="rounded-[var(--r-lg)] border-2 border-[var(--accent)]/30 bg-[var(--accent-l)] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">今月の総コスト（概算）</p>
        <div className="mt-3 flex items-end gap-4">
          <CostValue usd={currentCost + 100} className="font-[family-name:var(--font-noto-serif-jp)] text-3xl font-bold text-[var(--text)]" />
          <p className="mb-1 text-xs text-[var(--text3)]">固定費 $100 + API <CostValue usd={currentCost} /></p>
        </div>
      </section>

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
            <CostValue usd={100} className="text-sm font-bold text-[var(--text)]" />
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--text3)]">Firecrawlは利用量に応じて変動。Supabase/Vercelは無料枠を超えると課金が発生します。</p>
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
