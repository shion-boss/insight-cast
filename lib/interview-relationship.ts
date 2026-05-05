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
 * 過去メモの中から、現在の focus_theme に関連するものだけを最大 max 件返す。
 * キーワードが2文字以上マッチしたメモのみ対象にし、関連が薄いメモは混ぜない。
 * （無関係な過去テーマを冒頭で持ち出すと、今日の取材の焦点がぼやけるため。）
 * focus_theme が未指定（omakase 等）の場合は、テーマ未確定なので最近のメモを max 件まで返す。
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

  // 関連が高いものだけを返す（マッチ 0 件なら何も返さない）。
  // AI 側の指示でも「関連が薄い過去テーマには触れない」としているため、
  // ここで関連が遠いメモを文脈に混ぜないようにすることでブレを抑える。
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.memo)
}

function extractKeywords(text: string): string[] {
  return text
    .replace(/[、。・,.\s]+/g, ' ')
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}
