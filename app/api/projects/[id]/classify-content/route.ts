import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStoredSiteBlogPosts } from '@/lib/site-blog-support'
import { classifyBlogPosts } from '@/lib/content-map'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return new Response('Not found', { status: 404 })

  const { data: auditRow } = await supabase
    .from('hp_audits')
    .select('id, raw_data')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!auditRow) return new Response('No audit found', { status: 404 })

  const rawData = auditRow.raw_data as Record<string, unknown> | null
  const blogPosts = getStoredSiteBlogPosts(rawData)

  if (blogPosts.length === 0) {
    return Response.json({ classifications: [] })
  }

  const classifications = await classifyBlogPosts(blogPosts)

  const updatedRawData = {
    ...(rawData ?? {}),
    blog_classifications: classifications,
    blog_classifications_at: new Date().toISOString(),
  }

  await supabase
    .from('hp_audits')
    .update({ raw_data: updatedRawData })
    .eq('id', auditRow.id)

  return Response.json({ classifications })
}
