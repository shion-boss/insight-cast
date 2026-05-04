import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMemberRole } from '@/lib/project-members'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set<string>(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

/**
 * ハル限定の取材画像アップロード API。
 *
 * クライアントから直接 supabase.storage に upload すると Cloud 環境で
 * RLS ポリシーが効かないことがあるため、サーバー側で admin client を使って upload する。
 * 認証・キャラ判定・サイズ/MIME チェックはこのルートで行う。
 *
 * パス規約: '<project_id>/<interview_id>/<uuid>.<ext>'
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; interviewId: string }> },
) {
  const { id: projectId, interviewId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, project_id, interviews_project:projects(user_id)')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single()
  if (!interview) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // ハル限定（差別化を維持。仮にクライアントで他キャストが添付できても弾く）
  if (interview.interviewer_type !== 'hal') {
    return NextResponse.json(
      { error: 'attachments_not_supported_for_cast', message: 'このキャストは画像添付に対応していません。' },
      { status: 400 },
    )
  }

  // オーナーまたは editor のみアップロード可能
  const joinedProject = interview.interviews_project as { user_id: string } | { user_id: string }[] | null
  const projectInfo = Array.isArray(joinedProject) ? (joinedProject[0] ?? null) : joinedProject
  const isOwner = projectInfo?.user_id === user.id
  if (!isOwner) {
    const role = await getMemberRole(supabase, projectId, user.id)
    if (role !== 'editor') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'file_required' }, { status: 400 })
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 400 })

  const safeExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg'
  const uid = crypto.randomUUID()
  const path = `${projectId}/${interviewId}/${uid}.${safeExt}`

  const adminClient = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await adminClient.storage
    .from('interview-attachments')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[interview attach] upload failed', { interviewId, error: uploadError.message })
    return NextResponse.json(
      { error: 'upload_failed', message: 'アップロードに失敗しました。もう一度お試しください。' },
      { status: 500 },
    )
  }

  return NextResponse.json({ path, contentType: file.type })
}
