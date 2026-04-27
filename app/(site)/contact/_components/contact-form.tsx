'use client'

import { useState } from 'react'
import { CharacterAvatar, InterviewerSpeech, FieldLabel, TextInput, getButtonClass } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type FieldErrors = {
  name?: string
  email?: string
  message?: string
}

export function ContactForm() {
  const mint = getCharacter('mint')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [industry, setIndustry] = useState('')
  const [hpUrl, setHpUrl] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [serverMessage, setServerMessage] = useState('')
  const [startedAt] = useState(() => Date.now())
  const [website, setWebsite] = useState('')

  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    if (!name.trim()) errors.name = 'お名前を入力してください'
    if (!email.trim()) {
      errors.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '正しいメールアドレスを入力してください'
    }
    if (!message.trim()) errors.message = 'ご相談内容を入力してください'
    return errors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setServerMessage('')
    setStatus('loading')

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 15000)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          name,
          email,
          message,
          referralSource,
          industry,
          hpUrl,
          website,
          startedAt,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const apiMessage = typeof json?.message === 'string' && json.message
          ? json.message
          : '送信できませんでした。時間をおいてもう一度お試しください。'
        throw new Error(apiMessage)
      }
      setStatus('success')
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'AbortError'
          ? '送信がタイムアウトしました。時間をおいて再度お試しください。'
          : error instanceof Error
            ? error.message
            : '送信できませんでした。時間をおいてもう一度お試しください。'
      setServerMessage(message)
      setStatus('error')
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-8">
        <InterviewerSpeech
          icon={
            <CharacterAvatar
              src={mint?.icon96}
              alt="ミントのアイコン"
              emoji={mint?.emoji}
              size={48}
            />
          }
          name="ミント"
          title="送信しました。2営業日以内にご返信します。"
          description="ご相談ありがとうございます。しばらくお待ちください。"
          tone="soft"
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* お名前 */}
      <div>
        <FieldLabel required htmlFor="contact-name">お名前</FieldLabel>
        <TextInput
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })) }}
          placeholder="山田 花子"
          maxLength={100}
          autoComplete="name"
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? 'err-name' : undefined}
        />
        {fieldErrors.name && (
          <p id="err-name" className="mt-1 text-xs text-[var(--err)]">{fieldErrors.name}</p>
        )}
      </div>

      {/* メールアドレス */}
      <div>
        <FieldLabel required htmlFor="contact-email">メールアドレス</FieldLabel>
        <TextInput
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
          placeholder="example@example.com"
          autoComplete="email"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'err-email' : undefined}
        />
        {fieldErrors.email && (
          <p id="err-email" className="mt-1 text-xs text-[var(--err)]">{fieldErrors.email}</p>
        )}
      </div>

      {/* どこでお知りになりましたか */}
      <div>
        <FieldLabel htmlFor="contact-referral">どこでお知りになりましたか？（任意）</FieldLabel>
        <select
          id="contact-referral"
          value={referralSource}
          onChange={(e) => setReferralSource(e.target.value)}
          className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 hover:border-[var(--border2)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          <option value="">選択してください（任意）</option>
          <option value="search">検索（Google など）</option>
          <option value="sns">SNS（X / Instagram など）</option>
          <option value="referral">知人・紹介</option>
          <option value="other">その他</option>
        </select>
      </div>

      {/* 業種 */}
      <div>
        <FieldLabel htmlFor="contact-industry">業種（任意）</FieldLabel>
        <TextInput
          id="contact-industry"
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="例: 整体院、建設業、税理士事務所"
        />
      </div>

      {/* 現在のHP URL */}
      <div>
        <FieldLabel htmlFor="contact-hp-url">現在のホームページURL（任意）</FieldLabel>
        <TextInput
          id="contact-hp-url"
          type="text"
          value={hpUrl}
          onChange={(e) => setHpUrl(e.target.value)}
          placeholder="https://example.com"
          autoComplete="url"
        />
      </div>

      {/* ご相談内容 */}
      <div>
        <FieldLabel required htmlFor="contact-message">ご質問・ご相談内容</FieldLabel>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => { setMessage(e.target.value); setFieldErrors((p) => ({ ...p, message: undefined })) }}
          rows={5}
          maxLength={5000}
          placeholder="どんな小さなことでも大丈夫です。気になっていることを教えてください。"
          aria-invalid={!!fieldErrors.message}
          aria-describedby={fieldErrors.message ? 'err-message' : undefined}
          className={cx(
            'min-h-[120px] w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 placeholder:text-[var(--text3)] hover:border-[var(--border2)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 resize-y',
          )}
        />
        {fieldErrors.message && (
          <p id="err-message" className="mt-1 text-xs text-[var(--err)]">{fieldErrors.message}</p>
        )}
      </div>

      {/* エラー通知 */}
      {status === 'error' && (
        <div role="alert" className="flex items-start gap-3 rounded-[var(--r-lg)] border border-[var(--warn)]/30 bg-[var(--warn-l)] px-4 py-3">
          <CharacterAvatar
            src={mint?.icon48}
            alt="ミントのアイコン"
            emoji={mint?.emoji}
            size={32}
          />
          <p className="text-sm text-[var(--text2)]">
            {serverMessage || '送信できませんでした。時間をおいて再度お試しください。'}
          </p>
        </div>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className={cx(getButtonClass('primary', 'w-full'))}
      >
        {status === 'loading' ? '送信中...' : '送信する'}
      </button>
    </form>
  )
}
