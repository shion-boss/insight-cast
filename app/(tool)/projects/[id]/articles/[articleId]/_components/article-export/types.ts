export const DEFAULT_THEME_COLOR = '#c2722a'

// 全カード共通のヘッダー sticky 位置（グローバルヘッダー min-h-[64px] の直下に貼り付く）
export const STICKY_TOP = 'top-[64px]'

export const PURIFY_OPTS = {
  ALLOWED_URI_REGEXP: /^(?:(?:https?|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
}

export type ArticleBlockKind = 'title' | 'intro' | 'heading' | 'body'
export type ArticleBlock = { kind: ArticleBlockKind; text: string; rawText?: string }

export const BLOCK_LABEL: Record<ArticleBlockKind, string> = {
  title:   'タイトル',
  intro:   '概要',
  heading: '小見出し',
  body:    '本文',
}

export type RenderGroup =
  | { type: 'standalone'; block: ArticleBlock }
  | { type: 'section'; heading: ArticleBlock; body: ArticleBlock | null }

export type ConvRenderGroup =
  | { type: 'standalone'; block: ArticleBlock }
  | { type: 'section'; heading: ArticleBlock; body: ArticleBlock | null }
  | { type: 'conversation'; text: string }
  | { type: 'meta'; key: string; value: string }
