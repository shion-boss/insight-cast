import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStoredSiteBlogPosts } from '@/lib/site-blog-support'
import { buildClassificationSummary } from '@/lib/content-map'
import { classifyBlogPosts } from '@/lib/content-map.server'

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
    .is('deleted_at', null)
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

  let classifications: Awaited<ReturnType<typeof classifyBlogPosts>>
  try {
    classifications = await classifyBlogPosts(blogPosts)
  } catch (err) {
    console.error('[classify-content] AI classification failed', err)
    return Response.json({ error: 'classification_failed' }, { status: 502 })
  }

  const updatedRawData = {
    ...(rawData ?? {}),
    blog_classifications: classifications,
    blog_classifications_at: new Date().toISOString(),
    blog_classification_summary: buildClassificationSummary(classifications),
  }

  const { error: updateError } = await supabase
    .from('hp_audits')
    .update({ raw_data: updatedRawData })
    .eq('id', auditRow.id)

  if (updateError) {
    console.error('[classify-content] hp_audits update failed:', updateError.message)
    // 分類結果は返せるので更新失敗でもレスポンスをブロックしない
  }

  return Response.json({ classifications })
}
