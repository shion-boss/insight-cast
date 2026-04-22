'use server'

import { CHARACTERS } from '@/lib/characters'
import {
  DEFAULT_INTERVIEW_FOCUS_THEME_MODE,
  isInterviewFocusThemeMode,
  normalizeInterviewFocusTheme,
} from '@/lib/interview-focus-theme'
import { getUserPlan, getPlanLimits } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createInterview(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const interviewerType = `${formData.get('interviewerType') ?? ''}`
  const isAvailableInterviewer = CHARACTERS.some((char) => char.id === interviewerType && char.available)
  if (!isAvailableInterviewer) redirect(`/projects/${projectId}/interviewer`)

  const focusThemeModeValue = `${formData.get('focusThemeMode') ?? DEFAULT_INTERVIEW_FOCUS_THEME_MODE}`
  const focusThemeMode = isInterviewFocusThemeMode(focusThemeModeValue)
    ? focusThemeModeValue
    : DEFAULT_INTERVIEW_FOCUS_THEME_MODE
  const focusTheme = normalizeInterviewFocusTheme(formData.get('focusTheme'))

  if (focusThemeMode !== 'omakase' && !focusTheme) {
    redirect(`/projects/${projectId}/interviewer?cast=${interviewerType}&error=theme-required`)
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  // 月間取材回数チェック
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { data: userProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
  const projectIds = (userProjects ?? []).map((p) => p.id as string)
  const { count: monthlyCount } = await supabase
    .from('interviews')
    .select('id', { count: 'exact', head: true })
    .in('project_id', projectIds.length > 0 ? projectIds : ['__none__'])
    .gte('created_at', monthStart)

  const userPlan = await getUserPlan(supabase, user.id)
  const planLimits = getPlanLimits(userPlan)
  if ((monthlyCount ?? 0) >= planLimits.monthlyInterviewLimit) {
    redirect(`/projects/${projectId}/interviewer?error=monthly_limit`)
  }

  const { data: interview, error } = await supabase
    .from('interviews')
    .insert({
      project_id: projectId,
      interviewer_type: interviewerType,
      focus_theme_mode: focusThemeMode,
      focus_theme: focusThemeMode === 'omakase' ? null : focusTheme,
    })
    .select('id')
    .single()

  if (error || !interview) redirect(`/projects/${projectId}/interviewer`)

  redirect(`/projects/${projectId}/interview?interviewId=${interview.id}`)
}
