import { createClient } from '@/lib/supabase/server'
import { buildRefreshedSiteMetrics } from '@/lib/site-metrics-refresh'
import { NextResponse } from 'next/server'

function isStale(timestamp: unknown) {
  if (typeof timestamp !== 'string') return true
  const parsed = new Date(timestamp).getTime()
  if (Number.isNaN(parsed)) return true
  return Date.now() - parsed >= 18 * 60 * 60 * 1000
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, hp_url, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(8)

  if (!projects || projects.length === 0) {
    return NextResponse.json({ ok: true, refreshed: 0 })
  }

  const { data: audits } = await supabase
    .from('hp_audits')
    .select('id, project_id, raw_data')
    .in('project_id', projects.map((project) => project.id))
    .order('created_at', { ascending: false })

  const latestAuditByProject = new Map<string, { id: string; raw_data: Record<string, unknown> | null }>()
  for (const audit of audits ?? []) {
    if (!latestAuditByProject.has(audit.project_id)) {
      latestAuditByProject.set(audit.project_id, {
        id: audit.id,
        raw_data: audit.raw_data as Record<string, unknown> | null,
      })
    }
  }

  let refreshedCount = 0

  for (const project of projects) {
    const audit = latestAuditByProject.get(project.id)
    if (!audit) continue
    const lightweightUpdatedAt = audit.raw_data?.lightweight_metrics_updated_at
    if (!isStale(lightweightUpdatedAt)) continue

    try {
      const refreshed = await buildRefreshedSiteMetrics({
        siteUrl: project.hp_url,
        rawData: audit.raw_data,
      })

      const { error } = await supabase
        .from('hp_audits')
        .update({ raw_data: refreshed.rawData })
        .eq('id', audit.id)

      if (error) {
        console.error('[account/refresh-site-metrics] hp_audits update failed:', project.id, error.message)
      } else {
        refreshedCount += 1
      }
    } catch (error) {
      console.error('[account/refresh-site-metrics]', project.id, error)
    }
  }

  return NextResponse.json({ ok: true, refreshed: refreshedCount })
}
