import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set<string>(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const SIGN_EXPIRES_SEC = 60 * 60

// ext 取材リンク経由の画像アップロード API（ハル限定・認証なし・トークンベース）。
// 通常側 (/api/projects/[id]/interviews/[interviewId]/attach) と同じ
// `<project_id>/<interview_id>/<uuid>.<ext>` パス規約に揃える。
//
// 権限: link.is_active かつ use_count < max_use_count、
//       interview が link に紐付き status !== 'completed' の場合のみ許可。
//       認証ヘッダー不要。リンクを握っている第三者が外部から画像を送るフロー。
async function resolveLinkAndInterview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: string,
  interviewId: string,
) {
  const { data: link } = await supabase
    .from('external_interview_links')
    .select('id, project_id, interviewer_type, is_active, use_count, max_use_count')
    .eq('token', token)
    .single()
  if (!link) return { error: 'link_invalid' as const, status: 404 }
  if (!link.is_active || link.use_count >= link.max_use_count) {
    return { error: 'link_invalid' as const, status: 403 }
  }

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, project_id, external_link_id, status, interviewer_type')
    .eq('id', interviewId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!interview || interview.external_link_id !== link.id) {
    return { error: 'not_found' as const, status: 404 }
  }
  if (interview.status === 'completed') {
    return { error: 'already_completed' as const, status: 410 }
  }

  return { link, interview }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const url = new URL(req.url)
  const interviewId = url.searchParams.get('interviewId')
  if (!interviewId) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const supabase = await createClient()
  const resolved = await resolveLinkAndInterview(supabase, token, interviewId)
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  }
  const { link, interview } = resolved

  // ハル限定（差別化を維持。仮にクライアントで他キャストが添付しようとしても弾く）
  if (interview.interviewer_type !== 'hal') {
    return NextResponse.json(
      { error: 'attachments_not_supported_for_cast', message: 'このキャストは画像添付に対応していません。' },
      { status: 400 },
    )
  }

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'file_required' }, { status: 400 })
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 400 })

  const safeExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg'
  const uid = crypto.randomUUID()
  const path = `${link.project_id}/${interview.id}/${uid}.${safeExt}`

  const adminClient = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await adminClient.storage
    .from('interview-attachments')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[ext attach] upload failed', { token, interviewId, error: uploadError.message })
    return NextResponse.json(
      { error: 'upload_failed', message: 'アップロードに失敗しました。もう一度お試しください。' },
      { status: 500 },
    )
  }

  return NextResponse.json({ path, contentType: file.type })
}

// 添付画像の署名付き URL を取得する API（ext 用）。
// 履歴復元時に使う。クエリ `paths=` カンマ区切りで最大 20 件まで。
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const url = new URL(req.url)
  const interviewId = url.searchParams.get('interviewId')
  if (!interviewId) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const supabase = await createClient()
  const resolved = await resolveLinkAndInterview(supabase, token, interviewId)
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  }
  const { link, interview } = resolved

  const pathsParam = url.searchParams.get('paths') ?? ''
  const requestedPaths = pathsParam
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 20)

  const expectedPrefix = `${link.project_id}/${interview.id}/`
  const validPaths = requestedPaths.filter((p) => p.startsWith(expectedPrefix))

  if (validPaths.length === 0) {
    return NextResponse.json({ urls: {} as Record<string, string> })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.storage
    .from('interview-attachments')
    .createSignedUrls(validPaths, SIGN_EXPIRES_SEC)

  if (error) {
    console.error('[ext attach] sign failed', { token, interviewId, error: error.message })
    return NextResponse.json({ error: 'sign_failed' }, { status: 500 })
  }

  const urls: Record<string, string> = {}
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
  }
  return NextResponse.json({ urls })
}
