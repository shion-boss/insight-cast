'use server'

import { CHARACTERS } from '@/lib/characters'
import {
  DEFAULT_INTERVIEW_FOCUS_THEME_MODE,
  isInterviewFocusThemeMode,
  normalizeInterviewFocusTheme,
} from '@/lib/interview-focus-theme'
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
