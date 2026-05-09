import Image, { type StaticImageData } from 'next/image'
import { getCharacter } from '@/lib/characters'

/**
 * 期間限定キャスト（ハル・モグロ・コッコ）の訴求バナー。
 * LP の pricing セクション直下と、料金ページの addon-cast セクションに置く。
 *
 * デザイン由来: claude.ai/design 経由の lp-limited-banner.html
 * - 暗背景 + 暖かいラジアルグロー
 * - 左にコピー、右にキャラ3体（PC）／上にキャラ・下にコピー（モバイル）
 * - 「期間限定」の小さな pulsing dot タグ
 */
export function LimitedCastBanner() {
  const cocco = getCharacter('cocco')
  const mogro = getCharacter('mogro')
  const hal = getCharacter('hal')

  // 画像サイズはキャラ間で統一する。元のデザイン (150/130/140) は意図的な
  // 高さ違いだが、実キャラ画像（portrait-half.png）は各キャラで頭の大きさや
  // ポーズが微妙に違うため、サイズを揃えた方が「会社が運営しているチーム」
  // という世界観に合う。
  const PC_SIZE = 144
  const SP_SIZE = 100
  const characters = [
    { id: 'cocco', name: cocco?.name ?? 'コッコ', portrait: cocco?.portrait, price: '¥9,800' },
    { id: 'mogro', name: mogro?.name ?? 'モグロ', portrait: mogro?.portrait, price: '¥9,800' },
    { id: 'hal', name: hal?.name ?? 'ハル', portrait: hal?.portrait, price: '¥14,800' },
  ] as const

  return (
    <>
      {/* ════ PC: md 以上 ════ */}
      <div
        className="hidden md:grid relative overflow-hidden rounded-[6px] w-full"
        style={{
          background: 'var(--surface-dark)',
          gridTemplateColumns: '1fr auto',
          alignItems: 'end',
        }}
      >
        {/* warm glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 18% 55%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 52%), radial-gradient(ellipse at 82% 80%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 48%)',
          }}
        />
        <div className="relative z-[2] self-stretch flex flex-col justify-center gap-4 p-12">
          <BannerTag />
          <BannerHeading
            mainLines={['プラン契約で、3人のAIキャストが']}
            em="追加料金なしで使えます。"
            sizeClass="text-[clamp(18px,2vw,26px)]"
          />
          <p
            className="leading-[1.85] max-w-[440px] text-[13px]"
            style={{ color: 'rgba(240,232,220,0.62)', textWrap: 'pretty' }}
          >
            コッコ・モグロ・ハルは通常、買い切り課金でのみご利用いただけます。今のうちにプランをご契約いただくと、アカウント削除まで無料でご利用可能。買い切りプランへ移行後も引き続きご利用いただけます。
          </p>
          <BannerValueRow showLabel showNote priceSize={20} />
          <BannerFineList
            items={[
              'アカウント削除まで無期限で使用可能',
              '買い切りへの移行後も継続利用OK',
              'このキャンペーンは予告なく終了します',
            ]}
            sizeClass="text-[12px]"
          />
        </div>
        <div className="relative z-[1] flex flex-shrink-0 items-end self-end gap-3 pr-8 pb-2">
          {characters.map((c) => (
            <CharSlot key={c.id} name={c.name} portrait={c.portrait} price={c.price} size={PC_SIZE} />
          ))}
        </div>
      </div>

      {/* ════ Mobile: md 未満 ════ */}
      <div
        className="md:hidden relative overflow-hidden rounded-[6px] w-full max-w-[390px] mx-auto"
        style={{ background: 'var(--surface-dark)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 25%, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-[1] flex justify-center items-end gap-2 pt-7 px-3">
          {characters.map((c) => (
            <CharSlot key={c.id} name={c.name} portrait={c.portrait} price={c.price} size={SP_SIZE} />
          ))}
        </div>
        <div className="relative z-[1] flex flex-col gap-3.5 px-6 pt-4 pb-7">
          <BannerTag />
          <BannerHeading
            mainLines={['プラン契約で、3人の', 'AIキャストが']}
            em="無料に。"
            sizeClass="text-[17px]"
            asHeading={false}
          />
          <p
            className="leading-[1.85] text-[12px]"
            style={{ color: 'rgba(240,232,220,0.62)', textWrap: 'pretty' }}
          >
            コッコ・モグロ・ハルは通常買い切り。今だけプラン契約者は追加料金なし・アカウント削除まで利用可能。
          </p>
          <BannerValueRow priceSize={18} compact />
          <BannerFineList
            items={['買い切り移行後も継続利用OK', '予告なく終了する場合があります']}
            sizeClass="text-[11px]"
          />
        </div>
      </div>
    </>
  )
}

function BannerTag() {
  return (
    <span
      className="inline-flex items-center gap-[7px] rounded-[2px] px-3 py-[5px] text-[11px] font-bold uppercase w-fit"
      style={{
        background: 'var(--accent)',
        color: '#fff',
        letterSpacing: '0.14em',
      }}
    >
      <span
        aria-hidden="true"
        className="block h-1.5 w-1.5 rounded-full bg-white"
        style={{
          opacity: 0.7,
          animation: 'limited-banner-pulse 1.6s ease-in-out infinite',
        }}
      />
      期間限定
    </span>
  )
}

function BannerHeading({
  mainLines,
  em,
  sizeClass,
  asHeading = true,
}: {
  mainLines: readonly string[]
  em: string
  sizeClass: string
  // PC/SP 両方の DOM が同居するので、h2 を出すのはどちらか片方だけ。
  // false なら p+role=heading なしの段落としてレンダリングする（重複 h2 を防ぐ）。
  asHeading?: boolean
}) {
  const className = `font-[family-name:var(--font-noto-serif-jp)] font-bold leading-[1.6] ${sizeClass}`
  const style = { color: '#f0e8dc', textWrap: 'pretty' as const }
  const inner = (
    <>
      {mainLines.map((line, i) => (
        <span key={i}>
          {line}
          <br />
        </span>
      ))}
      <span style={{ color: '#f5c87a' }}>{em}</span>
    </>
  )
  if (asHeading) {
    return <h2 className={className} style={style}>{inner}</h2>
  }
  return <p className={className} style={style}>{inner}</p>
}

function BannerValueRow({
  showLabel = false,
  showNote = false,
  compact = false,
  priceSize,
}: {
  showLabel?: boolean
  showNote?: boolean
  compact?: boolean
  priceSize: number
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {showLabel && (
        <span className="text-[11px]" style={{ color: 'rgba(240,232,220,0.5)' }}>
          通常合計
        </span>
      )}
      <span
        className="font-[family-name:var(--font-noto-serif-jp)] font-bold"
        style={{ color: '#f5c87a', fontSize: `${priceSize}px` }}
      >
        ¥34,400 相当
      </span>
      {showNote && (
        <span className="text-[11px]" style={{ color: 'rgba(240,232,220,0.42)' }}>
          （¥9,800 + ¥9,800 + ¥14,800）が0円に
        </span>
      )}
      {compact && !showNote && (
        <span className="text-[11px]" style={{ color: 'rgba(240,232,220,0.42)' }}>
          が 0円に
        </span>
      )}
    </div>
  )
}

function BannerFineList({ items, sizeClass }: { items: readonly string[]; sizeClass: string }) {
  return (
    <div className="flex flex-col gap-[5px]">
      {items.map((text) => (
        <span
          key={text}
          className={`flex items-center gap-[7px] leading-[1.5] ${sizeClass}`}
          style={{ color: 'rgba(240,232,220,0.52)' }}
        >
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true" className="flex-shrink-0" style={{ color: 'var(--accent)' }}>
            <path d="M1 4.5L4.5 8L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {text}
        </span>
      ))}
    </div>
  )
}

function CharSlot({
  name,
  portrait,
  price,
  size,
}: {
  name: string
  portrait: StaticImageData | undefined
  price: string
  size: number
}) {
  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      {portrait && (
        <Image
          src={portrait}
          alt={name}
          width={size}
          height={size}
          className="block rounded-[8px]"
          style={{ objectFit: 'contain', objectPosition: 'bottom center', width: size, height: size }}
          sizes={`${size}px`}
        />
      )}
      <span
        className="absolute top-1 right-1 z-[3] rounded-[6px] px-[7px] py-[3px] text-[13px] font-bold text-white"
        style={{ background: 'color-mix(in srgb, var(--accent) 92%, transparent)', letterSpacing: '0.03em' }}
      >
        {price}
      </span>
      <span
        className="mt-1.5 text-[12px] font-medium leading-none"
        style={{ color: '#f0e8dc', letterSpacing: '0.04em' }}
      >
        {name}
      </span>
    </div>
  )
}
