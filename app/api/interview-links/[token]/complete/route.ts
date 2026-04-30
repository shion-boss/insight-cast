import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const BodySchema = z.object({
  interviewId: z.string().uuid(),
})

type Params = { params: Promise<{ token: string }> }

// POST: 取材完了処理（use_count +1、上限に達したら is_active = false）（認証不要）
export async function POST(
  req: NextRequest,
  { params }: Params,
) {
  const { token } = await params
  const supabase = await createClient()

  // リンクの存在確認
  const { data: link } = await supabase
    .from('external_interview_links')
    .select('id, is_active, use_count, max_use_count')
    .eq('token', token)
    .single()

  if (!link) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  // interviewId がこのリンクに紐づいているか確認
  const { data: interview } = await supabase
    .from('interviews')
    .select('id, external_link_id')
    .eq('id', parsed.data.interviewId)
    .single()

  if (!interview || interview.external_link_id !== link.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const newUseCount = link.use_count + 1
  const shouldDeactivate = newUseCount >= link.max_use_count

  const { error } = await supabase
    .from('external_interview_links')
    .update({
      use_count: newUseCount,
      ...(shouldDeactivate ? { is_active: false } : {}),
    })
    .eq('id', link.id)

  if (error) {
    console.error('[POST /api/interview-links/[token]/complete] update error:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  // インタビューのステータスを完了に更新
  await supabase
    .from('interviews')
    .update({ status: 'completed' })
    .eq('id', parsed.data.interviewId)

  return NextResponse.json({ ok: true, useCount: newUseCount, deactivated: shouldDeactivate })
}
