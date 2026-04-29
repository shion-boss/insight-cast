import type { SupabaseClient } from '@supabase/supabase-js'

export async function getMemberRole(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<'editor' | 'viewer' | null> {
  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.role as 'editor' | 'viewer') ?? null
}

export async function isProjectMember(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<boolean> {
  const role = await getMemberRole(supabase, projectId, userId)
  return role !== null
}
