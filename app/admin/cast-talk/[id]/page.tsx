import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHARACTERS } from '@/lib/characters'
import type { Character } from '@/lib/characters'
import { CastTalkPreviewClient } from './CastTalkPreviewClient'

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

export default async function AdminCastTalkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const talk = await getCastTalk(id)
  if (!talk) notFound()

  const characterMap: Record<string, Character> = {}
  for (const c of CHARACTERS) {
    characterMap[c.id] = c
  }

  return (
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
    />
  )
}
