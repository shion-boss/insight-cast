'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const hp_url = normalizeUrl(formData.get('url') as string)
  const name   = (formData.get('name') as string)?.trim() || null

  if (!hp_url) redirect('/projects/new?error=url')

  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, name, hp_url, status: 'interview_ready' })
    .select('id')
    .single()

  if (error || !data) redirect('/projects/new?error=1')
  redirect(`/projects/${data.id}/interviewer`)
}

export async function saveCompetitors(
  projectId: string,
  urls: string[],
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'auth' }

  const valid = urls
    .map(normalizeUrl)
    .filter(Boolean)
    .slice(0, 3)

  if (valid.length > 0) {
    const { error } = await supabase
      .from('competitors')
      .insert(valid.map(url => ({ project_id: projectId, url })))
    if (error) return { error: 'db' }
  }

  return {}
}
