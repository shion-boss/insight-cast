'use server'

import { createClient } from '@/lib/supabase/server'
import { rememberProjectCompetitorContext } from '@/lib/project-competitor-context'
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
  const industryMemo = (formData.get('industry_memo') as string)?.trim() || null
  const location = (formData.get('location') as string)?.trim() || null
  const competitorUrls = formData
    .getAll('competitor_urls')
    .map((value) => normalizeUrl(String(value)))
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 3)

  if (!name) redirect('/projects/new?error=name')
  if (!hp_url) redirect('/projects/new?error=url')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      hp_url,
      status: 'analysis_pending',
    })
    .select('id')
    .single()

  if (error || !data) redirect('/projects/new?error=1')

  if (competitorUrls.length > 0) {
    await supabase
      .from('competitors')
      .insert(competitorUrls.map((url) => ({ project_id: data.id, url })))
  }

  if (industryMemo || location) {
    await rememberProjectCompetitorContext({
      supabase,
      userId: user.id,
      projectId: data.id,
      hpUrl: hp_url,
      industryMemo: industryMemo ?? '',
      location: location ?? '',
    })
  }

  redirect(`/projects/${data.id}`)
}

export async function saveCompetitors(
  projectId: string,
  input: {
    urls: string[]
    industryMemo?: string
    location?: string
  },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'auth' }

  const { data: project } = await supabase
    .from('projects')
    .select('id, hp_url')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!project) return { error: 'auth' }

  const valid = input.urls
    .map(normalizeUrl)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 3)
  const industryMemo = input.industryMemo?.trim() || null
  const location = input.location?.trim() || null

  const { error: deleteCompetitorError } = await supabase
    .from('competitors')
    .delete()
    .eq('project_id', projectId)

  if (deleteCompetitorError) return { error: 'db' }

  if (valid.length > 0) {
    const { error } = await supabase
      .from('competitors')
      .insert(valid.map((url) => ({ project_id: projectId, url })))
    if (error) return { error: 'db' }
  }

  const { error: projectError } = await supabase
    .from('projects')
    .update({ status: 'analysis_pending' })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (projectError) return { error: 'db' }

  await rememberProjectCompetitorContext({
    supabase,
    userId: user.id,
    projectId,
    hpUrl: project.hp_url,
    industryMemo: industryMemo ?? '',
    location: location ?? '',
  })

  return {}
}
