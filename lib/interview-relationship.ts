import type { SupabaseClient } from '@supabase/supabase-js'

import type { PastInterviewMemo } from '@/lib/ai-quality'

export type PriorMeetingContext = {
  priorMeetingsCount: number
  relationship: 'first' | 'returning'
  pastMemos: PastInterviewMemo[]
}

type PriorInterviewRow = {
  id: string
  focus_theme: string | null
  summary: string | null
  themes: string[] | null
  created_at: string | null
}

/**
 * 同一プロジェクト × 同一 interviewer_type で完了済みの過去インタビューを取得する。
 * AIキャストにとっての「このユーザーとの初対面/再会」判定と、
 * 過去メモの自然な引用に使う。
 *
 * スコープを project に絞るのは、別プロジェクトの取材内容を混ぜて
 * 守秘・誤参照のリスクを生まないため。
 */
export async function fetchPriorMeetings(params: {
  supabase: SupabaseClient
  projectId: string
  interviewerType: string
  currentInterviewId: string
  limit?: number
}): Promise<PriorMeetingContext> {
  const { supabase, projectId, interviewerType, currentInterviewId } = params
  const limit = params.limit ?? 10

  const { data } = await supabase
    .from('interviews')
    .select('id, focus_theme, summary, themes, created_at')
    .eq('project_id', projectId)
    .eq('interviewer_type', interviewerType)
    .eq('status', 'completed')
    .neq('id', currentInterviewId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  const rows = (data ?? []) as PriorInterviewRow[]

  const pastMemos: PastInterviewMemo[] = rows.map((row) => ({
    focusTheme: row.focus_theme,
    summary: row.summary,
    themes: row.themes ?? [],
    createdAt: row.created_at,
  }))

  return {
    priorMeetingsCount: pastMemos.length,
    relationship: pastMemos.length > 0 ? 'returning' : 'first',
    pastMemos,
  }
}

/**
 * 過去メモの中から、現在の focus_theme に関連しそうなものを最大 max 件返す。
 * キーワードが2文字以上マッチしたものを優先し、関連が遠いが面白いメモも1件混ぜる。
 * summary または themes のどちらかが空でないメモのみ対象にする。
 */
export function selectRelevantMemos(
  memos: PastInterviewMemo[],
  currentFocusTheme: string | null | undefined,
  max = 2,
): PastInterviewMemo[] {
  const usable = memos.filter(
    (memo) => Boolean(memo.summary) || (memo.themes && memo.themes.length > 0) || Boolean(memo.focusTheme),
  )
  if (usable.length === 0) return []

  if (!currentFocusTheme) {
    return usable.slice(0, max)
  }

  const keywords = extractKeywords(currentFocusTheme)
  if (keywords.length === 0) return usable.slice(0, max)

  const scored = usable.map((memo) => {
    const haystack = [
      memo.focusTheme ?? '',
      ...(memo.themes ?? []),
      memo.summary ?? '',
    ].join(' ')
    const score = keywords.reduce((acc, kw) => (haystack.includes(kw) ? acc + 1 : acc), 0)
    return { memo, score }
  })

  // 関連度の高い順
  scored.sort((a, b) => b.score - a.score)

  const matched = scored.filter((s) => s.score > 0).map((s) => s.memo)
  const unmatched = scored.filter((s) => s.score === 0).map((s) => s.memo)

  // 関連が高いものを優先しつつ、関連が遠いが面白い（=最近の別テーマ）メモを1件混ぜる。
  // これにより取材中に「前回の○○の話とつながりますね」のような横断的な接続が起こる余地ができる。
  if (matched.length >= max) {
    if (unmatched.length > 0 && max >= 2) {
      // matched から (max-1) 件 + unmatched から 1 件
      return [...matched.slice(0, max - 1), unmatched[0]]
    }
    return matched.slice(0, max)
  }

  return [...matched, ...unmatched].slice(0, max)
}

function extractKeywords(text: string): string[] {
  return text
    .replace(/[、。・,.\s]+/g, ' ')
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}
