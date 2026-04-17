import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { interviewId, content } = await req.json()
  if (!interviewId || !content) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

  // ownership check
  const { data: interview } = await supabase
    .from('interviews')
    .select('id, project_id')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .single()
  if (!interview) return NextResponse.json({ error: 'not found' }, { status: 404 })

  await supabase.from('interview_messages').insert({
    interview_id: interviewId,
    role: 'user',
    content,
  })

  return NextResponse.json({ ok: true })
}
