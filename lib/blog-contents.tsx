import type { ReactNode } from 'react'

export type PostContent = {
  slug: string
  body: ReactNode
}

export type ConversationTurn = {
  role: 'interviewer' | 'owner'
  text: string
}

export type InterviewBody = {
  kind: 'interview'
  intro: string
  highlights: string[]
  interviewerIntro: string
  conversation: ConversationTurn[]
  summary: string
}

export type NormalBody = {
  kind: 'normal'
  sections: NormalSection[]
}

export type MarkdownBody = {
  kind: 'markdown'
  content: string
}

export type NormalSection =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }

export type ArticleBody = NormalBody | InterviewBody | MarkdownBody
