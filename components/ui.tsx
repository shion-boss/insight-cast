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
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--shape-sm)] border px-5 py-3 text-sm font-semibold leading-tight transition-[colors,transform,opacity] duration-150 active:scale-95 active:opacity-75 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40'

const buttonToneClass = {
  primary: 'border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)] hover:border-[var(--primary-hover)] hover:bg-[var(--primary-hover)]',
  secondary: 'border-[var(--outline)] bg-white text-[var(--on-surface)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
  ghost: 'border-transparent bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] hover:text-[var(--on-surface)]',
} as const

export function getButtonClass(tone: keyof typeof buttonToneClass = 'primary', className?: string) {
  return cx(buttonBaseClass, buttonToneClass[tone], className)
}

const panelBaseClass = 'rounded-[var(--shape-xl)] border border-[var(--outline)] bg-[var(--surface)]'

export function getPanelClass(className?: string) {
  return cx(panelBaseClass, className)
}

export function Breadcrumb({ items }: {
  items: Array<{ label: string; href?: string }>
}) {
  return (
    <nav aria-label="パンくず" className="mb-5 flex items-center gap-1.5 text-xs text-[var(--on-surface-muted)]">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="rounded transition-colors hover:text-[var(--on-surface-variant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--on-surface-variant)]" aria-current={isLast ? 'page' : undefined}>{item.label}</span>
            )}
          </Fragment>
        )
      })}
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
    <Link href={href} className="rounded-[var(--shape-sm)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40">
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
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--on-surface)] uppercase">
            Insight <span className="text-[var(--primary)]">Cast</span>
          </p>
          {subtitle !== false && (
            <p className="hidden text-xs text-[var(--on-surface-variant)] sm:block">{subtitle}</p>
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
    <header className="sticky top-0 z-30 border-b border-[var(--outline)] bg-[rgba(250,246,240,0.93)] backdrop-blur-[16px]">
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
  hideBrand = false,
}: {
  title: ReactNode
  description?: ReactNode
  backHref?: string
  backLabel?: ReactNode
  right?: ReactNode
  homeHref?: string
  hideBrand?: boolean
}) {
  return (
    <HeaderSurface
      bottom={(
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="min-w-0">
            <div className="font-semibold text-[var(--on-surface)]">{title}</div>
            {description && <p className="mt-1 text-sm text-[var(--on-surface-variant)]">{description}</p>}
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
      {hideBrand ? <div /> : <SiteBrand href={homeHref} />}
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
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-[var(--on-surface-variant)]">
      {children}
      {required && (
        <>
          <span className="text-[var(--error)]" aria-hidden="true"> *</span>
          <span className="sr-only">（必須）</span>
        </>
      )}
    </label>
  )
}

export function TextInput(props: ComponentPropsWithoutRef<'input'>) {
  const { className, ...rest } = props

  return (
    <input
      {...rest}
      className={cx(
        'min-h-11 w-full rounded-[var(--shape-sm)] border border-[var(--outline)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--on-surface)] transition-colors duration-150 placeholder:text-[var(--on-surface-muted)] hover:border-[var(--outline-variant)] focus-visible:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 disabled:cursor-not-allowed disabled:bg-[var(--surface-container)] disabled:text-[var(--on-surface-muted)] disabled:hover:border-[var(--outline)]',
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
      'inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary-container)] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[var(--primary)] uppercase',
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
    neutral: 'bg-[var(--surface)] text-[var(--on-surface-variant)] ring-1 ring-[var(--outline)]',
    success: 'bg-[var(--success-container)] text-[var(--success)] ring-1 ring-[var(--success)]/20',
    warning: 'bg-[var(--warning-container)] text-[var(--warning)] ring-1 ring-[var(--warning)]/20',
    info: 'bg-[var(--secondary-container)] text-[var(--secondary)] ring-1 ring-[var(--secondary)]/20',
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
    default: 'border-[var(--outline)] bg-[var(--surface)]',
    soft: 'border-[var(--outline)] bg-[var(--surface-container)]',
    warning: 'border-[var(--warning)]/30 bg-[var(--warning-container)]',
  }[tone]

  return (
    <div className={cx(
      'rounded-[var(--shape-xl)] border p-6',
      toneClass,
      align === 'center' ? 'text-center' : 'text-left',
    )}>
      <div className={cx('text-4xl mb-3', align === 'center' ? '' : 'w-fit')}>{icon}</div>
      <p className="text-base font-semibold text-[var(--on-surface)]">{title}</p>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--on-surface-variant)]">{description}</p>
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
  priority = false,
}: {
  src?: StaticImageData
  alt: string
  emoji?: string
  size?: number
  className?: string
  priority?: boolean
}) {
  return (
    <div
      className={cx(
        'overflow-hidden rounded-full border border-[var(--outline)] bg-[var(--surface)] flex items-center justify-center flex-shrink-0',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" priority={priority} />
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
    ? 'border-[var(--primary-container)] bg-[var(--primary-container)]'
    : 'border-[var(--outline)] bg-[var(--surface)]'
  const pointerClass = tone === 'soft'
    ? 'border-l-[var(--primary-container)] border-b-[var(--primary-container)] bg-[var(--primary-container)]'
    : 'border-l-[var(--outline)] border-b-[var(--outline)] bg-[var(--surface)]'

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
        <div className={cx('rounded-[var(--shape-lg)] border px-5 py-4', bubbleClass)}>
          {name && <p className="text-xs font-medium text-[var(--on-surface-muted)] mb-1">{name}</p>}
          <p className="text-sm font-medium text-[var(--on-surface)] leading-relaxed">{title}</p>
          {description && (
            <p className="text-sm text-[var(--on-surface-variant)] mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
