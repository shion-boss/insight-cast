export type PlanKey = 'free' | 'personal' | 'business'

export const PLANS = {
  free: {
    key: 'free' as const,
    label: '無料',
    maxProjects: 1,
    additionalProjectAllowed: false,
    monthlyInterviewLimit: 1,
    maxCompetitorsPerProject: 1,
    supportLabel: 'コミュニティサポート',
  },
  personal: {
    key: 'personal' as const,
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
  return PLANS[planKey ?? 'free']
}
