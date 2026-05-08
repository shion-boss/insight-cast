import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ token: string }> }

// GET: 取材リンク経由の進行中インタビューのメッセージ履歴を返す（認証不要）
// 用途: ブラウザを閉じて再オープンした時に続きから再開させる
export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params
  const interviewId = req.nextUrl.searchParams.get('interviewId')
  if (!interviewId) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const supabase = await createClient()

  // リンクの存在確認
  const { data: link } = await supabase
    .from('external_interview_links')
    .select('id, is_active, use_count, max_use_count')
    .eq('token', token)
    .single()

  if (!link) {
    return NextResponse.json({ error: 'link_invalid' }, { status: 404 })
  }

  // 完了済みリンクは履歴を返さない（再開不可）
  if (!link.is_active || link.use_count >= link.max_use_count) {
    return NextResponse.json({ error: 'link_invalid' }, { status: 403 })
  }

  // インタビューがこのリンクのものか確認
  const { data: interview } = await supabase
    .from('interviews')
    .select('id, external_link_id, status')
    .eq('id', interviewId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!interview || interview.external_link_id !== link.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // 完了済み・破棄済みなら履歴は返さない
  if (interview.status === 'completed') {
    return NextResponse.json({ error: 'already_completed' }, { status: 410 })
  }

  // メッセージ取得（表示用にはパス済みを除外、passStreak 計算には raw を使う）
  const { data: rawMessages } = await supabase
    .from('interview_messages')
    .select('role, content, meta, created_at')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: true })

  const filtered = (rawMessages ?? []).filter((m) => {
    const meta = m.meta as Record<string, unknown> | null
    return !(meta && meta.passed === true)
  })

  // 連続パス数の復元: rawHistory ベースで interviewer_count - user_count - 1
  // （アクティブな未回答質問の分を1引く）
  const ivCount = (rawMessages ?? []).filter((m) => m.role !== 'user').length
  const usrCount = (rawMessages ?? []).filter((m) => m.role === 'user').length
  const passStreak = Math.max(0, ivCount - usrCount - 1)

  return NextResponse.json({
    interviewId,
    messages: filtered.map((m) => ({
      role: m.role === 'user' ? 'user' : 'interviewer',
      content: m.content,
    })),
    passStreak,
  })
}
