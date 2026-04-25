import Image from 'next/image'
import { CATEGORY_LABELS, type Post } from '@/lib/blog-posts'
import type { Character } from '@/lib/characters'

type Variant = 'featured' | 'card' | 'detail' | 'mini'

function formatDateLabel(date: string) {
  const [year, month] = date.split('-')
  return `${year}.${month}`
}

const VARIANT_CLASS: Record<Variant, string> = {
  featured: 'min-h-[280px] p-7',
  card: 'h-[220px] p-5',
  detail: 'min-h-[320px] p-7 sm:p-8',
  mini: 'h-14 w-14 p-2.5',
}

const TITLE_CLASS: Record<Variant, string> = {
  featured: 'text-[22px] leading-[1.4]',
  card: 'text-[16px] leading-[1.45]',
  detail: 'text-[24px] leading-[1.35] sm:text-[28px]',
  mini: 'hidden',
}

const EXCERPT_CLASS: Record<Variant, string> = {
  featured: 'hidden',
  card: 'hidden',
  detail: 'mt-3 line-clamp-3 max-w-[28rem] text-sm leading-[1.75] text-[rgba(47,35,24,0.8)]',
  mini: 'hidden',
}

const CHARACTER_SIZE: Record<Variant, number> = {
  featured: 112,
  card: 84,
  detail: 120,
  mini: 36,
}

const CHARACTER_FRAME_CLASS: Record<Variant, string> = {
  featured: 'relative isolate shrink-0',
  card: 'relative isolate shrink-0',
  detail: 'relative isolate shrink-0',
  mini: '',
}

const CHARACTER_CLIP_CLASS: Record<Variant, string> = {
  featured: 'relative z-10 overflow-hidden rounded-[24px]',
  card: 'relative z-10 overflow-hidden rounded-[20px]',
  detail: 'relative z-10 overflow-hidden rounded-[26px]',
  mini: '',
}

const CHARACTER_AURA_CLASS: Record<Variant, string> = {
  featured: 'absolute inset-x-3 top-4 bottom-5 rounded-full bg-white/38 blur-2xl',
  card: 'absolute inset-x-2 top-3 bottom-4 rounded-full bg-white/34 blur-xl',
  detail: 'absolute inset-x-4 top-5 bottom-6 rounded-full bg-white/34 blur-2xl',
  mini: 'hidden',
}

const CHARACTER_SHADOW_CLASS: Record<Variant, string> = {
  featured: 'absolute bottom-1 left-1/2 h-4 w-[70%] -translate-x-1/2 rounded-full bg-[rgba(47,35,24,0.16)] blur-xl',
  card: 'absolute bottom-0 left-1/2 h-3.5 w-[68%] -translate-x-1/2 rounded-full bg-[rgba(47,35,24,0.14)] blur-lg',
  detail: 'absolute bottom-1 left-1/2 h-5 w-[72%] -translate-x-1/2 rounded-full bg-[rgba(47,35,24,0.16)] blur-xl',
  mini: 'hidden',
}

const CHARACTER_IMAGE_CLASS: Record<Variant, string> = {
  featured: 'relative z-10 object-contain drop-shadow-[0_16px_24px_rgba(60,44,28,0.18)]',
  card: 'relative z-10 object-contain drop-shadow-[0_12px_18px_rgba(60,44,28,0.16)]',
  detail: 'relative z-10 object-contain drop-shadow-[0_18px_28px_rgba(60,44,28,0.18)]',
  mini: 'object-contain',
}

export function BlogCoverArt({
  post,
  char,
  variant = 'card',
}: {
  post: Post
  char: Character
  variant?: Variant
}) {
  const isMini = variant === 'mini'

  return (
    <div className={`relative overflow-hidden rounded-[inherit] ${post.coverColor} ${VARIANT_CLASS[variant]}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_36%),linear-gradient(160deg,rgba(255,255,255,0.26),rgba(255,255,255,0.04))]" />
      <div className="absolute -right-10 -top-6 text-[100px] opacity-[0.11] sm:text-[140px]" aria-hidden="true">
        {char.emoji}
      </div>
      {!isMini && (
        <>
          <div className="absolute left-5 top-16 h-24 w-24 rounded-full border border-white/30 bg-white/20 blur-2xl" aria-hidden="true" />
          <div className="absolute bottom-6 left-6 h-16 w-32 rounded-full border border-[rgba(47,35,24,0.08)] bg-white/20 blur-xl" aria-hidden="true" />
        </>
      )}

      <div className="relative flex h-full flex-col justify-between">
        {!isMini && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[rgba(47,35,24,0.78)]">
                {CATEGORY_LABELS[post.category]}
              </span>
              {post.type === 'interview' && (
                <span className="rounded-full border border-[#0f766e]/15 bg-[#ecfdf5]/85 px-2.5 py-1 text-xs font-semibold text-[#0f766e]">
                  Interview
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold tracking-[0.08em] text-[rgba(47,35,24,0.55)]">
              {formatDateLabel(post.date)}
            </span>
          </div>
        )}

        <div className={isMini ? 'flex h-full items-center justify-center' : 'mt-auto flex items-end justify-between gap-5'}>
          {!isMini && (
            <div className="min-w-0 max-w-[72%]">
              {variant === 'detail' ? (
                <>
                  <p className={`font-bold text-[var(--text)] ${TITLE_CLASS[variant]}`}>
                    {post.title}
                  </p>
                  <p className={EXCERPT_CLASS[variant]}>{post.excerpt}</p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(47,35,24,0.5)]">
                    Insight Cast Blog
                  </p>
                  <p className="mt-2 text-[16px] font-bold leading-[1.45] text-[var(--text)]">
                    {char.name}が見つける、まだ言葉になっていない価値
                  </p>
                </>
              )}
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[rgba(47,35,24,0.72)]">
                <span>{char.name}</span>
                <span className="text-[rgba(47,35,24,0.38)]">/</span>
                <span>{char.species}</span>
              </div>
            </div>
          )}

          <div className={CHARACTER_FRAME_CLASS[variant]}>
            {!isMini && (
              <>
                <div aria-hidden="true" className={CHARACTER_AURA_CLASS[variant]} />
                <div aria-hidden="true" className={CHARACTER_SHADOW_CLASS[variant]} />
              </>
            )}
            <div className={CHARACTER_CLIP_CLASS[variant]}>
              <Image
                src={variant === 'mini' ? char.icon48 : char.icon96}
                alt={char.name}
                width={CHARACTER_SIZE[variant]}
                height={CHARACTER_SIZE[variant]}
                className={CHARACTER_IMAGE_CLASS[variant]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
