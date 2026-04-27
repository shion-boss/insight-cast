export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { CastTalkAdminClient } from './CastTalkAdminClient'
import { Breadcrumb } from '@/components/ui'

async function getCastTalks() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cast_talks')
    .select('id, title, slug, format, interviewer_id, guest_id, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/cast-talk] fetch error', error.message)
    return []
  }
  return data ?? []
}

export default async function AdminCastTalkPage() {
  const items = await getCastTalks()

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '管理', href: '/admin' }, { label: 'Cast Talk' }]} />
      <CastTalkAdminClient
        initialItems={items as Array<{
          id: string
          title: string
          slug: string
          format: 'interview' | 'dialogue'
          interviewer_id: string
          guest_id: string
          status: 'draft' | 'published'
          created_at: string
        }>}
      />
    </div>
  )
}
