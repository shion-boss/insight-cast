'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * フィルター変更時の進行表示。
 * - 1 回ずつのスイープアニメーション (左端→右端) を連続再生する
 * - `pending=true` のあいだは終わるたびに次のスイープを開始
 * - `pending=false` になっても、現在再生中のスイープは右端まで走り切ってから消える
 */
export function FilterProgressBar({ pending }: { pending: boolean }) {
  const [showing, setShowing] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const prevPending = useRef(false)

  useEffect(() => {
    if (pending && !prevPending.current) {
      // pending が立ち上がった瞬間にスイープ開始
      setAnimKey((k) => k + 1)
      setShowing(true)
    }
    prevPending.current = pending
  }, [pending])

  function handleAnimationEnd() {
    if (pending) {
      // まだ読み込み中なら次のスイープへ
      setAnimKey((k) => k + 1)
    } else {
      // 完了したので消す
      setShowing(false)
    }
  }

  return (
    <div
      role="progressbar"
      aria-busy={pending}
      aria-label="フィルター反映中"
      className="relative mb-3 h-[2px] w-full overflow-hidden"
    >
      {showing && (
        <>
          <div className="absolute inset-0 bg-[var(--accent)]/15" />
          <div
            key={animKey}
            className="absolute inset-y-0 left-0 w-1/4 rounded-full bg-[var(--accent)] animate-progress-sweep"
            onAnimationEnd={handleAnimationEnd}
          />
        </>
      )}
    </div>
  )
}
