import type { CHARACTERS } from '@/lib/characters'

export const INTERVIEWS_PAGE_SIZE = 20

export type InterviewItem = {
  id: string
  projectId: string
  projectLabel: string
  interviewerName: string
  interviewerEmoji: string
  icon48: typeof CHARACTERS[number]['icon48'] | undefined
  isDone: boolean
  articleCount: number
  uncreatedThemeCount: number
  createdAtLabel: string
  href: string
  canContinue?: boolean
  isShared?: boolean
}
