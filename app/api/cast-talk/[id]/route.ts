import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type CastTalkEdit = {
  cast_talk_id: string
  cast_id: string
  original_text: string
  edited_text: string
}

/**
 * 元メッセージ配列と編集後メッセージ配列を同インデックスで比較し、
 * テキストが変更されたターンだけ CastTalkEdit レコードを返す。
 */
function buildEdits(
  castTalkId: string,
  original: Array<{ castId: string; text: string }>,
  edited: Array<{ castId: string; text: string }>,
): CastTalkEdit[] {
  const len = Math.min(original.length, edited.length)
  const result: CastTalkEdit[] = []
  for (let i = 0; i < len; i++) {
    const orig = original[i]
    const edit = edited[i]
    if (orig.castId === edit.castId && orig.text !== edit.text) {
      result.push({
        cast_talk_id: castTalkId,
        cast_id: orig.castId,
        original_text: orig.text,
        edited_text: edit.text,
      })
    }
  }
  return result
}

type UpdateBody = {
  status?: 'draft' | 'published'
  title?: string
  summary?: string | null
  messages?: Array<{ castId: string; text: string }>
}

function isUpdateBody(v: unknown): v is UpdateBody {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (o.status !== undefined && o.status !== 'draft' && o.status !== 'published') return false
  if (o.title !== undefined && (typeof o.title !== 'string' || o.title.trim().length === 0)) return false
  if (o.summary !== undefined && o.summary !== null && typeof o.summary !== 'string') return false
  if (o.messages !== undefined) {
    if (!Array.isArray(o.messages)) return false
    if (!o.messages.every(
      (m) => m && typeof m === 'object' &&
        typeof (m as Record<string, unknown>).castId === 'string' &&
        typeof (m as Record<string, unknown>).text === 'string'
    )) return false
  }
  return true
}

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  return adminEmails.includes(user.email)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = crypto.randomUUID()

  if (!(await isAdmin())) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '権限がありません', traceId },
      { status: 401 },
    )
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { code: 'INVALID_JSON', message: 'リクエストボディが不正です', traceId },
      { status: 400 },
    )
  }

  if (!isUpdateBody(body)) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: '入力値が不正です', traceId },
      { status: 400 },
    )
  }

  const { status, title, summary, messages } = body
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {}
  if (status !== undefined) {
    updateData.status = status
    if (status === 'published') updateData.published_at = new Date().toISOString()
  }
  if (title !== undefined) updateData.title = title
  if (summary !== undefined) updateData.summary = summary
  if (messages !== undefined) updateData.messages = messages

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: '更新内容がありません', traceId }, { status: 400 })
  }

  // messages が更新される場合、編集差分を cast_talk_edits に記録する
  let originalMessages: Array<{ castId: string; text: string }> | null = null
  if (messages !== undefined) {
    const { data: current, error: fetchError } = await supabase
      .from('cast_talks')
      .select('messages')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('[cast-talk/[id]] PATCH fetch original error', { traceId, error: fetchError.message })
    } else if (current?.messages && Array.isArray(current.messages)) {
      originalMessages = current.messages as Array<{ castId: string; text: string }>
    }
  }

  const { error } = await supabase
    .from('cast_talks')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('[cast-talk/[id]] PATCH error', { traceId, error: error.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '更新に失敗しました', traceId },
      { status: 500 },
    )
  }

  // 編集差分を cast_talk_edits に保存する（メイン保存が成功した後）
  if (messages !== undefined && originalMessages !== null) {
    const edits = buildEdits(id, originalMessages, messages)
    if (edits.length > 0) {
      const { error: editError } = await supabase.from('cast_talk_edits').insert(edits)
      if (editError) {
        // 差分保存の失敗はメインの更新には影響させない（ログのみ）
        console.error('[cast-talk/[id]] cast_talk_edits insert error', { traceId, error: editError.message })
      }
    }
  }

  return NextResponse.json({ ok: true, traceId })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = crypto.randomUUID()

  if (!(await isAdmin())) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '権限がありません', traceId },
      { status: 401 },
    )
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from('cast_talks').delete().eq('id', id)

  if (error) {
    console.error('[cast-talk/[id]] DELETE error', { traceId, error: error.message })
    return NextResponse.json(
      { code: 'DB_ERROR', message: '削除に失敗しました', traceId },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, traceId })
}
