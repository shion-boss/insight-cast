import type { CHARACTERS } from '@/lib/characters'

export const ARTICLES_PAGE_SIZE = 20

export type ArticleItem = {
  id: string
  title: string
  excerpt?: string
  articleTypeLabel: string
  createdAtLabel: string
  detailHref: string
  projectLabel?: string
  interviewerLabel?: string
  interviewerIcon48?: typeof CHARACTERS[number]['icon48'] | undefined
  interviewerEmoji?: string
  isShared?: boolean
}
