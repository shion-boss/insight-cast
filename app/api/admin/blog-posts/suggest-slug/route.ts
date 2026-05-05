import { NextRequest, NextResponse } from 'next/server'
import { getIsAdmin } from '@/lib/actions/auth'
import { generateSlugFromTitle } from '@/lib/blog-slug'

export async function POST(req: NextRequest) {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ code: 'FORBIDDEN', message: '権限がありません' }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ code: 'INVALID_JSON', message: 'リクエストボディが不正です' }, { status: 400 })
  }

  const title = (body as Record<string, unknown>)?.title
  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'タイトルが空です' }, { status: 400 })
  }
  if (title.length > 200) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'タイトルが長すぎます' }, { status: 400 })
  }

  const slug = await generateSlugFromTitle(title, 'admin/suggest-slug')
  if (!slug) {
    return NextResponse.json({ code: 'GENERATION_FAILED', message: 'スラッグを生成できませんでした' }, { status: 502 })
  }

  return NextResponse.json({ slug })
}
