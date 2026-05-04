import { createClient } from '@/lib/supabase/server'
import { getMemberRole } from '@/lib/project-members'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  const { interviewId, content } = body as { interviewId?: string; content?: string }
  if (!interviewId || !content) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  if (typeof content === 'string' && content.length > 5000) {
    return NextResponse.json({ error: 'content too long' }, { status: 400 })
  }

  // ownership check: verify interview belongs to a project the current user owns
  const { data: interview } = await supabase
    .from('interviews')
    .select('id, project_id, interviews_project:projects(user_id)')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single()
  if (!interview) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const joinedProject = interview.interviews_project as { user_id: string } | { user_id: string }[] | null
  const projectOwner = Array.isArray(joinedProject) ? (joinedProject[0] ?? null) : joinedProject
  if (!projectOwner) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // owner OR editor を許可。interview_messages INSERT は editor の RLS で通過する
  const isOwner = projectOwner.user_id === user.id
  const memberRole = isOwner ? null : await getMemberRole(supabase, projectId, user.id)
  const canEdit = isOwner || memberRole === 'editor'
  if (!canEdit) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { error: insertError } = await supabase.from('interview_messages').insert({
    interview_id: interviewId,
    role: 'user',
    content,
  })

  if (insertError) {
    console.error('[POST /api/projects/[id]/interview/message] insert error', {
      interviewId,
      error: insertError.message,
    })
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
