import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const DELETE_CONFIRMATION = '削除'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const confirmation =
    typeof body?.confirmation === 'string' ? body.confirmation.trim() : ''

  if (confirmation !== DELETE_CONFIRMATION) {
    return NextResponse.json(
      { error: 'invalid_confirmation' },
      { status: 422 },
    )
  }

  const admin = createAdminClient()

  const { data: avatarFiles, error: listError } = await admin.storage
    .from('avatars')
    .list(user.id, { limit: 100 })

  if (listError) {
    console.error('[account/delete] failed to list avatars', listError)
  } else if (avatarFiles.length > 0) {
    const avatarPaths = avatarFiles
      .map((file) => file.name)
      .filter(Boolean)
      .map((name) => `${user.id}/${name}`)

    if (avatarPaths.length > 0) {
      const { error: removeError } = await admin.storage
        .from('avatars')
        .remove(avatarPaths)

      if (removeError) {
        console.error('[account/delete] failed to remove avatars', removeError)
      }
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    console.error('[account/delete] failed to delete user', error)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
