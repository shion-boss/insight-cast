'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CharacterAvatar } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'

type CastId = 'mint' | 'claus' | 'rain' | 'cocco' | 'hal' | 'mogro'

type Choice = {
  id: string
  label: string
  cast: CastId
  reason: string
  alt?: { castId: CastId; note: string }
}

const choices: Choice[] = [
  {
    id: 'personality',
    label: '話せば分かるのに、ホームページからは伝わってこない',
    cast: 'mint',
    reason: 'やさしい雰囲気で、ふだん通りの会話の中から人柄や空気感をそっと拾い上げます。最初の取材にも、迷っているときにも合います。',
    alt: { castId: 'hal', note: '写真と一緒に空気感も添えたいときは、こちらにもバトンタッチを。' },
  },
  {
    id: 'expert-stiff',
    label: '専門知識を書くと堅くなる。でも内容は薄めたくない',
    cast: 'claus',
    reason: '業種知識をもとに「なぜそうしているか」から言葉にし、専門性と読みやすさを両立させます。',
  },
  {
    id: 'differ-unclear',
    label: '競合と何が違うのか、自分でも整理できていない',
    cast: 'rain',
    reason: 'マーケティング視点で、競合との違いや「なぜ選ばれているか」を一緒に浮かび上がらせます。',
  },
  {
    id: 'photo-words',
    label: '写真は撮れるけど、文章になると手が止まる',
    cast: 'hal',
    reason: '写真を入り口に、当時のことや雰囲気を会話で広げて、文章になる素材にしていきます。じっくり話さなくて大丈夫。',
    alt: { castId: 'mint', note: '会話の方が安心して話せそうだったら、こちらに切り替えても。' },
  },
  {
    id: 'obvious',
    label: '強みと聞かれても、自分では特に思いつかない',
    cast: 'mogro',
    reason: 'はい / いいえの積み重ねで、当たり前すぎて見えなくなった価値を静かに掘り起こします。輪郭がだんだん見えてきます。',
    alt: { castId: 'mint', note: '輪郭が見えてきたら、ふだん通りの会話で広げる相手として。' },
  },
  {
    id: 'loyalty',
    label: 'お客さんから喜ばれているのに、その理由を自分では言葉にできない',
    cast: 'mint',
    reason: 'お客様目線で、感謝された場面や言葉を一緒にほぐしながら、ホームページで使える素材に変えていきます。',
    alt: { castId: 'rain', note: '理由を「選ばれる軸」として磨き直すなら、こちらが補ってくれます。' },
  },
  {
    id: 'expert-craft',
    label: 'こだわってやっているのに、その違いを説明できない',
    cast: 'claus',
    reason: '判断基準やこだわりの背景を「なぜ」から掘り下げ、技術の違いを伝わる言葉に置き換えていきます。',
    alt: { castId: 'rain', note: '違いを「選ばれる理由」として整えるなら、こちらも合います。' },
  },
  {
    id: 'thin-vs-peers',
    label: '同業のホームページを見ると、自分のホームページが薄く感じる',
    cast: 'rain',
    reason: '他社と何が違うかを、競合の言葉とあなたの言葉の差から見つけ、ホームページの軸を整え直します。',
  },
  {
    id: 'atmosphere',
    label: '言葉より、見てもらったほうが早い気がする',
    cast: 'hal',
    reason: '写真や場面を入り口に、言葉になっていなかった雰囲気を一緒にすくい上げていきます。',
  },
  {
    id: 'fresh',
    label: '季節の話題やキャンペーンを、ホームページやSNSにすぐ反映したい',
    cast: 'cocco',
    reason: 'いま伝えたい話題を、ホームページやSNSにそのまま使える短い言葉に仕立て直します。鮮度のうちに。',
  },
]

export function CastFitFinder() {
  const [pickedId, setPickedId] = useState<string | null>(choices[0]?.id ?? null)

  const picked = pickedId ? choices.find((c) => c.id === pickedId) ?? null : null
  const cast = picked ? CHARACTERS.find((c) => c.id === picked.cast) : null
  const altCast = picked?.alt ? CHARACTERS.find((c) => c.id === picked.alt!.castId) : null

  const handleReset = () => setPickedId(null)

  return (
    <div className="rounded-[var(--shape-xl)] border border-[var(--border)] bg-gradient-to-br from-[#fdf7f0] to-[#f5e8d8] shadow-[var(--elevation-1)]">
      <div className="p-6 sm:p-10">
        {/* ヘッダー */}
        <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--on-primary-container)]">
          Cast Match
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-noto-serif-jp)] text-[24px] sm:text-[30px] font-bold leading-[1.25] text-[var(--text)]">
          あなたの悩み、<span className="text-[var(--accent)]">いちばん近い</span>のはどれ？
        </h3>
        <p className="mt-2.5 max-w-xl text-[13px] leading-[1.85] text-[var(--text2)]">
          近いものをひとつ選ぶと、相性のよいキャストをご案内します。気になった方はそのまま下の紹介で確認できます。
        </p>

        {/* 選択肢 10個 */}
        <div className="mt-6 grid gap-2.5 lg:grid-cols-2">
          {choices.map((c) => {
            const active = pickedId === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setPickedId(c.id)}
                aria-pressed={active}
                className={`text-left rounded-[var(--shape-sm)] border px-4 py-3.5 text-[13px] leading-[1.65] transition-colors cursor-pointer ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent-l)] text-[var(--accent)] font-semibold'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:border-[var(--accent)] hover:bg-[var(--accent-l)] hover:text-[var(--accent)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="flex-1">{c.label}</span>
                  {active && <span aria-hidden="true" className="text-[12px] opacity-70">✓</span>}
                </span>
              </button>
            )
          })}
        </div>

        {/* やりなおす */}
        {pickedId && (
          <div className="mt-5">
            <button
              type="button"
              onClick={handleReset}
              className="text-[12px] text-[var(--text3)] underline underline-offset-2 hover:text-[var(--text2)] cursor-pointer"
            >
              やりなおす
            </button>
          </div>
        )}

        {/* 結果カード */}
        {picked && cast && (
          <div
            key={picked.id}
            className="cast-match-card mt-6 grid gap-5 rounded-[var(--shape-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--elevation-2)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-7"
            style={{ animation: 'cast-match-card-in .4s cubic-bezier(.22,1,.36,1) forwards' }}
          >
            {/* アバター */}
            <div className="shrink-0">
              <div
                className="overflow-hidden rounded-full"
                style={{
                  width: 84,
                  height: 84,
                  boxShadow: '0 0 0 3px var(--accent), 0 0 0 8px color-mix(in srgb, var(--accent) 12%, transparent)',
                }}
              >
                <CharacterAvatar
                  src={cast.icon96}
                  alt={`${cast.name}のアイコン`}
                  emoji={cast.emoji}
                  size={84}
                  className="!border-0"
                />
              </div>
            </div>

            {/* テキスト */}
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[.09em] text-[var(--on-primary-container)]">
                あなたへのおすすめキャスト
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="font-[family-name:var(--font-noto-serif-jp)] text-[26px] font-bold leading-tight text-[var(--text)]">
                  {cast.name}
                </span>
                <span className="text-[12px] font-semibold tracking-[.04em] text-[var(--on-primary-container)]">{cast.label}</span>
              </div>
              <p className="mt-2 text-[13px] leading-[1.85] text-[var(--text2)]">{picked.reason}</p>
              {altCast && picked.alt && (
                <div className="mt-3 flex items-start gap-2.5 rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--bg2)] p-2.5">
                  <CharacterAvatar
                    src={altCast.icon48}
                    alt={`${altCast.name}のアイコン`}
                    emoji={altCast.emoji}
                    size={28}
                    className="flex-shrink-0 border-[var(--border)] bg-[var(--surface)]"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--on-primary-container)]">
                      あわせて検討 · {altCast.name}
                    </div>
                    <p className="text-[11px] leading-[1.6] text-[var(--text2)]">{picked.alt.note}</p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
              <Link
                href={`/cast#${cast.id}`}
                className="inline-flex items-center justify-center gap-1 rounded-[var(--shape-sm)] bg-[var(--accent)] px-5 py-2.5 text-[13px] font-semibold text-white whitespace-nowrap transition-colors hover:bg-[var(--accent-h)]"
              >
                {cast.name}の紹介を見る <span aria-hidden="true">→</span>
              </Link>
              <span className="text-center text-[11px] text-[var(--text3)] sm:text-right">無料で試せます</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
