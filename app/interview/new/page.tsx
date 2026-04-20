import { CHARACTERS } from '@/lib/characters'
import { createSession } from '@/lib/actions/interview'
import Link from 'next/link'
import { CharacterAvatar, DevAiLabel } from '@/components/ui'

export default function NewInterviewPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/home" className="text-sm text-[var(--text3)] hover:text-[var(--text2)]">
            ← 戻る
          </Link>
          <h1 className="text-xl font-semibold text-[var(--text)] mt-4">取材班を選ぶ</h1>
          <p className="text-sm text-[var(--text3)] mt-1">どの観点からお店の魅力を引き出しますか？</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CHARACTERS.map((char) => (
            <div key={char.id}>
              {char.available ? (
                <form action={createSession.bind(null, char.id)}>
                  <button
                    type="submit"
                    className="w-full text-left p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-[var(--border2)] transition-colors"
                  >
                    <CharacterAvatar
                      src={char.icon96}
                      alt={`${char.name}のアイコン`}
                      emoji={char.emoji}
                      size={56}
                      className="mb-2 border-[var(--border)]"
                    />
                    <div className="font-medium text-[var(--text)] text-sm">{char.name}</div>
                    <div className="text-xs text-[var(--text3)] mt-0.5">{char.species}</div>
                    {char.label && (
                      <div className="text-xs text-amber-600 mt-1">{char.label}</div>
                    )}
                    <div className="text-xs text-[var(--text3)] mt-2">{char.description}</div>
                    <div className="text-xs text-[rgba(255,255,255,0.55)] mt-2">
                      <DevAiLabel>AI使用</DevAiLabel>
                    </div>
                  </button>
                </form>
              ) : (
                <div className="w-full p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] opacity-50 cursor-not-allowed">
                  <CharacterAvatar
                    src={char.icon48}
                    alt={`${char.name}のアイコン`}
                    emoji={char.emoji}
                    size={44}
                    className="mb-2 grayscale"
                  />
                  <div className="font-medium text-[var(--text2)] text-sm">{char.name}</div>
                  <div className="text-xs text-[var(--text3)] mt-0.5">{char.species}</div>
                  {char.label && (
                    <div className="text-xs text-[var(--text3)] mt-1">{char.label}</div>
                  )}
                  <div className="text-xs text-[var(--text3)] mt-2">準備中</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
