import { createClient } from '@/lib/supabase/server'
import { CHARACTERS } from '@/lib/characters'
import { CharacterAvatar } from '@/components/ui'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur border-b border-stone-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <span className="font-semibold text-stone-800 tracking-tight">Insight Cast</span>
        <Link href="/auth/login" className="text-sm text-stone-500 hover:text-stone-700 transition-colors">
          ログイン
        </Link>
      </header>

      {/* ヒーロー */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center gap-3 mb-8">
          {CHARACTERS.filter((char) => ['mint', 'claus', 'rain'].includes(char.id)).map((char) => (
            <CharacterAvatar
              key={char.id}
              src={char.icon96}
              alt={`${char.name}のアイコン`}
              emoji={char.emoji}
              size={56}
              className="border-stone-100 shadow-sm"
            />
          ))}
        </div>
        <h1 className="text-3xl font-semibold text-stone-800 leading-snug mb-5">
          あなたにとっての当たり前は、<br />
          まだ伝わっていない価値かもしれません。
        </h1>
        <p className="text-stone-500 leading-relaxed mb-10">
          Insight Cast は、AIインタビューでそれを引き出し、<br />
          ホームページを少しずつ強くします。
        </p>
        <Link
          href="/auth/signup"
          className="inline-block px-8 py-3.5 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-sm font-medium"
        >
          まずは無料で試してみる
        </Link>
        <p className="text-xs text-stone-300 mt-3">クレジットカード不要</p>
      </section>

      {/* 3ステップ説明 */}
      <section className="bg-white border-y border-stone-100 py-16">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-lg font-semibold text-stone-700 text-center mb-10">3つのステップで、HPが変わる</h2>
          <div className="space-y-8">
            {[
              {
                emoji: '🦉',
                step: 'Step 1',
                title: 'あなたのHPと競合を調査します',
                desc: 'クラウスがホームページの内容を読み込み、伝えきれていないことを洗い出します。',
              },
              {
                emoji: '🐱',
                step: 'Step 2',
                title: 'インタビュアーが取材に来ます',
                desc: 'ミント・クラウス・レインが、あなたの中にある「当たり前の価値」を引き出します。',
              },
              {
                emoji: '🦊',
                step: 'Step 3',
                title: '記事になる素材を整理します',
                desc: '取材内容をもとに、HPに掲載できる記事や素材を作ります。',
              },
            ].map(({ emoji, step, title, desc }) => {
              const char = CHARACTERS.find((item) => item.emoji === emoji)
              return (
              <div key={step} className="flex gap-4">
                <CharacterAvatar
                  src={char?.icon48}
                  alt={`${char?.name ?? title}のアイコン`}
                  emoji={emoji}
                  size={48}
                  className="border-stone-100 bg-stone-50"
                />
                <div>
                  <p className="text-xs text-stone-400 font-medium mb-0.5">{step}</p>
                  <p className="text-stone-800 font-medium mb-1">{title}</p>
                  <p className="text-sm text-stone-500">{desc}</p>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* インタビュアー紹介 */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-lg font-semibold text-stone-700 text-center mb-8">取材班を紹介します</h2>
        <div className="grid grid-cols-3 gap-4">
          {CHARACTERS.filter((char) => ['mint', 'claus', 'rain'].includes(char.id)).map((char) => (
            <div key={char.id} className="bg-white rounded-xl border border-stone-100 p-4 text-center">
              <div className="flex justify-center mb-2">
                <CharacterAvatar
                  src={char.icon96}
                  alt={`${char.name}のアイコン`}
                  emoji={char.emoji}
                  size={60}
                  className="border-stone-100"
                />
              </div>
              <div className="text-sm font-medium text-stone-800">{char.name}</div>
              <div className="text-xs text-stone-400">{char.species}</div>
              {char.label && <div className="text-xs text-amber-600 mt-1 font-medium">{char.label}</div>}
              <div className="text-xs text-stone-500 mt-2 leading-relaxed">{char.specialty}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-800 py-16 text-center">
        <p className="text-white font-medium mb-2">まずは1回、取材を受けてみてください。</p>
        <p className="text-stone-400 text-sm mb-8">登録は無料。すぐに始められます。</p>
        <Link
          href="/auth/signup"
          className="inline-block px-8 py-3.5 bg-white text-stone-800 rounded-xl hover:bg-stone-100 transition-colors text-sm font-medium"
        >
          無料で始める
        </Link>
      </section>

      {/* フッター */}
      <footer className="bg-stone-50 border-t border-stone-100 px-6 py-6 text-center">
        <p className="text-xs text-stone-300">© 2026 Insight Cast</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/auth/login" className="text-xs text-stone-300 hover:text-stone-500">ログイン</Link>
          <Link href="/auth/signup" className="text-xs text-stone-300 hover:text-stone-500">新規登録</Link>
        </div>
      </footer>
    </div>
  )
}
