import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ token: string }> }

function isLinkValid(link: { is_active: boolean; use_count: number; max_use_count: number }): boolean {
  return link.is_active && link.use_count < link.max_use_count
}

// GET: トークン検証（認証不要）
export async function GET(
  _req: NextRequest,
  { params }: Params,
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('external_interview_links')
    .select('id, interviewer_type, theme, target_name, target_industry, is_active, use_count, max_use_count')
    .eq('token', token)
    .single()

  if (!link) {
    return NextResponse.json({ valid: false })
  }

  const valid = isLinkValid(link)

  if (!valid) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({
    valid: true,
    interviewerType: link.interviewer_type,
    theme: link.theme,
    targetName: link.target_name ?? undefined,
    targetIndustry: link.target_industry ?? undefined,
  })
}

// DELETE: 手動無効化（認証必須）
export async function DELETE(
  _req: NextRequest,
  { params }: Params,
) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: link } = await supabase
    .from('external_interview_links')
    .select('id, created_by')
    .eq('token', token)
    .single()

  if (!link) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (link.created_by !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('external_interview_links')
    .update({ is_active: false })
    .eq('id', link.id)

  if (error) {
    console.error('[DELETE /api/interview-links/[token]] update error:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
