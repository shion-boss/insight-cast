// NOTE: 課金機能（Stripe連携・プラン変更）は未実装。
// Phase 3 で実装予定。現在はプラン表示・上限チェックのみに使用。
export type PlanKey = 'individual' | 'business'

export const PLANS = {
  individual: {
    key: 'individual' as const,
    label: '個人向け',
    maxProjects: 1,
    additionalProjectAllowed: false,
    monthlyInterviewLimit: 10,
    maxCompetitorsPerProject: 3,
    supportLabel: '通常サポート',
  },
  business: {
    key: 'business' as const,
    label: '法人向け',
    maxProjects: 3,
    additionalProjectAllowed: true,
    monthlyInterviewLimit: 20,
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
  return PLANS[planKey ?? 'individual']
}
