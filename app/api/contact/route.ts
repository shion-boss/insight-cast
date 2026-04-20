import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { code: 'INVALID_JSON', message: '不正なリクエストです' },
      { status: 400 },
    )
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json(
      { code: 'INVALID_BODY', message: '不正なリクエストです' },
      { status: 400 },
    )
  }

  const { name, email, business, message } = body as Record<string, unknown>

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'お名前を入力してください' },
      { status: 422 },
    )
  }
  if (typeof email !== 'string' || !email.trim() || !isValidEmail(email)) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: '正しいメールアドレスを入力してください' },
      { status: 422 },
    )
  }
  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'ご相談内容を入力してください' },
      { status: 422 },
    )
  }

  const businessValue = typeof business === 'string' && business.trim() ? business.trim() : null

  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert({
    name: name.trim(),
    email: email.trim(),
    business: businessValue,
    message: message.trim(),
  })

  if (error) {
    return NextResponse.json(
      { code: 'DB_ERROR', message: '保存に失敗しました' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
