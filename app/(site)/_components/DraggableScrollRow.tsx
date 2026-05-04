'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * 横スクロール領域を、PCではマウスドラッグでもスクロールできるようにするラッパー。
 * モバイルは通常のタッチスクロールに任せる（pointer type で分岐）。
 */
export function DraggableScrollRow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const stateRef = useRef<{ startX: number; startScroll: number; movedPx: number } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      stateRef.current = { startX: e.clientX, startScroll: el.scrollLeft, movedPx: 0 }
      setDragging(true)
      el.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      const s = stateRef.current
      if (!s) return
      const dx = e.clientX - s.startX
      s.movedPx = Math.max(s.movedPx, Math.abs(dx))
      el.scrollLeft = s.startScroll - dx
    }
    const finish = (e: PointerEvent) => {
      const s = stateRef.current
      stateRef.current = null
      setDragging(false)
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
      // 5px 以上動いていたら直後の click をキャンセル（カードリンクへの誤遷移を防ぐ）
      if (s && s.movedPx > 5) {
        const onClickCapture = (ev: MouseEvent) => {
          ev.stopPropagation()
          ev.preventDefault()
          el.removeEventListener('click', onClickCapture, true)
        }
        el.addEventListener('click', onClickCapture, true)
        setTimeout(() => el.removeEventListener('click', onClickCapture, true), 0)
      }
    }
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', finish)
    el.addEventListener('pointercancel', finish)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', finish)
      el.removeEventListener('pointercancel', finish)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`${className} ${dragging ? 'cursor-grabbing select-none' : 'md:cursor-grab'}`}
    >
      {children}
    </div>
  )
}
