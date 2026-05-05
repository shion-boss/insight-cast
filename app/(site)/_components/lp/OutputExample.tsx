import Image from 'next/image'

import { CharacterAvatar } from '@/components/ui'
import { CHARACTERS } from '@/lib/characters'

import { LpCopyableCard } from '../LpCopyableCard'

const freeCast = CHARACTERS.filter((char) => char.available)

export function OutputExample() {
  return (
    <section className="py-14 sm:py-[88px] bg-[var(--bg2)]">
      <div className="mx-auto max-w-[1160px] px-6 sm:px-8 lg:px-12">
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--accent)]">Output Example</div>
        <h2 className="font-[family-name:var(--font-noto-serif-jp)] mt-3 font-bold text-[var(--text)]" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
          会話から、記事へ。
        </h2>
        <p className="text-base text-[var(--text2)] mt-3 max-w-[520px]">
          会話から引き出した価値をもとにテーマを作成し、複数の形式で記事をお届けします。あとは投稿先でコピー&ペーストするだけで完了です。
        </p>
        <div className="mt-11 grid gap-8 xl:grid-cols-2">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] overflow-hidden">
            <div className="px-[22px] py-4 border-b border-[var(--border)] bg-[var(--bg2)] flex items-center gap-2.5">
              <CharacterAvatar src={freeCast[0]?.icon48} alt={`${freeCast[0]?.name ?? 'ミント'}のアイコン`} emoji={freeCast[0]?.emoji} size={28} />
              <span className="text-[13px] font-bold text-[var(--text)]">{freeCast[0]?.name ?? 'ミント'}の取材ログ</span>
              <span className="ml-auto bg-[var(--teal-l)] text-[var(--teal)] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">完了</span>
            </div>
            <div className="p-[22px] flex flex-col gap-4">
              {[
                { from: 'cast', text: '仕事の時間帯って、どのくらいで動いてることが多いですか？' },
                { from: 'user', text: 'うちは戸建てがメインなんで、朝8時ごろから15時ごろには終わらせるようにしてますね。早すぎても遅すぎてもお客さんに迷惑かかるので。' },
                { from: 'cast', text: '15時ごろに終わらせるって、最初からそうしてたんですか？' },
                { from: 'user', text: '父の代からそうしてるんで、自分では特に意識したことなかったですね。塗り替えって、お客さんだけじゃなくて近所の方の理解があってこそできる仕事なので、そこは大事にしてます。' },
                { from: 'cast', text: '近所の方のことまで考えてるんですね。正直、そこまで意識してる業者さんってなかなかいないと思うんですが。' },
                { from: 'user', text: '当たり前のことだと思ってたんですけど、言われてみるとそうかもしれないですね。父から教わってきたんで、自然とそうなってた感じです。' },
              ].map((msg, i) => (
                msg.from === 'cast' ? (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden border border-[var(--border)]">
                      {freeCast[0]?.icon48
                        ? <Image src={freeCast[0].icon48} alt={freeCast[0].name} width={28} height={28} className="w-full h-full object-cover" />
                        : <span className="text-base leading-none">{freeCast[0]?.emoji}</span>}
                    </div>
                    <div className="max-w-[75%] bg-[var(--bg2)] border border-[var(--border)] rounded-[4px_14px_14px_14px] px-3.5 py-2.5 text-[13px] text-[var(--text2)] leading-[1.75]">{msg.text}</div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[75%] bg-[var(--accent-l)] rounded-[14px_4px_14px_14px] px-3.5 py-2.5 text-[13px] text-[var(--text)] leading-[1.75]">{msg.text}</div>
                  </div>
                )
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {/* キャラ吹き出しヘッダー */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4">
              <div className="flex-shrink-0">
                {freeCast[0]?.icon48
                  ? <Image src={freeCast[0].icon48} alt={freeCast[0].name} width={40} height={40} className="rounded-full border border-[var(--border)] object-cover" />
                  : <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg">{freeCast[0]?.emoji ?? '🐱'}</div>}
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--text2)]">
                記事をまとめました。好きな形式でお使いください。
              </div>
            </div>
            {/* アクションボタン行 */}
            <div className="border-b border-[var(--border)] px-4 pt-2 pb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--text3)] whitespace-nowrap">全文コピー</span>
                <span className="min-h-[36px] inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">テキスト</span>
                <span className="min-h-[36px] inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">Markdown</span>
              </div>
              <span aria-hidden="true" className="hidden sm:inline-block h-4 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--text3)] whitespace-nowrap">書き出し</span>
                <span className="min-h-[36px] inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">.txt</span>
                <span className="min-h-[36px] inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">.md</span>
              </div>
            </div>
            {/* ブロック */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              {/* タイトル */}
              <LpCopyableCard label="タイトル" text="創業者の父から受け継いだ思いやり。">
                <p className="whitespace-pre-wrap leading-relaxed text-[var(--text)] text-base font-bold">創業者の父から受け継いだ思いやり。</p>
              </LpCopyableCard>
              {/* 概要 */}
              <LpCopyableCard label="概要" text="うちは戸建てのお客さんを中心に外壁塗装をやっています。父の代からずっと、朝8時ごろから15時ごろには作業を終わらせるようにしていて、自分もそれを引き継いでいます。">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">うちは戸建てのお客さんを中心に外壁塗装をやっています。父の代からずっと、朝8時ごろから15時ごろには作業を終わらせるようにしていて、自分もそれを引き継いでいます。</p>
              </LpCopyableCard>
              {/* セクション（小見出し＋本文）— 1カード内で divider 区切り */}
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <LpCopyableCard variant="segment" label="小見出し" text="近所の方への気遣いも、仕事のうちだと思っています">
                  <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[var(--text)]">近所の方への気遣いも、仕事のうちだと思っています</p>
                </LpCopyableCard>
                <div className="border-t border-[var(--border)]" />
                <LpCopyableCard variant="segment" label="本文" text={'塗装の仕事って、お客さんだけじゃなくて近所の方にも迷惑をかけることがあるんです。足場を組めば通路が狭くなるし、作業音もあります。だから時間帯にはずっと気をつけてきました。\n\n自分では当たり前のことだと思っていたんですが、取材でそう話したら「そこまで意識している業者さんは少ない」と言われて、少し驚きました。父から教わったことなので、これからも変わらずやっていきたいです。'}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">{'塗装の仕事って、お客さんだけじゃなくて近所の方にも迷惑をかけることがあるんです。足場を組めば通路が狭くなるし、作業音もあります。だから時間帯にはずっと気をつけてきました。\n\n自分では当たり前のことだと思っていたんですが、取材でそう話したら「そこまで意識している業者さんは少ない」と言われて、少し驚きました。父から教わったことなので、これからも変わらずやっていきたいです。'}</p>
                </LpCopyableCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
