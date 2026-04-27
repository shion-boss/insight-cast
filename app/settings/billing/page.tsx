import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { CharacterAvatar, InterviewerSpeech, getButtonClass } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { PortalButton } from '@/app/settings/PortalButton'

const PLAN_LABELS: Record<string, string> = {
  free: 'お試し（無料）',
  personal: '個人向け',
  business: '法人向け',
}

const STATUS_LABELS: Record<string, string> = {
  active: '有効',
  canceled: '解約済み',
  past_due: '支払い遅延',
  trialing: 'トライアル中',
  incomplete: '未完了',
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  const params = await searchParams
  const isSuccess = params.success === '1'

  const mint = getCharacter('mint')
  const planLabel = PLAN_LABELS[sub?.plan ?? 'free'] ?? 'お試し（無料）'
  const statusLabel = STATUS_LABELS[sub?.status ?? 'active'] ?? '有効'
  const isPaid = sub?.plan === 'personal' || sub?.plan === 'business'
  const hasCustomer = Boolean(sub?.stripe_customer_id)

  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <AppShell title="ご利用プラン" active="settings" accountLabel={user.email ?? '設定'}>
      <div className="max-w-2xl space-y-5">
        {isSuccess && (
          <div className="rounded-[var(--r-lg)] border border-[var(--teal)] bg-[color-mix(in_srgb,var(--teal)_8%,transparent)] p-5">
            <InterviewerSpeech
              icon={
                <CharacterAvatar
                  src={mint?.icon48}
                  alt={`${mint?.name ?? 'ミント'}のアイコン`}
                  emoji={mint?.emoji}
                  size={48}
                />
              }
              name={mint?.name ?? 'ミント'}
              title="お支払いが完了しました。"
              description="プランが切り替わりました。引き続きご利用ください。"
              tone="soft"
            />
          </div>
        )}

        {/* 現在のプラン */}
        <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-7">
          <h2 className="mb-1 text-lg font-bold text-[var(--text)]">
            現在のプラン
          </h2>
          <p className="mb-6 text-xs text-[var(--text3)]">契約中のプランと請求サイクルを確認できます</p>

          <div className="mb-5 flex flex-col gap-4 rounded-xl border border-[rgba(194,114,42,0.25)] bg-[var(--accent-l)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                Current Plan
              </p>
              <p className="text-xl font-bold text-[var(--accent)]">
                {planLabel}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                sub?.status === 'active' || sub?.status === 'trialing'
                  ? 'bg-[color-mix(in_srgb,var(--teal)_15%,transparent)] text-[var(--teal)]'
                  : 'bg-[var(--err-l)] text-[var(--err)]'
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            {periodEnd && (
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--bg2)] px-4 py-3">
                <span className="text-[var(--text2)]">
                  {sub?.status === 'canceled' ? 'プラン終了日' : '次回請求日'}
                </span>
                <span className="font-semibold text-[var(--text)]">{periodEnd}</span>
              </div>
            )}
            {!isPaid && (
              <div className="rounded-xl bg-[var(--bg2)] px-4 py-3 text-[var(--text2)]">
                <p className="text-sm leading-[1.75]">
                  個人向け・法人向けプランにすると、取材回数が増え、より多くの取材先を管理できます。
                </p>
                <Link
                  href="/pricing"
                  className={getButtonClass('primary', 'mt-3 px-4 py-2 text-sm')}
                >
                  料金プランを見る
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 支払い管理 */}
        {isPaid && hasCustomer && (
          <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-7">
            <h2 className="mb-1 text-lg font-bold text-[var(--text)]">
              支払い管理
            </h2>
            <p className="mb-5 text-xs text-[var(--text3)]">
              カード情報の変更・プランの変更・解約はこちらから行えます
            </p>
            <PortalButton />
          </section>
        )}

        <div className="text-center">
          <Link
            href="/settings"
            className="text-sm text-[var(--text3)] hover:text-[var(--text)] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            ← 設定に戻る
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
