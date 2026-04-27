import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Fragment } from 'react'
import { CHARACTERS } from '@/lib/characters'

const isDevelopment = process.env.NODE_ENV === 'development'
const featuredCharacters = CHARACTERS.slice(0, 3)

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const buttonBaseClass =
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--r-sm)] border px-5 py-3 text-sm font-semibold leading-tight transition-[colors,transform,opacity] duration-150 active:scale-95 active:opacity-75 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40'

const buttonToneClass = {
  primary: 'border-[var(--accent)] bg-[var(--accent)] text-white hover:border-[var(--accent-h)] hover:bg-[var(--accent-h)]',
  secondary: 'border-[var(--border)] bg-white text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
  ghost: 'border-transparent bg-transparent text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)]',
} as const

export function getButtonClass(tone: keyof typeof buttonToneClass = 'primary', className?: string) {
  return cx(buttonBaseClass, buttonToneClass[tone], className)
}

const panelBaseClass = 'rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)]'

export function getPanelClass(className?: string) {
  return cx(panelBaseClass, className)
}

export function Breadcrumb({ items }: {
  items: Array<{ label: string; href?: string }>
}) {
  return (
    <nav aria-label="パンくず" className="mb-5 flex items-center gap-1.5 text-xs text-[var(--text3)]">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span>/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="rounded transition-colors hover:text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--text2)]">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}

export function DevAiLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  if (!isDevelopment) return null
  return (
    <span aria-hidden="true" className={cx('inline-flex items-center gap-1', className)}>
      <span>✨</span>
      <span>{children}</span>
    </span>
  )
}

export function SiteBrand({
  href = '/',
  subtitle = 'AI取材で、ホームページの伝わり方を育てる',
}: {
  href?: string
  subtitle?: ReactNode | false
}) {
  return (
    <Link href={href} className="rounded-[var(--r-sm)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {featuredCharacters.map((char) => (
            <CharacterAvatar
              key={char.id}
              src={char.icon48}
              alt={`${char.name}のアイコン`}
              emoji={char.emoji}
              size={34}
              className="border-[var(--surface)]"
            />
          ))}
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--text)] uppercase">
            Insight <span className="text-[var(--accent)]">Cast</span>
          </p>
          {subtitle !== false && (
            <p className="hidden text-xs text-[var(--text2)] sm:block">{subtitle}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export function HeaderSurface({
  children,
  bottom,
}: {
  children: ReactNode
  bottom?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(250,246,240,0.93)] backdrop-blur-[16px]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-[62px] items-center justify-between gap-4">
          {children}
        </div>
        {bottom}
      </div>
    </header>
  )
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = '← 戻る',
  right,
  homeHref = '/dashboard',
}: {
  title: ReactNode
  description?: ReactNode
  backHref?: string
  backLabel?: ReactNode
  right?: ReactNode
  homeHref?: string
}) {
  return (
    <HeaderSurface
      bottom={(
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="min-w-0">
            <div className="font-semibold text-[var(--text)]">{title}</div>
            {description && <p className="mt-1 text-sm text-[var(--text2)]">{description}</p>}
          </div>
          {backHref ? (
            <Link
              href={backHref}
              className={getButtonClass('secondary', 'rounded-full px-4 py-2 text-sm font-medium')}
            >
              {backLabel}
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}
    >
      <SiteBrand href={homeHref} />
      {right ?? <div />}
    </HeaderSurface>
  )
}

export function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: ReactNode
  required?: boolean
  htmlFor?: string
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-[var(--text2)]">
      {children}
      {required && <span className="text-[var(--err)]"> *</span>}
    </label>
  )
}

export function TextInput(props: ComponentPropsWithoutRef<'input'>) {
  const { className, ...rest } = props

  return (
    <input
      {...rest}
      className={cx(
        'min-h-11 w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 placeholder:text-[var(--text3)] hover:border-[var(--border2)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:bg-[var(--bg2)] disabled:text-[var(--text3)] disabled:hover:border-[var(--border)]',
        className,
      )}
    />
  )
}

export function PrimaryButton(props: ComponentPropsWithoutRef<'button'>) {
  const { className, type = 'button', ...rest } = props

  return (
    <button
      type={type}
      {...rest}
      className={cx('cursor-pointer', getButtonClass('primary', className))}
    />
  )
}

export function SecondaryButton(props: ComponentPropsWithoutRef<'button'>) {
  const { className, type = 'button', ...rest } = props

  return (
    <button
      type={type}
      {...rest}
      className={cx('cursor-pointer font-medium', getButtonClass('secondary', className))}
    />
  )
}

export function ButtonLink({
  href,
  children,
  className,
  tone = 'primary',
}: {
  href: string
  children: ReactNode
  className?: string
  tone?: 'primary' | 'secondary' | 'ghost'
}) {
  return (
    <Link
      href={href}
      className={getButtonClass(tone, className)}
    >
      {children}
    </Link>
  )
}

export function EyebrowBadge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx(
      'inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent-l)] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[var(--accent)] uppercase',
      className,
    )}>
      {children}
    </div>
  )
}

export function StatusPill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'info'
  className?: string
}) {
  const toneClass = {
    neutral: 'bg-[var(--surface)] text-[var(--text2)] ring-1 ring-[var(--border)]',
    success: 'bg-[var(--ok-l)] text-[var(--ok)] ring-1 ring-[var(--ok)]/20',
    warning: 'bg-[var(--warn-l)] text-[var(--warn)] ring-1 ring-[var(--warn)]/20',
    info: 'bg-[var(--teal-l)] text-[var(--teal)] ring-1 ring-[var(--teal)]/20',
  }[tone]

  return (
    <span className={cx('inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium', toneClass, className)}>
      {children}
    </span>
  )
}

export function StateCard({
  icon,
  title,
  description,
  tone = 'default',
  align = 'center',
  action,
}: {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  tone?: 'default' | 'soft' | 'warning'
  align?: 'center' | 'left'
  action?: ReactNode
}) {
  const toneClass = {
    default: 'border-[var(--border)] bg-[var(--surface)]',
    soft: 'border-[var(--border)] bg-[var(--bg2)]',
    warning: 'border-[var(--warn)]/30 bg-[var(--warn-l)]',
  }[tone]

  return (
    <div className={cx(
      'rounded-[var(--r-xl)] border p-6',
      toneClass,
      align === 'center' ? 'text-center' : 'text-left',
    )}>
      <div className={cx('text-4xl mb-3', align === 'center' ? '' : 'w-fit')}>{icon}</div>
      <p className="text-base font-semibold text-[var(--text)]">{title}</p>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function CharacterAvatar({
  src,
  alt,
  emoji,
  size = 40,
  className,
}: {
  src?: StaticImageData
  alt: string
  emoji?: string
  size?: number
  className?: string
}) {
  return (
    <div
      className={cx(
        'overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center flex-shrink-0',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span className="text-lg" aria-hidden="true">{emoji ?? '🙂'}</span>
      )}
    </div>
  )
}

export function InterviewerSpeech({
  icon,
  name,
  title,
  description,
  tone = 'default',
}: {
  icon: ReactNode
  name?: ReactNode
  title: ReactNode
  description?: ReactNode
  tone?: 'default' | 'soft'
}) {
  const bubbleClass = tone === 'soft'
    ? 'border-[var(--accent-l)] bg-[var(--accent-l)]'
    : 'border-[var(--border)] bg-[var(--surface)]'
  const pointerClass = tone === 'soft'
    ? 'border-l-[var(--accent-l)] border-b-[var(--accent-l)] bg-[var(--accent-l)]'
    : 'border-l-[var(--border)] border-b-[var(--border)] bg-[var(--surface)]'

  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="relative min-w-0 flex-1">
        <div
          className={cx(
            'absolute left-0 top-4 h-3 w-3 -translate-x-[7px] rotate-45 border-l border-b',
            pointerClass,
          )}
          aria-hidden="true"
        />
        <div className={cx('rounded-[var(--r-lg)] border px-5 py-4', bubbleClass)}>
          {name && <p className="text-xs font-medium text-[var(--text3)] mb-1">{name}</p>}
          <p className="text-sm font-medium text-[var(--text)] leading-relaxed">{title}</p>
          {description && (
            <p className="text-sm text-[var(--text2)] mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
