import Image from 'next/image'
import { CHARACTERS } from '@/lib/characters'

const featured = CHARACTERS.filter((c) => c.available).slice(0, 3)

export function FullPageLoading() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-10"
      style={{ background: 'var(--bg)' }}
    >
      {/* キャラアイコン群 */}
      <div className="flex items-end gap-[-8px]">
        {featured.map((char, i) => (
          <div
            key={char.id}
            className="relative overflow-hidden rounded-full border-2 border-[var(--surface)] shadow-md"
            style={{
              width: 56,
              height: 56,
              marginLeft: i === 0 ? 0 : -12,
              zIndex: featured.length - i,
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <Image
              src={char.icon48}
              alt={char.name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* ブランド */}
      <div className="flex flex-col items-center gap-3">
        <p className="font-serif text-2xl font-bold tracking-wide text-[var(--text)]">
          Insight <span className="text-[var(--accent)]">Cast</span>
        </p>
        <p className="text-sm text-[var(--text3)]">会話から、記事へ。あなたの当たり前を言葉に。</p>
      </div>

      {/* ローディングバー */}
      <div className="w-40 overflow-hidden rounded-full" style={{ height: 3, background: 'var(--border)' }}>
        <div
          className="h-full rounded-full animate-[page-load_1.4s_ease-in-out_infinite]"
          style={{ background: 'var(--accent)' }}
        />
      </div>
    </div>
  )
}
