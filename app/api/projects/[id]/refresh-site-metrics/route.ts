import { createClient } from '@/lib/supabase/server'
import { buildRefreshedSiteMetrics } from '@/lib/site-metrics-refresh'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, hp_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data: audit } = await supabase
    .from('hp_audits')
    .select('id, raw_data')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!audit?.id) return NextResponse.json({ error: 'audit not found' }, { status: 404 })

  try {
    const refreshed = await buildRefreshedSiteMetrics({
      siteUrl: project.hp_url,
      rawData: audit.raw_data as Record<string, unknown> | null | undefined,
    })

    const { error } = await supabase
      .from('hp_audits')
      .update({ raw_data: refreshed.rawData })
      .eq('id', audit.id)

    if (error) {
      console.error('[refresh-site-metrics] hp_audits update failed:', error.message)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      blogMetrics: refreshed.blogMetrics,
      blogPostCount: refreshed.blogPosts.length,
    })
  } catch (error) {
    console.error('[refresh-site-metrics]', error)
    return NextResponse.json({ error: 'refresh failed' }, { status: 500 })
  }
}
