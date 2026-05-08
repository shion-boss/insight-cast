'use server'

import { canUseCast } from '@/lib/cast-access'
import {
  DEFAULT_INTERVIEW_FOCUS_THEME_MODE,
  isInterviewFocusThemeMode,
  normalizeInterviewFocusTheme,
} from '@/lib/interview-focus-theme'
import { getUserPlan, getPlanLimits, getJstMonthKey } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createInterview(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const interviewerType = `${formData.get('interviewerType') ?? ''}`
  // ユーザーごとにアクセス判定（grandfathered モデル）
  const isAvailableInterviewer = canUseCast(interviewerType, user.created_at)
  if (!isAvailableInterviewer) redirect(`/projects/${projectId}/interviewer`)

  const focusThemeModeValue = `${formData.get('focusThemeMode') ?? DEFAULT_INTERVIEW_FOCUS_THEME_MODE}`
  const focusThemeMode = isInterviewFocusThemeMode(focusThemeModeValue)
    ? focusThemeModeValue
    : DEFAULT_INTERVIEW_FOCUS_THEME_MODE
  const focusTheme = normalizeInterviewFocusTheme(formData.get('focusTheme'))

  if (focusThemeMode !== 'omakase' && !focusTheme) {
    redirect(`/projects/${projectId}/interviewer?cast=${interviewerType}&error=theme-required`)
  }

  // プロジェクトを取得（RLSでオーナー・メンバー両方がアクセス可）
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project) redirect('/dashboard')

  // オーナーのuser_idを取得して上限チェック（メンバーが使ってもオーナーの枠から消費）
  const ownerUserId = project.user_id

  const { data: userProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', ownerUserId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
  const projectIds = (userProjects ?? []).map((p) => p.id as string)

  const userPlan = await getUserPlan(supabase, ownerUserId)
  const planLimits = getPlanLimits(userPlan)

  // プランダウングレード時: 上限を超えた取材先からのインタビューを防ぐ（オーナーのプラン基準）
  const activeProjectIds = new Set(projectIds.slice(0, planLimits.maxProjects))
  if (!activeProjectIds.has(projectId)) {
    redirect(`/projects/${projectId}/interviewer?error=project_over_limit`)
  }

  // 取材回数の制限判定はカウンター読み取り（interviews INSERT トリガで increment 済み）
  // 削除で枠は戻らないため、deleted_at 無関係。
  if (planLimits.lifetimeInterviewLimit !== null) {
    // 無料プラン: 生涯インタビュー回数チェック
    const { data: lifetimeUsage } = await supabase
      .from('user_lifetime_usage')
      .select('interviews_created')
      .eq('user_id', ownerUserId)
      .maybeSingle()
    const lifetimeCount = lifetimeUsage?.interviews_created ?? 0
    if (lifetimeCount >= planLimits.lifetimeInterviewLimit) {
      redirect(`/projects/${projectId}/interviewer?cast=${interviewerType}&error=lifetime_limit`)
    }
  } else {
    // 有料プラン: 月間インタビュー回数チェック（JST 月キー基準）
    const monthKey = getJstMonthKey()
    const { data: monthlyUsage } = await supabase
      .from('usage_counters')
      .select('interviews_created')
      .eq('user_id', ownerUserId)
      .eq('month_key', monthKey)
      .maybeSingle()
    const monthlyCount = monthlyUsage?.interviews_created ?? 0
    if (monthlyCount >= planLimits.monthlyInterviewLimit) {
      redirect(`/projects/${projectId}/interviewer?cast=${interviewerType}&error=monthly_limit`)
    }
  }

  const { data: interview, error } = await supabase
    .from('interviews')
    .insert({
      project_id: projectId,
      interviewer_type: interviewerType,
      focus_theme_mode: focusThemeMode,
      focus_theme: focusThemeMode === 'omakase' ? null : focusTheme,
      // 取材を受けるユーザー（チーム編集者が代行する場合は editor 自身）。
      // 会話記事の「取材先」表示でこのユーザーの名前・アイコンをデフォルトにする。
      interviewee_user_id: user.id,
    })
    .select('id')
    .single()

  if (error || !interview) redirect(`/projects/${projectId}/interviewer`)

  redirect(`/projects/${projectId}/interview?interviewId=${interview.id}`)
}
