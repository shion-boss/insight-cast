import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const MIN_SUBMIT_DELAY_MS = 3000
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const MAX_REQUESTS_PER_IP = 3
const MAX_REQUESTS_PER_EMAIL = 2

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  return request.headers.get('x-real-ip')
    ?? request.headers.get('cf-connecting-ip')
    ?? ''
}

function hashIp(ip: string) {
  return createHash('sha256')
    .update(ip)
    .digest('hex')
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

  const { name, email, business, message, website, startedAt } = body as Record<string, unknown>

  if (typeof website === 'string' && website.trim()) {
    return NextResponse.json({ ok: true })
  }

  if (typeof startedAt === 'number' && Number.isFinite(startedAt)) {
    if (Date.now() - startedAt < MIN_SUBMIT_DELAY_MS) {
      return NextResponse.json({ ok: true })
    }
  }

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

  const normalizedEmail = email.trim().toLowerCase()
  const businessValue = typeof business === 'string' && business.trim() ? business.trim() : null
  const ip = getClientIp(req)
  const ipHash = ip ? hashIp(ip) : null
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const userAgent = req.headers.get('user-agent')
  const supabase = createAdminClient()

  const [ipRateLimitResult, emailRateLimitResult] = await Promise.all([
    ipHash
      ? supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', windowStart)
      : Promise.resolve({ count: 0, error: null }),
    supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .gte('created_at', windowStart),
  ])

  if (ipRateLimitResult.error || emailRateLimitResult.error) {
    return NextResponse.json(
      { code: 'RATE_LIMIT_CHECK_ERROR', message: '送信状況を確認できませんでした。少し待ってからお試しください。' },
      { status: 500 },
    )
  }

  if ((ipRateLimitResult.count ?? 0) >= MAX_REQUESTS_PER_IP || (emailRateLimitResult.count ?? 0) >= MAX_REQUESTS_PER_EMAIL) {
    return NextResponse.json(
      { code: 'RATE_LIMITED', message: '短時間に送信が続いています。10分ほど待ってからもう一度お試しください。' },
      { status: 429 },
    )
  }

  const { error } = await supabase.from('contact_messages').insert({
    name: name.trim(),
    email: normalizedEmail,
    business: businessValue,
    message: message.trim(),
    ip_hash: ipHash,
    user_agent: userAgent,
  })

  if (error) {
    return NextResponse.json(
      { code: 'DB_ERROR', message: '保存に失敗しました' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
