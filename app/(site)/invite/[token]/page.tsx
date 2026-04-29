import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getCharacter } from '@/lib/characters'

export const metadata: Metadata = {
  title: '取材チームへの招待 | Insight Cast',
}

type InvitationInfo = {
  projectName: string
  role: 'editor' | 'viewer'
  expiresAt: string
}

const claus = getCharacter('claus')

const ROLE_LABELS: Record<string, string> = {
  editor: '編集者（取材・記事生成ができます）',
  viewer: '閲覧者（取材内容・記事の閲覧のみ）',
}

async function getInvitation(token: string): Promise<InvitationInfo | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp'
  try {
    const res = await fetch(`${appUrl}/api/invitations/${token}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json() as Promise<InvitationInfo>
  } catch {
    return null
  }
}

function formatExpiry(isoDate: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invitation = await getInvitation(token)

  if (!invitation) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <div className="mb-6 flex justify-center">
          {claus?.icon96 ? (
            <Image src={claus.icon96} alt="クラウス" width={72} height={72} className="rounded-full" />
          ) : (
            <span className="text-5xl" aria-hidden="true">🦉</span>
          )}
        </div>
        <h1 className="text-xl font-bold text-[var(--text)] mb-3">この招待リンクは無効です</h1>
        <p className="text-sm text-[var(--text2)] mb-8">
          リンクの有効期限が切れているか、すでに使用済みです。
          招待した方にもう一度招待リンクを送ってもらうよう依頼してください。
        </p>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-sm font-semibold text-[var(--text2)] hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          トップページへ
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          {claus?.icon96 ? (
            <Image src={claus.icon96} alt="クラウス" width={72} height={72} className="rounded-full" />
          ) : (
            <span className="text-5xl" aria-hidden="true">🦉</span>
          )}
        </div>
        <h1 className="text-xl font-bold text-[var(--text)] mb-2">
          取材チームに招待されています
        </h1>
        <p className="text-sm text-[var(--text2)]">
          以下の取材先への参加招待が届いています。
        </p>
      </div>

      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase mb-1">取材先</dt>
            <dd className="text-base font-bold text-[var(--text)]">{invitation.projectName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase mb-1">参加後の権限</dt>
            <dd className="text-sm text-[var(--text)]">{ROLE_LABELS[invitation.role] ?? invitation.role}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-[0.08em] text-[var(--text3)] uppercase mb-1">招待の有効期限</dt>
            <dd className="text-sm text-[var(--text2)]">{formatExpiry(invitation.expiresAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href={`/auth/login?invite_token=${token}`}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          ログインして参加する
        </Link>
        <Link
          href={`/auth/signup?invite_token=${token}`}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-sm font-semibold text-[var(--text2)] hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          新規登録して参加する
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--text3)]">
        このメールに心当たりがない場合は、このページを閉じてください。
      </p>
    </main>
  )
}
