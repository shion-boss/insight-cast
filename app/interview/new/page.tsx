import { CHARACTERS } from '@/lib/characters'
import { createSession } from '@/lib/actions/interview'
import Link from 'next/link'
import { CharacterAvatar, DevAiLabel } from '@/components/ui'

export default function NewInterviewPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/home" className="text-sm text-stone-400 hover:text-stone-600">
            ← 戻る
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 mt-4">取材班を選ぶ</h1>
          <p className="text-sm text-stone-500 mt-1">どの観点からお店の魅力を引き出しますか？</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CHARACTERS.map((char) => (
            <div key={char.id}>
              {char.available ? (
                <form action={createSession.bind(null, char.id)}>
                  <button
                    type="submit"
                    className="w-full text-left p-4 bg-white rounded-xl border border-stone-200 hover:border-stone-400 transition-colors"
                  >
                    <CharacterAvatar
                      src={char.icon96}
                      alt={`${char.name}のアイコン`}
                      emoji={char.emoji}
                      size={56}
                      className="mb-2 border-stone-100"
                    />
                    <div className="font-medium text-stone-800 text-sm">{char.name}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{char.species}</div>
                    {char.label && (
                      <div className="text-xs text-amber-600 mt-1">{char.label}</div>
                    )}
                    <div className="text-xs text-stone-500 mt-2">{char.description}</div>
                    <div className="text-xs text-stone-300 mt-2">
                      <DevAiLabel>AI使用</DevAiLabel>
                    </div>
                  </button>
                </form>
              ) : (
                <div className="w-full p-4 bg-white rounded-xl border border-stone-100 opacity-50 cursor-not-allowed">
                  <CharacterAvatar
                    src={char.icon48}
                    alt={`${char.name}のアイコン`}
                    emoji={char.emoji}
                    size={44}
                    className="mb-2 grayscale"
                  />
                  <div className="font-medium text-stone-600 text-sm">{char.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{char.species}</div>
                  {char.label && (
                    <div className="text-xs text-stone-400 mt-1">{char.label}</div>
                  )}
                  <div className="text-xs text-stone-400 mt-2">準備中</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
