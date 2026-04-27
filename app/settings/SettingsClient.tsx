'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import {
  CharacterAvatar,
  TextInput,
  getButtonClass,
} from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import {
  type NotificationPreferences,
} from '@/lib/notification-preferences'
import { getPlanLimits, type PlanKey } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'

type Section = 'アカウント' | 'ご利用プラン' | '通知' | 'セキュリティ'

type NotificationKey = keyof NotificationPreferences

const SECTIONS: Section[] = ['アカウント', 'ご利用プラン', '通知', 'セキュリティ']

const NOTIFICATIONS: Array<{
  key: NotificationKey
  label: string
  desc: string
}> = [
  {
    key: 'interviewComplete',
    label: '取材完了の通知',
    desc: 'AIキャストによる取材が完了したときにメールを受け取る',
  },
  {
    key: 'articleReady',
    label: '記事素材のお知らせ',
    desc: '記事素材が届いたときにメールを受け取る',
  },
  {
    key: 'monthlyReport',
    label: '月次利用レポート',
    desc: '月末に利用状況のサマリーを受け取る',
  },
  {
    key: 'productUpdates',
    label: 'サービスのお知らせ',
    desc: '新機能・キャスト追加などのお知らせを受け取る',
  },
] as const

function Toggle({
  on,
  onToggle,
  disabled = false,
  label,
}: {
  on: boolean
  onToggle: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: on ? 'var(--accent)' : 'var(--border)' }}
    >
      <span
        className="absolute top-[3px] block h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-[left] duration-200"
        style={{ left: on ? '23px' : '3px' }}
      />
    </button>
  )
}

function areNotificationPreferencesEqual(
  left: NotificationPreferences,
  right: NotificationPreferences,
) {
  return (
    left.interviewComplete === right.interviewComplete &&
    left.articleReady === right.articleReady &&
    left.monthlyReport === right.monthlyReport &&
    left.productUpdates === right.productUpdates
  )
}

type Props = {
  initialName: string
  email: string
  planKey: PlanKey
  avatarUrl: string | null
  initialNotifications: NotificationPreferences
  userId: string
  isAdmin: boolean
  interviewCount: number
  projectCount: number
  isEmailUser: boolean
}

export function SettingsClient({
  initialName,
  email,
  planKey,
  avatarUrl: initialAvatarUrl,
  initialNotifications,
  userId,
  isAdmin,
  interviewCount,
  projectCount,
  isEmailUser,
}: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [name, setName] = useState(initialName)
  const [savedName, setSavedName] = useState(initialName)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [notifications, setNotifications] = useState<NotificationPreferences>(initialNotifications)
  const [savedNotifications, setSavedNotifications] = useState<NotificationPreferences>(initialNotifications)
  const [activeSection, setActiveSection] = useState<Section>('アカウント')

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [notificationSaved, setNotificationSaved] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleProfileSave() {
    setProfileError(null)
    setProfileSaving(true)

    const nextName = name.trim().slice(0, 100)
    if (!nextName) {
      setProfileError('表示名を入力してください。')
      setProfileSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ name: nextName })
      .eq('id', userId)

    if (error) {
      setProfileError('保存できませんでした。通信状況を確認して、もう一度お試しください。')
      setProfileSaving(false)
      return
    }

    setSavedName(nextName)
    setProfileSaving(false)
    setProfileSaved(true)
    window.setTimeout(() => setProfileSaved(false), 2000)
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('画像ファイルを選択してください。')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('画像は 2MB 以下にしてください。')
      return
    }

    setAvatarUploading(true)
    setAvatarError(null)

    const fileExt = file.name.includes('.') ? file.name.split('.').pop() : ''
    const filePath = `${userId}/avatar${fileExt ? `.${fileExt.toLowerCase()}` : ''}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      setAvatarError('アイコンを更新できませんでした。時間をおいてもう一度お試しください。')
      setAvatarUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    const nextAvatarUrl = `${publicUrl}?v=${Date.now()}`

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: nextAvatarUrl })
      .eq('id', userId)

    if (profileError) {
      setAvatarError('アイコンを保存できませんでした。時間をおいてもう一度お試しください。')
      setAvatarUploading(false)
      return
    }

    setAvatarUrl(nextAvatarUrl)
    setAvatarUploading(false)
  }

  async function handleNotificationSave() {
    setNotificationError(null)
    setNotificationSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: notifications })
      .eq('id', userId)

    if (error) {
      setNotificationError('通知設定を保存できませんでした。もう一度お試しください。')
      setNotificationSaving(false)
      return
    }

    setSavedNotifications(notifications)
    setNotificationSaving(false)
    setNotificationSaved(true)
    window.setTimeout(() => setNotificationSaved(false), 2000)
  }

  async function handlePasswordSave() {
    setPasswordError(null)

    if (password.length < 8) {
      setPasswordError('新しいパスワードは 8 文字以上で入力してください。')
      return
    }

    if (password !== passwordConfirm) {
      setPasswordError('確認用パスワードが一致していません。')
      return
    }

    setPasswordSaving(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setPasswordError('パスワードを更新できませんでした。もう一度お試しください。')
      setPasswordSaving(false)
      return
    }

    setPassword('')
    setPasswordConfirm('')
    setPasswordSaving(false)
    setPasswordSaved(true)
    window.setTimeout(() => setPasswordSaved(false), 2000)
  }

  async function handleEmailSave() {
    setEmailError(null)

    const trimmed = newEmail.trim()
    if (!trimmed) {
      setEmailError('新しいメールアドレスを入力してください。')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('メールアドレスの形式が正しくありません。')
      return
    }
    if (trimmed === email) {
      setEmailError('現在と同じメールアドレスです。')
      return
    }

    setEmailSaving(true)

    const { error } = await supabase.auth.updateUser({ email: trimmed })

    if (error) {
      setEmailError('メールアドレスを変更できませんでした。もう一度お試しください。')
      setEmailSaving(false)
      return
    }

    setEmailSaving(false)
    setEmailSaved(true)
    setNewEmail('')
  }

  async function handleDeleteAccount() {
    setDeleteError(null)

    if (deleteConfirmation.trim() !== '削除') {
      setDeleteError('確認のため「削除」と入力してください。')
      return
    }

    setDeletePending(true)

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ confirmation: deleteConfirmation.trim() }),
      })

      if (!response.ok) {
        setDeleteError('アカウントを削除できませんでした。時間をおいてもう一度お試しください。')
        setDeletePending(false)
        return
      }

      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch {
      setDeleteError('通信に失敗しました。時間をおいてもう一度お試しください。')
      setDeletePending(false)
    }
  }

  const mint = getCharacter('mint')
  const hasUnsavedProfileChanges = name.trim() !== savedName.trim()
  const hasUnsavedNotificationChanges = !areNotificationPreferencesEqual(
    notifications,
    savedNotifications,
  )
  const profileInputsDisabled = profileSaving
  const notificationInputsDisabled = notificationSaving
  const passwordInputsDisabled = passwordSaving
  const accountInitial = (name.trim() || email || '設').charAt(0).toUpperCase()
  const plan = getPlanLimits(planKey)
  const nextPlan = planKey === 'free' ? getPlanLimits('lightning')
    : planKey === 'lightning' ? getPlanLimits('personal')
    : planKey === 'personal' ? getPlanLimits('business')
    : null

  return (
    <AppShell title="設定" active="settings" accountLabel={name.trim() || email || '設定'} isAdmin={isAdmin}>
      <div className="grid items-start gap-8 lg:grid-cols-[200px_1fr]">
        <nav role="tablist" aria-label="設定セクション" className="flex flex-row gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:top-20 lg:flex-col">
          {SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              role="tab"
              aria-selected={activeSection === section}
              onClick={() => setActiveSection(section)}
              className={`whitespace-nowrap rounded-[var(--r-sm)] border-b-2 lg:border-b-0 lg:border-l-2 px-2.5 py-2 sm:px-3 sm:py-2.5 text-left text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                activeSection === section
                  ? 'border-[var(--accent)] bg-[var(--accent-l)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)]'
              }`}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="space-y-5">
          {activeSection === 'アカウント' && (
            <>
              <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-7">
                <h2 className="mb-1 text-lg font-bold text-[var(--text)]">
                  アカウント情報
                </h2>
                <p className="mb-6 text-xs text-[var(--text3)]">表示名、メールアドレス、アイコンを管理します</p>

                <div className="mb-6 flex flex-col gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--border)] bg-[var(--accent-l)] text-2xl font-bold text-[var(--accent)]"
                      aria-label={avatarUrl ? '現在のアイコン画像' : '現在のアイコン'}
                      role="img"
                      style={avatarUrl ? {
                        backgroundImage: `url(${avatarUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: 'transparent',
                      } : undefined}
                    >
                      {accountInitial}
                    </div>
                    <div>
                      <p className="mb-1 font-semibold text-[var(--text)]">{name.trim() || '名前未設定'}</p>
                      <p className="text-xs text-[var(--text3)]">{email || 'メールアドレス未設定'}</p>
                    </div>
                  </div>

                  <div className="sm:ml-auto">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className={getButtonClass('secondary', 'px-4 py-2 text-sm')}
                    >
                      {avatarUploading ? 'アップロード中...' : 'アイコンを変更'}
                    </button>
                    <p className="mt-2 text-xs text-[var(--text3)]">画像は 2MB 以下、正方形がおすすめです。</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="settings-name" className="mb-1.5 block text-sm font-semibold text-[var(--text)]">表示名</label>
                    <TextInput
                      id="settings-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="例: 山田 太郎"
                      maxLength={100}
                      disabled={profileInputsDisabled}
                    />
                  </div>
                </div>

                {(profileError || avatarError) && (
                  <div role="alert" className="mt-4 flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3">
                    <CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'ミント'}のアイコン`} emoji={mint?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--err)]">{avatarError ?? profileError}</p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileSaving || !hasUnsavedProfileChanges}
                    className={getButtonClass('primary', 'px-4 py-2 text-sm')}
                  >
                    {profileSaving ? '保存中...' : '変更を保存する'}
                  </button>
                  {profileSaved && (
                    <span role="status" className="text-sm font-semibold text-[var(--teal)]">保存しました</span>
                  )}
                </div>
              </section>

              {isEmailUser && <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-7">
                <h2 className="mb-1 text-lg font-bold text-[var(--text)]">
                  メールアドレスの変更
                </h2>
                <p className="mb-5 text-xs text-[var(--text3)]">現在: {email || '未設定'}</p>

                {emailSaved ? (
                  <div className="rounded-xl bg-[var(--accent-l)] border border-[rgba(194,114,42,0.25)] px-5 py-4 text-sm leading-relaxed text-[var(--text2)]">
                    <p className="font-semibold text-[var(--accent)] mb-1">確認メールを送りました</p>
                    <p>新しいメールアドレス宛に確認リンクを送りました。リンクをクリックすると変更が完了します。</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="settings-new-email" className="mb-1.5 block text-sm font-semibold text-[var(--text)]">新しいメールアドレス</label>
                        <TextInput
                          id="settings-new-email"
                          type="email"
                          value={newEmail}
                          onChange={(event) => setNewEmail(event.target.value)}
                          placeholder="new@example.com"
                          disabled={emailSaving}
                        />
                      </div>
                    </div>

                    {emailError && (
                      <div role="alert" className="mt-4 flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3">
                        <CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'ミント'}のアイコン`} emoji={mint?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[var(--err)]">{emailError}</p>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleEmailSave}
                        disabled={emailSaving || !newEmail.trim()}
                        className={getButtonClass('primary', 'px-4 py-2 text-sm')}
                      >
                        {emailSaving ? '送信中...' : '確認メールを送る'}
                      </button>
                    </div>
                  </>
                )}
              </section>}

              <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-7">
                <h2 className="mb-1 text-lg font-bold text-[var(--text)]">
                  アカウントを削除
                </h2>
                <p className="mb-5 text-xs text-[var(--text3)]">この操作は取り消せません</p>

                <div className="rounded-xl border border-[var(--err-l)] p-5">
                  <h3 className="mb-1.5 font-semibold text-[var(--err)]">アカウントを完全に削除する</h3>
                  <p className="mb-4 text-sm leading-[1.75] text-[var(--text2)]">
                    取材先、取材メモ、記事素材、プロフィール情報を含むアカウント全体を完全に削除します。確認のため、下に「削除」と入力してください。
                  </p>

                  <label htmlFor="settings-delete-confirm" className="sr-only">「削除」と入力して確認</label>
                  <TextInput
                    id="settings-delete-confirm"
                    type="text"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    placeholder="削除"
                    className="max-w-xs"
                    disabled={deletePending}
                  />

                  {deleteError && (
                    <div role="alert" className="mt-4 flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3">
                      <CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'ミント'}のアイコン`} emoji={mint?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[var(--err)]">{deleteError}</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deletePending}
                      className="inline-flex min-h-11 items-center justify-center rounded-[var(--r-sm)] border border-[var(--err)] bg-[var(--err)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
                    >
                      {deletePending ? '削除中...' : 'アカウントを削除する'}
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeSection === 'ご利用プラン' && (
            <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-7">
              <h2 className="mb-1 text-lg font-bold text-[var(--text)]">
                現在のプラン
              </h2>
              <p className="mb-6 text-xs text-[var(--text3)]">現在の契約内容と利用上限を確認できます</p>

              <div className="mb-5 flex flex-col gap-4 rounded-xl border border-[rgba(194,114,42,0.25)] bg-[var(--accent-l)] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                    Current Plan
                  </p>
                  <p className="text-xl font-bold text-[var(--accent)]">
                    {plan.label}
                  </p>
                </div>
                <Link href="/settings/billing" className={getButtonClass('primary', 'px-4 py-2 text-sm')}>
                  お支払い・解約の管理
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: '今月の取材回数', value: `${interviewCount} 回` },
                  plan.lifetimeInterviewLimit !== null
                    ? { label: 'お試し取材', value: `${plan.lifetimeInterviewLimit} 回` }
                    : { label: '月間取材上限', value: `${plan.monthlyInterviewLimit} 回` },
                  { label: '取材先上限', value: `${plan.maxProjects} 件` },
                  { label: '競合調査', value: `各取材先 ${plan.maxCompetitorsPerProject} 社` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-[var(--bg2)] px-4 py-4">
                    <p className="text-xs text-[var(--text3)]">{item.label}</p>
                    <p className="mt-2 text-xl font-bold text-[var(--text)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-[var(--bg2)] p-4">
                <p className="mb-3 text-sm font-semibold text-[var(--text)]">現在の利用状況</p>
                <div className="space-y-2 text-sm text-[var(--text2)]">
                  <div className="flex items-center justify-between gap-4">
                    <span>登録済みの取材先</span>
                    <span className="font-semibold text-[var(--text)]">
                      {projectCount} / {plan.maxProjects} 件
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>サポート</span>
                    <span className="font-semibold text-[var(--text)]">{plan.supportLabel}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--border)] p-5">
                <p className="mb-3 text-sm font-semibold text-[var(--text)]">
                  {nextPlan ? `${nextPlan.label}にすると` : '現在ご利用中のプランです'}
                </p>
                {nextPlan ? (
                  <>
                    <div className="space-y-2">
                      {[
                        nextPlan.maxProjects !== plan.maxProjects && `取材先を最大 ${nextPlan.maxProjects} 件まで登録`,
                        nextPlan.monthlyInterviewLimit !== plan.monthlyInterviewLimit && `月 ${nextPlan.monthlyInterviewLimit} 回まで取材`,
                        nextPlan.maxCompetitorsPerProject !== plan.maxCompetitorsPerProject && `競合調査を各取材先 ${nextPlan.maxCompetitorsPerProject} 社まで`,
                        nextPlan.supportLabel !== plan.supportLabel && `${nextPlan.supportLabel}が利用可能`,
                      ].filter(Boolean).map((feature) => (
                        <div key={String(feature)} className="flex items-center gap-2 text-sm text-[var(--text2)]">
                          <span aria-hidden="true" className="font-bold text-[var(--teal)]">✓</span>
                          {feature}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/api/stripe/checkout-redirect?plan=${nextPlan.key}`}
                        className={getButtonClass('primary', 'px-4 py-2 text-sm')}
                      >
                        {nextPlan.label}にアップグレード <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-sm leading-[1.75] text-[var(--text2)]">
                    法人向けプランをご利用中です。最新の料金や内容は料金ページで確認できます。
                  </p>
                )}
              </div>
            </section>
          )}

          {activeSection === '通知' && (
            <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-7">
              <h2 className="mb-1 text-lg font-bold text-[var(--text)]">
                通知設定
              </h2>
              <p className="mb-5 text-xs text-[var(--text3)]">メール通知の受信設定を保存できます</p>

              <div className="space-y-0">
                {NOTIFICATIONS.map((notification, index) => (
                  <div
                    key={notification.key}
                    className={`flex items-center justify-between gap-4 py-4 ${
                      index > 0 ? 'border-t border-[var(--border)]' : ''
                    }`}
                  >
                    <div>
                      <p className="mb-0.5 text-sm font-semibold text-[var(--text)]">{notification.label}</p>
                      <p className="text-xs text-[var(--text3)]">{notification.desc}</p>
                    </div>
                    <Toggle
                      on={notifications[notification.key]}
                      disabled={notificationInputsDisabled}
                      label={notification.label}
                      onToggle={() =>
                        setNotifications((current) => ({
                          ...current,
                          [notification.key]: !current[notification.key],
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              {notificationError && (
                <div role="alert" className="mt-4 flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3">
                  <CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'ミント'}のアイコン`} emoji={mint?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--err)]">{notificationError}</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleNotificationSave}
                  disabled={notificationSaving || !hasUnsavedNotificationChanges}
                  className={getButtonClass('primary', 'px-4 py-2 text-sm')}
                >
                  {notificationSaving ? '保存中...' : '通知設定を保存する'}
                </button>
                {notificationSaved && (
                  <span role="status" className="text-sm font-semibold text-[var(--teal)]">保存しました</span>
                )}
              </div>
            </section>
          )}

          {activeSection === 'セキュリティ' && (
            <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-7">
              <h2 className="mb-1 text-lg font-bold text-[var(--text)]">
                セキュリティ
              </h2>
              <p className="mb-6 text-xs text-[var(--text3)]">ログイン中のアカウントのパスワードを更新できます</p>

              {!isEmailUser ? (
                <p className="rounded-xl border border-[var(--border)] bg-[var(--bg2)] p-5 text-sm text-[var(--text3)]">
                  Googleアカウントでログイン中のため、パスワードの設定はありません。
                </p>
              ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)] p-5">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="settings-password" className="mb-1.5 block text-sm font-semibold text-[var(--text)]">新しいパスワード</label>
                    <TextInput
                      id="settings-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="8文字以上"
                      disabled={passwordInputsDisabled}
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-password-confirm" className="mb-1.5 block text-sm font-semibold text-[var(--text)]">確認用パスワード</label>
                    <TextInput
                      id="settings-password-confirm"
                      type="password"
                      autoComplete="new-password"
                      value={passwordConfirm}
                      onChange={(event) => setPasswordConfirm(event.target.value)}
                      placeholder="もう一度入力"
                      disabled={passwordInputsDisabled}
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs leading-6 text-[var(--text3)]">
                  現在ログイン中のため、確認メールなしで更新されます。共有端末では更新後にログアウトしてください。
                </p>

                {passwordError && (
                  <div role="alert" className="mt-4 flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3">
                    <CharacterAvatar src={mint?.icon48} alt={`${mint?.name ?? 'ミント'}のアイコン`} emoji={mint?.emoji} size={32} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--err)]">{passwordError}</p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePasswordSave}
                    disabled={passwordSaving || !password || !passwordConfirm}
                    className={getButtonClass('primary', 'px-4 py-2 text-sm')}
                  >
                    {passwordSaving ? '更新中...' : 'パスワードを変更する'}
                  </button>
                  {passwordSaved && (
                    <span role="status" className="text-sm font-semibold text-[var(--teal)]">パスワードを更新しました</span>
                  )}
                </div>
              </div>
              )}
            </section>
          )}
        </div>
      </div>
    </AppShell>
  )
}
