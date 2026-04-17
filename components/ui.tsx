import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function PageHeader({
  title,
  backHref,
  backLabel = '← 戻る',
  right,
}: {
  title: ReactNode
  backHref?: string
  backLabel?: ReactNode
  right?: ReactNode
}) {
  return (
    <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
      <div className="font-semibold text-stone-800">{title}</div>
      {right ?? (backHref ? (
        <Link
          href={backHref}
          className="text-sm text-stone-500 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 rounded-md transition-colors"
        >
          {backLabel}
        </Link>
      ) : <div />)}
    </header>
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
    <label className="block text-sm text-stone-600 mb-1">
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
        'w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300',
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
      className={cx(
        'bg-stone-800 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors cursor-pointer',
        className,
      )}
    />
  )
}

export function SecondaryButton(props: ComponentPropsWithoutRef<'button'>) {
  const { className, type = 'button', ...rest } = props

  return (
    <button
      type={type}
      {...rest}
      className={cx(
        'border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors cursor-pointer',
        className,
      )}
    />
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
    default: 'border-stone-100 bg-white',
    soft: 'border-stone-100 bg-stone-50/80',
    warning: 'border-amber-100 bg-amber-50/70',
  }[tone]

  return (
    <div className={cx(
      'rounded-2xl border p-6',
      toneClass,
      align === 'center' ? 'text-center' : 'text-left',
    )}>
      <div className={cx('text-4xl mb-3', align === 'center' ? '' : 'w-fit')}>{icon}</div>
      <p className="text-base font-medium text-stone-800">{title}</p>
      {description && (
        <p className="text-sm text-stone-500 mt-2 leading-relaxed">{description}</p>
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
      aria-hidden="true"
    >
      {src ? (
        <Image src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span className="text-lg">{emoji ?? '🙂'}</span>
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
        <div className={cx('rounded-[24px] border px-5 py-4 shadow-sm', bubbleClass)}>
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
