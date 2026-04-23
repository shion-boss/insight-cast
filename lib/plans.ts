export type PlanKey = 'free' | 'personal' | 'business'

export const PLANS = {
  free: {
    key: 'free' as const,
    label: '無料',
    maxProjects: 1,
    additionalProjectAllowed: false,
    monthlyInterviewLimit: 999,
    lifetimeInterviewLimit: 1,
    lifetimeArticleLimit: 3,
    maxCompetitorsPerProject: 0,
    supportLabel: 'コミュニティサポート',
  },
  personal: {
    key: 'personal' as const,
    label: '個人向け',
    maxProjects: 1,
    additionalProjectAllowed: false,
    monthlyInterviewLimit: 15,
    lifetimeInterviewLimit: null,
    lifetimeArticleLimit: null,
    maxCompetitorsPerProject: 3,
    supportLabel: '通常サポート',
  },
  business: {
    key: 'business' as const,
    label: '法人向け',
    maxProjects: 3,
    additionalProjectAllowed: true,
    monthlyInterviewLimit: 60,
    lifetimeInterviewLimit: null,
    lifetimeArticleLimit: null,
    maxCompetitorsPerProject: 3,
    supportLabel: '優先サポート',
  },
} satisfies Record<PlanKey, {
  key: PlanKey
  label: string
  maxProjects: number
  additionalProjectAllowed: boolean
  monthlyInterviewLimit: number
  lifetimeInterviewLimit: number | null
  lifetimeArticleLimit: number | null
  maxCompetitorsPerProject: number
  supportLabel: string
}>

export function getPlanLimits(planKey: PlanKey | null | undefined) {
  return PLANS[planKey ?? 'free']
}

// 無料プランの生涯記事上限に達しているか確認する
// true の場合、すべてのAI操作をロックする
export async function isFreePlanLocked(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
): Promise<boolean> {
  const plan = await getUserPlan(supabase, userId)
  const limits = getPlanLimits(plan)
  if (limits.lifetimeArticleLimit === null) return false

  const { data: userProjects } = await supabase.from('projects').select('id').eq('user_id', userId)
  const projectIds = (userProjects ?? []).map((p) => p.id as string)
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .in('project_id', projectIds.length > 0 ? projectIds : ['__none__'])
  return (count ?? 0) >= limits.lifetimeArticleLimit
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
  if (plan === 'personal' || plan === 'business') return plan
  return 'free'
}
