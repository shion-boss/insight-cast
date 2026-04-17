'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createSession(characterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('interview_sessions')
    .insert({ user_id: user.id, character_id: characterId, type: 'interview' })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  redirect(`/interview/${data.id}`)
}

export async function completeSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('interview_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  redirect(`/interview/${sessionId}/output`)
}
