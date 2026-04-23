export type PlanKey = 'free' | 'personal' | 'business'

export const PLANS = {
  free: {
    key: 'free' as const,
    label: '無料',
    maxProjects: 1,
    additionalProjectAllowed: false,
    monthlyInterviewLimit: 2,
    maxCompetitorsPerProject: 1,
    supportLabel: 'コミュニティサポート',
  },
  personal: {
    key: 'personal' as const,
    label: '個人向け',
    maxProjects: 1,
    additionalProjectAllowed: false,
    monthlyInterviewLimit: 15,
    maxCompetitorsPerProject: 3,
    supportLabel: '通常サポート',
  },
  business: {
    key: 'business' as const,
    label: '法人向け',
    maxProjects: 3,
    additionalProjectAllowed: true,
    monthlyInterviewLimit: 60,
    maxCompetitorsPerProject: 3,
    supportLabel: '優先サポート',
  },
} satisfies Record<PlanKey, {
  key: PlanKey
  label: string
  maxProjects: number
  additionalProjectAllowed: boolean
  monthlyInterviewLimit: number
  maxCompetitorsPerProject: number
  supportLabel: string
}>

export function getPlanLimits(planKey: PlanKey | null | undefined) {
  return PLANS[planKey ?? 'free']
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
