export type ProjectContentStatus = 'interview_done' | 'article_generating' | 'article_ready'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

export async function determineProjectContentStatus(
  supabase: SupabaseLike,
  projectId: string,
): Promise<ProjectContentStatus> {
  const [{ count: articleCount }, { data: generatingInterview }] = await Promise.all([
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabase
      .from('interviews')
      .select('id')
      .eq('project_id', projectId)
      .eq('article_status', 'generating')
      .limit(1),
  ])

  if ((generatingInterview?.length ?? 0) > 0) {
    return 'article_generating'
  }

  if ((articleCount ?? 0) > 0) {
    return 'article_ready'
  }

  return 'interview_done'
}

export async function syncProjectContentStatus(
  supabase: SupabaseLike,
  projectId: string,
): Promise<ProjectContentStatus> {
  const status = await determineProjectContentStatus(supabase, projectId)
  await supabase.from('projects').update({ status }).eq('id', projectId)
  return status
}
