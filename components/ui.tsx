import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { CHARACTERS } from '@/lib/characters'

const isDevelopment = process.env.NODE_ENV === 'development'
const featuredCharacters = CHARACTERS.slice(0, 3)

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const buttonBaseClass =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border px-5 py-3.5 text-sm font-semibold leading-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40'

const buttonToneClass = {
  primary: 'border-stone-950 bg-stone-950 text-white hover:border-stone-800 hover:bg-stone-800',
  secondary: 'border-stone-400 bg-white text-stone-950 hover:border-stone-950 hover:bg-stone-50',
  ghost: 'border-stone-300 bg-stone-50/70 text-stone-800 hover:border-stone-600 hover:bg-stone-100',
} as const

export function getButtonClass(tone: keyof typeof buttonToneClass = 'primary', className?: string) {
  return cx(buttonBaseClass, buttonToneClass[tone], className)
}

export function DevAiLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cx('inline-flex items-center gap-1', className)}>
      {isDevelopment && <span aria-hidden="true">✨</span>}
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
    <Link href={href} className="rounded-xl transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {featuredCharacters.map((char) => (
            <CharacterAvatar
              key={char.id}
              src={char.icon48}
              alt={`${char.name}のアイコン`}
              emoji={char.emoji}
              size={34}
              className="border-[#fcfaf6]"
            />
          ))}
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-stone-900 uppercase">Insight Cast</p>
          {subtitle !== false && (
            <p className="hidden text-xs text-stone-600 sm:block">{subtitle}</p>
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
    <header className="sticky top-0 z-30 border-b border-stone-900/10 bg-[rgba(255,250,242,0.88)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between gap-4 py-4">
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
            <div className="font-semibold text-stone-950">{title}</div>
            {description && <p className="mt-1 text-sm text-stone-700">{description}</p>}
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
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="mb-1 block text-sm font-medium text-stone-700">
      {children}
      {required && <span className="text-red-400"> *</span>}
    </label>
  )
}

export function TextInput(props: ComponentPropsWithoutRef<'input'>) {
  const { className, ...rest } = props

  return (
    <input
      {...rest}
      className={cx(
        'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 transition-all duration-150 placeholder:text-stone-400 hover:border-stone-400/70 focus:outline-none focus:ring-2 focus:ring-amber-600/40',
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

export function SurfaceCard({
  children,
  className,
  tone = 'default',
  interactive = false,
}: {
  children: ReactNode
  className?: string
  tone?: 'default' | 'warm' | 'dark' | 'soft'
  interactive?: boolean
}) {
  const toneClass = {
    default: 'border-stone-300/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,252,247,0.94))]',
    warm: 'border-amber-300/80 bg-[linear-gradient(145deg,rgba(255,247,230,0.98),rgba(255,253,249,0.95))]',
    dark: 'border-stone-950 bg-[linear-gradient(145deg,rgba(28,25,23,0.98),rgba(17,24,39,0.98))] text-white',
    soft: 'border-stone-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,245,244,0.94))]',
  }[tone]

  return (
    <div className={cx(
      'rounded-[2rem] border p-6',
      toneClass,
      interactive && 'card-interactive',
      className,
    )}>
      {children}
    </div>
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
      'inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-white/95 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-amber-900 uppercase shadow-sm ring-1 ring-amber-100/80',
      className,
    )}>
      {children}
    </div>
  )
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div className={cx(align === 'center' ? 'mx-auto text-center' : '', className)}>
      <p className="text-xs font-semibold tracking-[0.22em] text-amber-700/80 uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">{description}</p>}
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
    neutral: 'bg-white/95 text-stone-700 ring-1 ring-stone-200',
    success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    info: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200',
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
    default: 'border-stone-200/80 bg-[rgba(255,253,249,0.94)]',
    soft: 'border-stone-200/80 bg-stone-50/90',
    warning: 'border-amber-200 bg-amber-50/90',
  }[tone]

  return (
    <div className={cx(
      'rounded-[2rem] border p-6',
      toneClass,
      align === 'center' ? 'text-center' : 'text-left',
    )}>
      <div className={cx('text-4xl mb-3', align === 'center' ? '' : 'w-fit')}>{icon}</div>
      <p className="text-base font-semibold text-stone-900">{title}</p>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-stone-700">{description}</p>
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
        'overflow-hidden rounded-full border border-stone-200 bg-white flex items-center justify-center flex-shrink-0',
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

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-stone-300 bg-stone-50/80 p-10 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-4 text-base font-semibold text-stone-900">{title}</p>
      {description && (
        <p className="mt-2 text-sm leading-7 text-stone-500">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
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
    ? 'border-amber-100 bg-amber-50/70'
    : 'border-stone-100 bg-white'
  const pointerClass = tone === 'soft'
    ? 'border-l-amber-100 border-b-amber-100 bg-amber-50/70'
    : 'border-l-stone-100 border-b-stone-100 bg-white'

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
        <div className={cx('rounded-[24px] border px-5 py-4', bubbleClass)}>
          {name && <p className="text-xs font-medium text-stone-400 mb-1">{name}</p>}
          <p className="text-sm font-medium text-stone-800 leading-relaxed">{title}</p>
          {description && (
            <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
