import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_INFO } from '@/lib/resend'
import { getUserPlan } from '@/lib/plans'
import { NextRequest, NextResponse } from 'next/server'

const MAX_MEMBERS_PER_PROJECT = 10

type MemberRow = {
  id: string
  user_id: string
  role: string
  created_at: string
  invited_by: string
}

type InvitationRow = {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
}

/**
 * GET /api/projects/[id]/members
 * メンバー一覧 + 招待保留中一覧を返す
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // プロジェクトがオーナー所有かチェック（RLS で弾かれる場合もあるが明示的に確認）
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, user_id')
    .eq('id', projectId)
    .single()

  if (!project) return new Response('Not found', { status: 404 })
  if (project.user_id !== user.id) return new Response('Forbidden', { status: 403 })

  // メンバー一覧取得（オーナー確認済みなので admin client で RLS を経由せず取得）
  const adminSupabase = createAdminClient()

  const [{ data: members }, { data: invitations }] = await Promise.all([
    adminSupabase
      .from('project_members')
      .select('id, user_id, role, created_at, invited_by')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
    adminSupabase
      .from('project_invitations')
      .select('id, email, role, expires_at, created_at')
      .eq('project_id', projectId)
      .eq('accepted', false)
      .order('created_at', { ascending: true }),
  ])

  const memberRows = (members ?? []) as MemberRow[]
  const invitationRows = (invitations ?? []) as InvitationRow[]

  // メンバーのユーザー情報を admin client 経由で取得
  // 注意: listUsers() はデフォルト perPage=50 で auth.users 全件のうち先頭しか返さない。
  // メンバー数 > 50 でなくても、auth ユーザー全体が 50 件を超えていれば
  // 招待されたメンバーが結果に含まれない可能性があるため getUserById で個別取得する。
  const userIds = memberRows.map((m) => m.user_id)
  const userInfoMap = new Map<string, { email: string | null; name: string | null }>()

  if (userIds.length > 0) {
    const userResults = await Promise.all(
      userIds.map((uid) => adminSupabase.auth.admin.getUserById(uid)),
    )
    for (const result of userResults) {
      const u = result.data?.user
      if (u) {
        userInfoMap.set(u.id, {
          email: u.email ?? null,
          name: (u.user_metadata?.full_name as string | undefined) ?? null,
        })
      }
    }
    // profiles テーブルからも名前を補完（auth で見つからなかったメンバーも含めて初期化）
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      const existing = userInfoMap.get(p.id) ?? { email: null, name: null }
      userInfoMap.set(p.id, { ...existing, name: p.name ?? existing.name })
    }
  }

  const enrichedMembers = memberRows.map((m) => {
    const info = userInfoMap.get(m.user_id)
    return {
      id: m.id,
      userId: m.user_id,
      email: info?.email ?? null,
      name: info?.name ?? null,
      role: m.role,
      createdAt: m.created_at,
      invitedBy: m.invited_by,
    }
  })

  const total = enrichedMembers.length + invitationRows.length

  return NextResponse.json({
    members: enrichedMembers,
    invitations: invitationRows,
    total,
    max: MAX_MEMBERS_PER_PROJECT,
  })
}

const PostSchema = z.object({
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']),
})

/**
 * POST /api/projects/[id]/members
 * メールアドレスと role を指定して招待
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // オーナーかつ business プランか確認
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, user_id')
    .eq('id', projectId)
    .single()

  if (!project) return new Response('Not found', { status: 404 })
  if (project.user_id !== user.id) return new Response('Forbidden', { status: 403 })

  const userPlan = await getUserPlan(supabase, user.id)
  if (userPlan !== 'business') {
    return NextResponse.json(
      { error: 'plan_not_supported', message: 'メンバー共有は法人プランのみ利用できます。' },
      { status: 403 },
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }
  const { email, role } = parsed.data

  // 自分自身は招待不可（getUser() で取得済みの email と直接比較。listUsers() 不要）
  if (user.email === email) {
    return NextResponse.json(
      { error: 'self_invite', message: '自分自身は招待できません。' },
      { status: 409 },
    )
  }

  const adminSupabase = createAdminClient()

  // 既に承諾済み招待があるかを project_invitations で確認
  // （listUsers() による全件取得は上限50件制限があり信頼できないため使用しない）
  const { data: existingInvitation } = await adminSupabase
    .from('project_invitations')
    .select('id, accepted')
    .eq('project_id', projectId)
    .eq('email', email)
    .maybeSingle()

  if (existingInvitation?.accepted) {
    // 承諾済み = すでにメンバー
    return NextResponse.json(
      { error: 'already_member', message: 'このユーザーはすでにメンバーです。' },
      { status: 409 },
    )
  }

  if (existingInvitation && !existingInvitation.accepted) {
    // 保留中の招待が既に存在する（後続の upsert で期限・role をリセットする）
    return NextResponse.json(
      { error: 'already_invited', message: 'このメールアドレスはすでに招待中です。' },
      { status: 409 },
    )
  }

  // 上限チェック（承諾済みメンバー + 有効期限内の保留中招待）
  // 期限切れの招待はカウントから除外する
  const [{ count: memberCount }, { count: pendingCount }] = await Promise.all([
    supabase
      .from('project_members')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabase
      .from('project_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString()),
  ])

  const total = (memberCount ?? 0) + (pendingCount ?? 0)
  if (total >= MAX_MEMBERS_PER_PROJECT) {
    return NextResponse.json(
      { error: 'member_limit_reached', message: `プロジェクトあたりのメンバー上限（${MAX_MEMBERS_PER_PROJECT}名）に達しています。` },
      { status: 400 },
    )
  }

  // 招待レコード作成（既にaccepted済みの場合は upsert で再作成）
  const { data: invitation, error: inviteError } = await supabase
    .from('project_invitations')
    .upsert(
      {
        project_id: projectId,
        email,
        role,
        invited_by: user.id,
        accepted: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'project_id,email', ignoreDuplicates: false },
    )
    .select('token')
    .single()

  if (inviteError || !invitation) {
    console.error('[members/POST] invitation insert error:', inviteError?.message)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  // オーナーの名前を取得
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()
  const ownerName = ownerProfile?.name ?? user.email ?? 'オーナー'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp'
  const inviteUrl = `${appUrl}/invite/${invitation.token}`

  // 招待メール送信
  const resend = getResend()
  await resend.emails.send({
    from: FROM_INFO,
    to: email,
    subject: `【Insight Cast】${project.name ?? 'プロジェクト'}への取材チーム招待`,
    html: [
      `<p>${ownerName}さんから <strong>${project.name ?? 'プロジェクト'}</strong> の取材チームに招待されました。</p>`,
      `<p>以下のリンクから参加できます（7日間有効）：</p>`,
      `<p><a href="${inviteUrl}">${inviteUrl}</a></p>`,
      `<p>このメールに心当たりがない場合は、無視してください。</p>`,
    ].join('\n'),
  }).catch((err: unknown) => {
    console.error('[members/POST] resend error:', err)
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
