export type PlanKey = 'free' | 'lightning' | 'personal' | 'business'

export const PLANS = {
  free: {
    key: 'free' as const,
    label: '無料',
    maxProjects: 1,
    additionalProjectAllowed: false,
    monthlyInterviewLimit: 999, // lifetimeInterviewLimit が有効なため実質未使用
    lifetimeInterviewLimit: 2,
    lifetimeArticleLimit: 3,
    monthlyArticleLimit: null, // lifetimeArticleLimit が有効なため使用しない
    maxCompetitorsPerProject: 0,
    supportLabel: 'コミュニティサポート',
    externalInterviewLinksAllowed: false,
  },
  lightning: {
    key: 'lightning' as const,
    label: 'ライト',
    maxProjects: 1,
    additionalProjectAllowed: false,
    monthlyInterviewLimit: 5,
    lifetimeInterviewLimit: null,
    lifetimeArticleLimit: null,
    monthlyArticleLimit: 10,
    maxCompetitorsPerProject: 0,
    supportLabel: '通常サポート',
    externalInterviewLinksAllowed: false,
  },
  personal: {
    key: 'personal' as const,
    label: '個人向け',
    maxProjects: 1,
    additionalProjectAllowed: false,
    monthlyInterviewLimit: 15,
    lifetimeInterviewLimit: null,
    lifetimeArticleLimit: null,
    monthlyArticleLimit: 30,
    maxCompetitorsPerProject: 3,
    supportLabel: '通常サポート',
    externalInterviewLinksAllowed: false,
  },
  business: {
    key: 'business' as const,
    label: '法人向け',
    maxProjects: 3,
    additionalProjectAllowed: true,
    monthlyInterviewLimit: 60,
    lifetimeInterviewLimit: null,
    lifetimeArticleLimit: null,
    monthlyArticleLimit: 180,
    maxCompetitorsPerProject: 3,
    supportLabel: '優先サポート',
    externalInterviewLinksAllowed: true,
  },
} satisfies Record<PlanKey, {
  key: PlanKey
  label: string
  maxProjects: number
  additionalProjectAllowed: boolean
  monthlyInterviewLimit: number
  lifetimeInterviewLimit: number | null
  lifetimeArticleLimit: number | null
  monthlyArticleLimit: number | null
  maxCompetitorsPerProject: number
  supportLabel: string
  externalInterviewLinksAllowed: boolean
}>

export function getPlanLimits(planKey: PlanKey | null | undefined) {
  return PLANS[planKey ?? 'free']
}

// 「今月」の起点（JST 1日 00:00）を ISO 文字列で返す。
// 課金・制限カウントの月境界を Asia/Tokyo に揃えるための共通ヘルパー。
// Stripe billing cycle と完全一致はしないが、ユーザー視点での「月初」を JST に固定する。
export function getJstMonthStartIso(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  // JST の月初 00:00 は UTC で前日 15:00。+09:00 オフセットで明示する。
  return new Date(`${year}-${month}-01T00:00:00+09:00`).toISOString()
}

// 'YYYY-MM' 形式の JST 月キー。usage_counters.month_key と一致させる。
export function getJstMonthKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  return `${year}-${month}`
}

// 無料プランの生涯記事上限に達しているか確認する
// true の場合、すべてのAI操作をロックする
// user_lifetime_usage.articles_created（articles INSERT トリガで increment）から判定する。
// 削除（soft-delete / hard-delete / プロジェクト削除）でカウンターは戻らない方針。
// 別ユーザー（オーナー）の userId を渡してチェックする場合は admin client を渡すこと。
export async function isFreePlanLocked(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
): Promise<boolean> {
  const plan = await getUserPlan(supabase, userId)
  const limits = getPlanLimits(plan)
  if (limits.lifetimeArticleLimit === null) return false

  const { data } = await supabase
    .from('user_lifetime_usage')
    .select('articles_created')
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.articles_created ?? 0) >= limits.lifetimeArticleLimit
}

// 有料プランの月次記事上限に達しているか確認する
// usage_counters.articles_created（当月分、articles INSERT トリガで increment）から判定する。
// 削除（soft-delete / hard-delete / プロジェクト削除）でカウンターは戻らない方針。
// 別ユーザー（オーナー）の userId を渡してチェックする場合は admin client を渡すこと。
export async function checkMonthlyArticleLimit(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
): Promise<{ allowed: boolean; limit: number | null; count: number }> {
  const plan = await getUserPlan(supabase, userId)
  const limits = getPlanLimits(plan)
  if (limits.monthlyArticleLimit === null) return { allowed: true, limit: null, count: 0 }

  const monthKey = getJstMonthKey()
  const { data } = await supabase
    .from('usage_counters')
    .select('articles_created')
    .eq('user_id', userId)
    .eq('month_key', monthKey)
    .maybeSingle()
  const count = data?.articles_created ?? 0

  return {
    allowed: count < limits.monthlyArticleLimit,
    limit: limits.monthlyArticleLimit,
    count,
  }
}

// subscriptions テーブルからユーザーのプランを取得する
// profiles.plan ではなくこちらを正として使う
export async function getUserPlan(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
): Promise<PlanKey> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle()
  const plan = data?.plan as string | undefined
  if (plan === 'lightning' || plan === 'personal' || plan === 'business') return plan
  return 'free'
}
