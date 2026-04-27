import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHARACTERS } from '@/lib/characters'
import type { Character } from '@/lib/characters'
import { CastTalkPreviewClient } from './CastTalkPreviewClient'
import { Breadcrumb } from '@/components/ui'

async function getCastTalk(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cast_talks')
    .select('id, title, theme, format, interviewer_id, guest_id, messages, summary, status')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

async function getCastTalkReview(castTalkId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('cast_talk_reviews')
    .select('id, overall_score, naturalness_score, character_score, good_points, improve_points')
    .eq('cast_talk_id', castTalkId)
    .maybeSingle()
  return data ?? null
}

export default async function AdminCastTalkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [talk, review] = await Promise.all([getCastTalk(id), getCastTalkReview(id)])
  if (!talk) notFound()

  const characterMap: Record<string, Character> = {}
  for (const c of CHARACTERS) {
    characterMap[c.id] = c
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: '管理', href: '/admin' },
        { label: 'Cast Talk', href: '/admin/cast-talk' },
        { label: talk.title },
      ]} />
      <CastTalkPreviewClient
        talk={talk as {
          id: string
          title: string
          theme: string
          format: 'interview' | 'dialogue'
          interviewer_id: string
          guest_id: string
          messages: Array<{ castId: string; text: string }>
          summary: string | null
          status: 'draft' | 'published'
        }}
        characterMap={characterMap}
        existingReview={review as {
          overall_score: number
          naturalness_score: number | null
          character_score: number | null
          good_points: string | null
          improve_points: string | null
        } | null}
      />
    </div>
  )
}
