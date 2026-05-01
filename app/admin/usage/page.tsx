export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { CostValue } from '@/app/admin/costs/CostValue'
import { Breadcrumb } from '@/components/ui'

const PLAN_REVENUE_JPY: Record<string, number> = {
  free:       0,
  lightning:  1_980,
  personal:   4_980,
  business:   14_800,
}

const PLAN_LABELS: Record<string, string> = {
  free:       '無料',
  lightning:  'ライト ¥1,980',
  personal:   '個人向け ¥4,980',
  business:   '法人向け ¥14,800',
}

const EXCHANGE_RATE = 150 // 1 USD = 150 JPY（概算）

const ROUTE_LABELS: Record<string, string> = {
  '/api/projects/[id]/interview/chat':      'インタビュー（会話）',
  '/api/projects/[id]/interview/summarize': 'インタビュー（まとめ）',
  '/api/projects/[id]/article':             '記事生成',
  '/api/projects/[id]/analyze':             'HP分析',
  '/api/account/analyze':                   'アカウント分析',
  '/api/profile/competitor-suggestions':    '競合提案',
  '/api/cast-talk/generate':               'Cast Talk 生成',
  '/api/interview-links/[token]/chat':      '外部インタビュー（会話）',
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

type MonthlyByPlanRow = {
  plan: string
  month: string
  user_count: number
  avg_cost_usd: number
  max_cost_usd: number
  avg_calls: number
  max_calls: number
  total_cost_usd: number
}

async function getUsageData() {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

  // 管理者の user_id を取得
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', ADMIN_EMAILS.length > 0 ? ADMIN_EMAILS : ['__none__'])
  const adminUserIds = (adminProfiles ?? []).map((p) => p.id as string)

  const [monthlyByPlan, userRouteLogs] = await Promise.all([
    // Section 1 & 2: usage_monthly_by_plan ビューから過去6ヶ月
    supabase
      .from('usage_monthly_by_plan')
      .select('plan, month, user_count, avg_cost_usd, max_cost_usd, avg_calls, max_calls, total_cost_usd')
      .gte('month', sixMonthsAgo)
      .order('month', { ascending: false }),

    // Section 3: 今月のルート別内訳（ユーザーのみ）
    adminUserIds.length > 0
      ? supabase
          .from('api_usage_logs')
          .select('route, cost_usd')
          .gte('created_at', monthStart)
          .not('user_id', 'is', null)
          .not('user_id', 'in', `(${adminUserIds.join(',')})`)
      : supabase
          .from('api_usage_logs')
          .select('route, cost_usd')
          .gte('created_at', monthStart)
          .not('user_id', 'is', null),
  ])

  // Section 1: 今月のプラン別データを抽出（user_count > 0 のみ）
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthRows: MonthlyByPlanRow[] = ((monthlyByPlan.data ?? []) as MonthlyByPlanRow[]).filter(
    (r) => r.month.slice(0, 7) === thisMonthKey && r.user_count > 0
  )

  // Section 2: 過去6ヶ月 × プラン
  // 月リスト（新しい順）
  const monthKeys: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // 月 × プランのマップ
  const monthPlanMap: Record<string, Record<string, number>> = {}
  for (const key of monthKeys) {
    monthPlanMap[key] = {}
  }
  for (const row of ((monthlyByPlan.data ?? []) as MonthlyByPlanRow[])) {
    const mKey = row.month.slice(0, 7)
    if (mKey in monthPlanMap) {
      monthPlanMap[mKey][row.plan] = row.avg_cost_usd
    }
  }

  // Section 3: ルート別集計（ROUTE_LABELS を全量0で初期化して実績を上書き）
  const routeMap: Record<string, { cost: number; calls: number }> = {}
  for (const route of Object.keys(ROUTE_LABELS)) {
    routeMap[route] = { cost: 0, calls: 0 }
  }
  for (const row of (userRouteLogs.data ?? [])) {
    const rawRoute = row.route as string
    // 正規化: api_usage_logs の route は短縮形の場合もあるため、フルパスと短縮形両方に対応
    const matchedKey = Object.keys(ROUTE_LABELS).find((k) => rawRoute === k || rawRoute.endsWith(k.replace(/^\/api\//, '/'))) ?? rawRoute
    if (!routeMap[matchedKey]) routeMap[matchedKey] = { cost: 0, calls: 0 }
    routeMap[matchedKey].cost += row.cost_usd ?? 0
    routeMap[matchedKey].calls += 1
  }
  const routeList = Object.entries(routeMap)
    .map(([route, v]) => ({ route, ...v }))
    .sort((a, b) => b.cost - a.cost)

  return { thisMonthRows, monthKeys, monthPlanMap, routeList }
}

// 粗利/人（USD）を計算。無料プランは null を返す
function calcGrossMarginUsd(plan: string, avgCostUsd: number): number | null {
  const revenueJpy = PLAN_REVENUE_JPY[plan]
  if (revenueJpy === undefined || revenueJpy === 0) return null
  return revenueJpy / EXCHANGE_RATE - avgCostUsd
}

export default async function AdminUsagePage() {
  const { thisMonthRows, monthKeys, monthPlanMap, routeList } = await getUsageData()

  const now = new Date()

  // Section 2: 最大値（バーの基準）
  const allAvgCosts = Object.values(monthPlanMap).flatMap((planMap) => Object.values(planMap))
  const maxAvgCost = Math.max(...allAvgCosts, 0.001)

  return (
    <div className="space-y-10">
      <Breadcrumb items={[{ label: '管理', href: '/admin' }, { label: '利用状況' }]} />
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">利用状況・ユニットエコノミクス</h1>
        <p className="mt-1 text-sm text-[var(--text2)]">
          {now.getFullYear()}年{now.getMonth() + 1}月 — プラン別粗利・CAC計算の基礎データ
        </p>
      </div>

      {/* Section 1: プラン別ユニットエコノミクス（今月） */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]">
          プラン別ユニットエコノミクス（今月）
        </h2>
        {thisMonthRows.length === 0 ? (
          <p className="text-sm text-[var(--text3)]">まだデータがありません</p>
        ) : (
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
            {/* ヘッダー行 */}
            <div className="grid grid-cols-6 gap-2 border-b border-[var(--border)] bg-[var(--bg2)] px-5 py-2.5">
              {['プラン', 'ユーザー数', '平均APIコスト/人', '最大APIコスト/人', '月額単価', '粗利/人'].map((h) => (
                <p key={h} className="text-xs font-bold text-[var(--text3)]">{h}</p>
              ))}
            </div>
            {thisMonthRows.map((row, i) => {
              const grossUsd = calcGrossMarginUsd(row.plan, row.avg_cost_usd)
              const isNegative = grossUsd !== null && grossUsd < 0
              return (
                <div
                  key={row.plan}
                  className={`group grid grid-cols-6 gap-2 items-center px-5 py-3.5 ${
                    i < thisMonthRows.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--text)]">
                    {PLAN_LABELS[row.plan] ?? row.plan}
                  </p>
                  <p className="text-sm text-[var(--text2)]">{row.user_count}人</p>
                  <CostValue usd={row.avg_cost_usd} className="text-sm font-semibold text-[var(--text)]" />
                  <CostValue usd={row.max_cost_usd} className="text-sm font-semibold text-[var(--text)]" />
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {PLAN_REVENUE_JPY[row.plan] !== undefined && PLAN_REVENUE_JPY[row.plan] > 0
                      ? `¥${PLAN_REVENUE_JPY[row.plan].toLocaleString()}`
                      : '¥0'}
                  </p>
                  {grossUsd === null ? (
                    <p className="text-sm text-[var(--text3)]">—</p>
                  ) : (
                    <CostValue
                      usd={grossUsd}
                      className={`text-sm font-semibold ${isNegative ? 'text-[var(--err)]' : 'text-[var(--ok)]'}`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-2 text-xs text-[var(--text3)]">
          「粗利/人」= 月額単価 ÷ 150（円→USD換算）− 平均APIコスト。広告費の上限 = 粗利 × 回収期間（ヶ月）。
        </p>
      </section>

      {/* Section 2: 月次コスト推移（プラン別・過去6ヶ月） */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]">
          月次コスト推移（プラン別・過去6ヶ月）
        </h2>
        {allAvgCosts.every((v) => v === 0) ? (
          <p className="text-sm text-[var(--text3)]">まだデータがありません</p>
        ) : (
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
            <div className="space-y-3">
              {monthKeys.map((mKey) => {
                const planMap = monthPlanMap[mKey]
                const plans = Object.keys(planMap)
                const [y, mo] = mKey.split('-')
                const label = `${y}/${mo}`
                if (plans.length === 0) {
                  return (
                    <div key={mKey} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs text-[var(--text3)]">{label}</span>
                      <p className="text-xs text-[var(--text3)]">—</p>
                    </div>
                  )
                }
                return (
                  <div key={mKey} className="space-y-1">
                    <span className="text-xs font-medium text-[var(--text3)]">{label}</span>
                    {plans.map((plan) => {
                      const avgCost = planMap[plan]
                      const pct = Math.round((avgCost / maxAvgCost) * 100)
                      return (
                        <div key={plan} className="group flex items-center gap-3 cursor-default">
                          <span className="w-28 shrink-0 text-xs text-[var(--text3)]">
                            {PLAN_LABELS[plan] ?? plan}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[var(--bg2)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--accent)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <CostValue
                            usd={avgCost}
                            className="w-16 text-right text-xs font-medium text-[var(--text)]"
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-[var(--text3)]">
          各バーは平均APIコスト/人を示します。ホバーで円換算。
        </p>
      </section>

      {/* Section 3: ルート別コスト内訳（今月・ユーザー分のみ） */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]">
          ルート別コスト内訳（今月・ユーザー分のみ）
        </h2>
        {routeList.every((r) => r.cost === 0) ? (
          <p className="text-sm text-[var(--text3)]">まだデータがありません</p>
        ) : (
          <div className="group overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
            {routeList.map((row, i) => (
              <div
                key={row.route}
                className={`flex items-center gap-4 px-5 py-3.5 ${
                  i < routeList.length - 1 ? 'border-b border-[var(--border)]' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)]">
                    {ROUTE_LABELS[row.route] ?? row.route}
                  </p>
                  <p className="text-xs text-[var(--text3)]">{row.calls}回</p>
                </div>
                <CostValue usd={row.cost} className="text-sm font-semibold text-[var(--text)]" />
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-[var(--text3)]">
          管理者・自動実行（user_id=null）を除いた純粋なユーザー利用分のみ集計しています。
        </p>
      </section>

      <div className="text-xs text-[var(--text3)]">
        <p>* 平均APIコストは claude-sonnet-4-6 の公開レート（$3/M input, $15/M output）で計算しています。</p>
        <p>* 為替レートは概算 1 USD = {EXCHANGE_RATE} JPY です。</p>
        <p>* 粗利はAIコストのみの計算です。サポート・固定費等の間接費は含みません。</p>
      </div>
    </div>
  )
}
